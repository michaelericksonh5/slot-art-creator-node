/**
 * slot-art-creator-node — MCP server (Node.js)
 *
 * Exposes four MCP tools:
 *   nb2_generate       — text-to-image (Gemini preferred, fal.ai fallback)
 *   nb2_edit           — image-to-image edit / reskin (Gemini preferred, fal.ai fallback)
 *   nb2_upscale        — 4K upscale (Gemini preferred, fal.ai fallback)
 *   nb2_smart_resize   — pixel-perfect multi-size resize (fal.ai PREFERRED — purpose-built
 *                        endpoint via nano-banana-pro; Gemini fallback uses NB2 + pngjs crop)
 *
 * Provider priority for generate / edit / upscale (gets Gemini when both keys present):
 *   1. GEMINI_API_KEY / GOOGLE_API_KEY present → Google Gemini (gemini-3.1-flash-image-preview)
 *   2. FAL_KEY present                          → fal.ai (fal-ai/nano-banana-2)
 *   3. Neither                                   → startup error with setup instructions
 *
 * Provider for nb2_smart_resize (different routing — fal preferred because the endpoint
 * is purpose-built for this task and faster than our Gemini-side recipe):
 *   1. FAL_KEY present                          → fal.ai (fal-ai/smart-resize, NB Pro under the hood)
 *   2. GEMINI_API_KEY / GOOGLE_API_KEY present  → our Gemini recipe — generate per-target with
 *                                                  NB2 + center-crop via pngjs to exact dimensions
 *   3. Neither                                   → tool returns a clean error message
 */

import { createRequire } from "module";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import { fal } from "@fal-ai/client";
import { GoogleGenAI } from "@google/genai";
import { PNG } from "pngjs";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as net from "net";
import * as http from "http";
import * as https from "https";
import { lookup } from "dns/promises";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Bootstrap — load .env from plugin root
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, "..");

// Load .env in priority order:
//   1. ~/.h5g-slot-art-creator/.env   (canonical, survives plugin reinstall)
//   2. PLUGIN_ROOT/.env                (legacy / fallback)
// Existing process.env values take precedence over either file (override:false).
try {
  const { default: dotenv } = await import("dotenv");
  const userEnv = path.join(os.homedir(), ".h5g-slot-art-creator", ".env");
  const pluginEnv = path.join(PLUGIN_ROOT, ".env");
  if (fs.existsSync(userEnv)) {
    dotenv.config({ path: userEnv, override: false });
  }
  if (fs.existsSync(pluginEnv)) {
    dotenv.config({ path: pluginEnv, override: false });
  }
} catch {
  // dotenv optional at runtime — env vars may come from the shell
}

// ---------------------------------------------------------------------------
// Resolve output directory — defaults to ~/Pictures/claude_nb2 when not given.
// Project-aware skills override this with the active project root.
// ---------------------------------------------------------------------------

function resolveOutputDir(rawOut) {
  if (!rawOut) return path.join(os.homedir(), "Pictures", "claude_nb2");
  const expanded = rawOut.startsWith("~")
    ? path.join(os.homedir(), rawOut.slice(1))
    : rawOut;
  if (path.isAbsolute(expanded)) return expanded;
  return path.join(os.homedir(), "Pictures", "claude_nb2", rawOut);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function uniqueName(outDir, baseName, ext = ".png") {
  let candidate = path.join(outDir, `${baseName}${ext}`);
  if (!fs.existsSync(candidate)) return candidate;
  let i = 2;
  while (fs.existsSync(path.join(outDir, `${baseName}_${i}${ext}`))) i++;
  return path.join(outDir, `${baseName}_${i}${ext}`);
}

const ALLOWED_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const MAX_REMOTE_IMAGE_BYTES = 50 * 1024 * 1024;

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(value);
}

function sanitizeAssetName(rawName, fallback) {
  const value = (rawName || fallback || "image").trim();
  if (value.includes("/") || value.includes("\\") || value.includes("..") || path.basename(value) !== value) {
    throw new Error("asset_name must be a filename only, without path separators or traversal");
  }
  const slug = value
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");
  if (!slug) throw new Error("asset_name must include at least one safe filename character");
  return slug;
}

function validateTargetSizes(rawSizes) {
  const sizes = rawSizes || ["2048x2048", "1920x1080", "1080x1920"];
  if (!Array.isArray(sizes) || sizes.length === 0) {
    throw new Error("target_sizes must be a non-empty array of WxH strings");
  }
  return sizes.map((size) => {
    if (typeof size !== "string") {
      throw new Error("target_sizes entries must be strings in WxH format");
    }
    const match = /^(\d{2,5})x(\d{2,5})$/.exec(size);
    if (!match) {
      throw new Error(`Invalid target size "${size}" — expected format "WxH" e.g. "1920x1080"`);
    }
    const width = Number(match[1]);
    const height = Number(match[2]);
    if (width < 64 || height < 64 || width > 8192 || height > 8192) {
      throw new Error(`Invalid target size "${size}" — dimensions must be between 64 and 8192 pixels`);
    }
    return `${width}x${height}`;
  });
}

function isPrivateIpv4(address) {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

function expandIpv6(address) {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized.includes(".")) return null;
  const halves = normalized.split("::");
  if (halves.length > 2) return null;

  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = halves.length === 2 ? new Array(8 - head.length - tail.length).fill("0") : [];
  const groups = [...head, ...fill, ...tail];
  if (groups.length !== 8) return null;

  return groups.map((group) => {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return NaN;
    return parseInt(group, 16);
  });
}

function ipv4FromMappedIpv6(address) {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
  const dotted = normalized.match(/^(?:0:0:0:0:0:ffff:|::ffff:)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) return dotted[1];

  const groups = expandIpv6(normalized);
  if (!groups || groups.some((group) => !Number.isInteger(group))) return null;
  if (groups.slice(0, 5).some((group) => group !== 0) || groups[5] !== 0xffff) return null;

  return [
    (groups[6] >> 8) & 0xff,
    groups[6] & 0xff,
    (groups[7] >> 8) & 0xff,
    groups[7] & 0xff,
  ].join(".");
}

function isPrivateIpv6(address) {
  const normalized = address.toLowerCase();
  const mappedIpv4 = ipv4FromMappedIpv6(normalized);
  if (mappedIpv4) return isPrivateIpv4(mappedIpv4);
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("::ffff:0:") ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd")
  );
}

function assertSafeRemoteImageHostname(parsed) {
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const ipVersion = net.isIP(hostname);
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "metadata.google.internal" ||
    (ipVersion === 4 && isPrivateIpv4(hostname)) ||
    (ipVersion === 6 && isPrivateIpv6(hostname))
  ) {
    throw new Error(`Image URL host is not allowed: ${parsed.hostname}`);
  }
}

async function assertSafeRemoteImageUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid image URL: ${rawUrl}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Image URL must use http or https: ${rawUrl}`);
  }

  assertSafeRemoteImageHostname(parsed);

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(hostname)) return parsed;

  const addresses = await lookup(hostname, { all: true });
  for (const addressInfo of addresses) {
    if (
      (addressInfo.family === 4 && isPrivateIpv4(addressInfo.address)) ||
      (addressInfo.family === 6 && isPrivateIpv6(addressInfo.address))
    ) {
      throw new Error(`Image URL resolves to a private or local address: ${parsed.hostname}`);
    }
  }
  return parsed;
}

async function resolveSafeRemoteAddress(hostname) {
  const normalized = hostname.replace(/^\[|\]$/g, "");
  const ipVersion = net.isIP(normalized);
  if (ipVersion) {
    if (
      (ipVersion === 4 && isPrivateIpv4(normalized)) ||
      (ipVersion === 6 && isPrivateIpv6(normalized))
    ) {
      throw new Error(`Image URL host is not allowed: ${hostname}`);
    }
    return { address: normalized, family: ipVersion };
  }

  const addresses = await lookup(normalized, { all: true });
  const safe = addresses.find((addressInfo) => !(
    (addressInfo.family === 4 && isPrivateIpv4(addressInfo.address)) ||
    (addressInfo.family === 6 && isPrivateIpv6(addressInfo.address))
  ));
  if (!safe) {
    throw new Error(`Image URL resolves only to private or local addresses: ${hostname}`);
  }
  return safe;
}

function responseHeader(headers, name) {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

async function fetchValidatedRemoteImage(rawUrl, init = {}, redirects = 0) {
  const parsed = await assertSafeRemoteImageUrl(rawUrl);
  const method = init.method || "GET";
  const transport = parsed.protocol === "https:" ? https : http;

  return await new Promise((resolve, reject) => {
    const req = transport.request(parsed, {
      method,
      timeout: 15000,
      lookup: (hostname, _options, callback) => {
        resolveSafeRemoteAddress(hostname)
          .then((addressInfo) => callback(null, addressInfo.address, addressInfo.family))
          .catch((error) => callback(error));
      },
      headers: {
        "User-Agent": "slot-art-creator-node/1.1",
        Accept: "image/*,*/*;q=0.1",
      },
    }, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400) {
        res.resume();
        if (redirects >= 3) {
          reject(new Error(`Image URL redirected too many times: ${rawUrl}`));
          return;
        }
        const location = responseHeader(res.headers, "location");
        if (!location) {
          reject(new Error(`Image URL redirected without a Location header: ${rawUrl}`));
          return;
        }
        const nextUrl = new URL(location, parsed).href;
        fetchValidatedRemoteImage(nextUrl, init, redirects + 1).then(resolve, reject);
        return;
      }

      const contentLength = Number(responseHeader(res.headers, "content-length"));
      if (Number.isFinite(contentLength) && contentLength > MAX_REMOTE_IMAGE_BYTES) {
        res.resume();
        reject(new Error(`Image URL response is too large: ${contentLength} bytes`));
        return;
      }

      const chunks = [];
      let totalBytes = 0;
      res.on("data", (chunk) => {
        totalBytes += chunk.length;
        if (totalBytes > MAX_REMOTE_IMAGE_BYTES) {
          req.destroy(new Error(`Image URL response exceeded ${MAX_REMOTE_IMAGE_BYTES} bytes`));
          return;
        }
        chunks.push(chunk);
      });
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          ok: status >= 200 && status < 300,
          status,
          headers: {
            get: (name) => responseHeader(res.headers, name),
          },
          arrayBuffer: async () => buffer,
        });
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error(`Image URL request timed out: ${rawUrl}`));
    });
    req.on("error", reject);
    req.end();
  });
}

async function validateRemoteImageUrl(rawUrl) {
  const resp = await fetchValidatedRemoteImage(rawUrl, { method: "HEAD" });
  if (resp.ok) {
    const contentType = resp.headers.get("content-type") || "";
    if (contentType && !contentType.toLowerCase().startsWith("image/")) {
      throw new Error(`Remote image URL returned non-image content-type: ${contentType}`);
    }
  } else if (resp.status !== 405) {
    throw new Error(`Remote image URL is not reachable: ${resp.status} ${rawUrl}`);
  }
  return rawUrl;
}

function validateLocalImagePath(rawPath) {
  const expanded = rawPath.startsWith("~")
    ? path.join(os.homedir(), rawPath.slice(1))
    : rawPath;
  const resolved = fs.realpathSync(path.resolve(expanded));
  const stat = fs.statSync(resolved);
  if (!stat.isFile()) {
    throw new Error(`Image input must be a file: ${rawPath}`);
  }
  const ext = path.extname(resolved).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    throw new Error(`Image input must be .png, .jpg, .jpeg, or .webp: ${rawPath}`);
  }
  if (path.basename(resolved).toLowerCase().startsWith(".env")) {
    throw new Error(`Image input cannot be an env file: ${rawPath}`);
  }
  return resolved;
}

async function validateImageInput(rawInput, label) {
  if (!rawInput || typeof rawInput !== "string") {
    throw new Error(`${label} must be an image path or URL`);
  }
  if (rawInput.includes("\0")) {
    throw new Error(`${label} contains an invalid path character`);
  }
  if (isRemoteUrl(rawInput)) return await validateRemoteImageUrl(rawInput);
  return validateLocalImagePath(rawInput);
}

async function validateImageInputs(rawInputs, label) {
  if (!rawInputs) return null;
  if (!Array.isArray(rawInputs)) throw new Error(`${label} must be an array of image paths or URLs`);
  return await Promise.all(rawInputs.map((input) => validateImageInput(input, label)));
}

// ---------------------------------------------------------------------------
// Sidecar metadata (.meta.json) — written next to every output PNG
//
// Provenance for downstream tools, /slot-step-08, and human review.
// Schema is h5g_asset.meta.v1. Contains the prompt that produced the image,
// the model + provider, all API args, and references used. Survives moving
// the project folder.
// ---------------------------------------------------------------------------

function writeSidecar(pngPath, meta) {
  const sidecarPath = pngPath.replace(/\.png$/i, ".meta.json");
  const payload = {
    schema: "h5g_asset.meta.v1",
    filename: path.basename(pngPath),
    full_path: pngPath,
    generated_at: new Date().toISOString(),
    ...meta,
  };
  try {
    fs.writeFileSync(sidecarPath, JSON.stringify(payload, null, 2));
  } catch (e) {
    // Sidecar failure must never block the actual generation result
    console.error(`[sidecar] failed to write ${sidecarPath}: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// Provider detection
// ---------------------------------------------------------------------------

const FAL_KEY = process.env.FAL_KEY || "";
const GEMINI_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

// Provider selection for the three generation tools (generate / edit / upscale).
// Gemini wins when both keys are present — it's the preferred general-purpose
// generator. fal.ai is the fallback for users who only have a fal key.
//
// nb2_smart_resize ignores this function entirely — it always uses fal.ai
// because Gemini has no smart-resize equivalent. See the per-tool handler.
function getProviderForGeneration() {
  if (GEMINI_KEY) return "gemini";
  if (FAL_KEY) return "fal";
  return null;
}

// ---------------------------------------------------------------------------
// fal.ai helpers
// ---------------------------------------------------------------------------

const FAL_RESOLUTION_MAP = {
  "512": "0.5K",
  "1K": "1K",
  "2K": "2K",
  "4K": "4K",
};

async function uploadLocalFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = imageMimeType(ext);
  const blob = new Blob([buffer], { type: mime });
  return await fal.storage.upload(blob);
}

async function uploadRemoteImage(url) {
  const { buffer, mimeType } = await fetchRemoteImageBuffer(url);
  const blob = new Blob([buffer], { type: mimeType });
  return await fal.storage.upload(blob);
}

function imageMimeType(ext) {
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

async function fetchRemoteImageBuffer(url) {
  const resp = await fetchValidatedRemoteImage(url);
  if (!resp.ok) throw new Error(`Failed to fetch image URL: ${resp.status} ${url}`);
  const contentType = resp.headers.get("content-type") || "";
  if (contentType && !contentType.toLowerCase().startsWith("image/")) {
    throw new Error(`Image URL returned non-image content-type: ${contentType}`);
  }
  return {
    buffer: Buffer.from(await resp.arrayBuffer()),
    mimeType: contentType.split(";")[0] || "image/png",
  };
}

async function downloadImage(url, destPath) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Download failed: ${resp.status} ${url}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync(destPath, buf);
}

async function falGenerate({ prompt, outputDir, assetName, imageSize, aspectRatio, references }) {
  fal.config({ credentials: FAL_KEY });

  // The fal.ai NanoBanana2Input schema uses `resolution` (NOT `image_size`).
  // Valid values: "0.5K" | "1K" | "2K" | "4K". Default is "1K" — we override
  // to "2K" for project minimum.
  const falRes = FAL_RESOLUTION_MAP[imageSize] || "2K";
  const input = {
    prompt,
    resolution: falRes,
  };
  if (aspectRatio && aspectRatio !== "auto") input.aspect_ratio = aspectRatio;

  // Upload reference images if provided
  if (references && references.length > 0) {
    const uploaded = await Promise.all(
      references.map(async (ref) => {
        if (ref.startsWith("http://") || ref.startsWith("https://")) return await uploadRemoteImage(ref);
        return await uploadLocalFile(ref);
      })
    );
    input.reference_image_urls = uploaded;
  }

  const endpoint = references && references.length > 0
    ? "fal-ai/nano-banana-2/edit"
    : "fal-ai/nano-banana-2";

  // For edit endpoint, source image is first reference
  if (endpoint === "fal-ai/nano-banana-2/edit") {
    input.image_urls = input.reference_image_urls;
    delete input.reference_image_urls;
  }

  const t0 = Date.now();
  const result = await fal.subscribe(endpoint, { input, logs: false });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  const images = result.data?.images || [];
  if (!images.length) throw new Error("fal.ai returned no images");

  ensureDir(outputDir);
  const saved = [];
  for (let i = 0; i < images.length; i++) {
    const suffix = images.length > 1 ? `_${i + 1}` : "";
    const dest = uniqueName(outputDir, `${assetName}${suffix}`);
    await downloadImage(images[i].url, dest);
    saved.push(dest);
    writeSidecar(dest, {
      tool: "nb2_generate",
      provider: "fal.ai",
      model: endpoint,
      prompt,
      image_size: imageSize,
      aspect_ratio: aspectRatio || null,
      reference_images: references || [],
      source_image: null,
      duration_seconds: Number(elapsed),
    });
  }

  return { provider: "fal.ai", model: "fal-ai/nano-banana-2", resolution: falRes, elapsed, paths: saved };
}

async function falEdit({ prompt, source, outputDir, assetName, imageSize, aspectRatio, extraReferences }) {
  fal.config({ credentials: FAL_KEY });

  // The fal.ai NanoBanana2EditInput schema uses `resolution` (NOT `image_size`).
  const falRes = FAL_RESOLUTION_MAP[imageSize] || "2K";

  // Build image_urls: source is always first
  const allRefs = [source, ...(extraReferences || [])];
  const uploaded = await Promise.all(
    allRefs.map(async (ref) => {
      if (ref.startsWith("http://") || ref.startsWith("https://")) return await uploadRemoteImage(ref);
      return await uploadLocalFile(ref);
    })
  );

  const input = {
    prompt,
    image_urls: uploaded,
    resolution: falRes,
  };
  if (aspectRatio && aspectRatio !== "auto") input.aspect_ratio = aspectRatio;

  const t0 = Date.now();
  const result = await fal.subscribe("fal-ai/nano-banana-2/edit", { input, logs: false });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  const images = result.data?.images || [];
  if (!images.length) throw new Error("fal.ai returned no images");

  ensureDir(outputDir);
  const saved = [];
  for (let i = 0; i < images.length; i++) {
    const suffix = images.length > 1 ? `_${i + 1}` : "";
    const dest = uniqueName(outputDir, `${assetName}${suffix}`);
    await downloadImage(images[i].url, dest);
    saved.push(dest);
    writeSidecar(dest, {
      tool: "nb2_edit",
      provider: "fal.ai",
      model: "fal-ai/nano-banana-2/edit",
      prompt,
      image_size: imageSize,
      aspect_ratio: aspectRatio || null,
      reference_images: extraReferences || [],
      source_image: source,
      duration_seconds: Number(elapsed),
    });
  }

  return { provider: "fal.ai", model: "fal-ai/nano-banana-2/edit", resolution: falRes, elapsed, paths: saved };
}

async function falSmartResize({ source, outputDir, assetName, targetSizes, prompt }) {
  fal.config({ credentials: FAL_KEY });

  let imageUrl = source;
  if (!source.startsWith("http://") && !source.startsWith("https://")) {
    imageUrl = await uploadLocalFile(source);
  } else {
    imageUrl = await uploadRemoteImage(source);
  }

  // Default target sizes match the project's 2K minimum. fal-ai/smart-resize
  // accepts any "<width>x<height>" strings; the endpoint internally picks the
  // smallest nano-banana-pro preset that fully covers each target, then
  // center-crops to the exact requested dimensions.
  const sizes = validateTargetSizes(targetSizes);

  // Schema verified against fal.ai docs (https://fal.ai/models/fal-ai/smart-resize):
  //   image_url             — string, required
  //   target_sizes          — list<"WxH" string>, required
  //   resolution            — "1K" | "2K" | "4K", optional (default "1K")
  //                           "Hint for the minimum resolution tier" — we pass
  //                           "2K" so the internal NB Pro generation doesn't
  //                           drop below project minimum quality.
  //   num_images_per_size   — int, optional (default 1)
  //   output_format         — "jpeg" | "png" | "webp", optional (default "png")
  //   prompt                — string, optional extra instruction (default "")
  //   safety_tolerance      — "1"–"6" string, optional (default "4")
  //   seed, sync_mode       — optional, not used here
  //
  // NOTE: This endpoint uses **nano-banana-pro** internally, NOT NB2. The
  // wrapper tool is named "nb2_smart_resize" because it's part of the NB2
  // workflow, but the underlying model is NB Pro per fal's docs.
  const input = {
    image_url: imageUrl,
    target_sizes: sizes,
    resolution: "2K",
    output_format: "png",
  };
  // Optional extra instruction forwarded to nano-banana-pro alongside the
  // auto-generated resize prompt (per fal.ai smart-resize docs).
  if (prompt) input.prompt = prompt;

  const t0 = Date.now();
  const result = await fal.subscribe("fal-ai/smart-resize", { input, logs: false });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  // Response shape (verified against fal.ai docs):
  //   data.images       — flat list<ImageFile>; one entry per (target_size × num_images_per_size)
  //   data.results      — list<SmartResizeResult> with width, height,
  //                       aspect_ratio, and resolution per target — useful provenance
  const images = result.data?.images || [];
  const perTargetResults = result.data?.results || [];
  if (!images.length) throw new Error("fal-ai/smart-resize returned no images");

  ensureDir(outputDir);
  const saved = [];
  for (let i = 0; i < images.length; i++) {
    const requestedSize = sizes[i] || null;
    const meta = perTargetResults[i] || {};
    const sizeSuffix = requestedSize ? `_${requestedSize}` : `_${i + 1}`;
    const dest = uniqueName(outputDir, `${assetName}${sizeSuffix}`);
    await downloadImage(images[i].url, dest);
    saved.push(dest);
    writeSidecar(dest, {
      tool: "nb2_smart_resize",
      provider: "fal.ai",
      model: "fal-ai/smart-resize",
      underlying_model: "nano-banana-pro", // documented in fal's smart-resize page
      prompt: null,
      image_size: requestedSize,
      target_size: requestedSize,
      actual_width: images[i].width || meta.width || null,
      actual_height: images[i].height || meta.height || null,
      internal_aspect_ratio: meta.aspect_ratio || null,
      internal_resolution: meta.resolution || null,
      aspect_ratio: null,
      reference_images: [],
      source_image: source,
      duration_seconds: Number(elapsed),
    });
  }

  return { provider: "fal.ai", model: "fal-ai/smart-resize", resolution: sizes.join(", "), elapsed, paths: saved };
}

// ---------------------------------------------------------------------------
// Gemini helpers
// ---------------------------------------------------------------------------

function imagePartFromFile(filePath) {
  const data = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = imageMimeType(ext);
  return {
    inlineData: {
      data: data.toString("base64"),
      mimeType: mime,
    },
  };
}

// Gemini's image generation accepts these resolution strings via
// config.imageConfig.imageSize. Default is "1K" — we pass "2K" explicitly to
// match the project minimum. (Note: this is a separate axis from aspect_ratio.)
const GEMINI_IMAGE_SIZE_MAP = {
  "512": "1K",   // Gemini doesn't expose 0.5K — clamp up
  "1K": "1K",
  "2K": "2K",
  "4K": "4K",
};

async function geminiGenerate({ prompt, outputDir, assetName, imageSize, aspectRatio, references }) {
  const client = new GoogleGenAI({ apiKey: GEMINI_KEY });

  const parts = [{ text: prompt }];
  if (references) {
    for (const ref of references) {
      if (ref.startsWith("http://") || ref.startsWith("https://")) {
        const { buffer, mimeType } = await fetchRemoteImageBuffer(ref);
        parts.push({ inlineData: { data: buffer.toString("base64"), mimeType } });
      } else {
        parts.push(imagePartFromFile(ref));
      }
    }
  }

  // GenerateContentConfig schema (verified against @google/genai v1.52.0
  // genai.d.ts line 4466):
  //   - responseModalities goes at the top level of config
  //   - aspectRatio and imageSize go INSIDE config.imageConfig (per
  //     ImageConfig interface at line 6197)
  //   - numberOfImages does NOT exist on this interface — it's on
  //     GenerateImagesConfig (Imagen API) which we don't use here
  const imgCfg = {};
  if (aspectRatio && aspectRatio !== "auto") imgCfg.aspectRatio = aspectRatio;
  imgCfg.imageSize = GEMINI_IMAGE_SIZE_MAP[imageSize] || "2K";

  const config = {
    responseModalities: ["IMAGE", "TEXT"],
    imageConfig: imgCfg,
  };

  // The wrapper key on GenerateContentParameters is `config:` (NOT
  // `generationConfig:`). Confirmed against genai.d.ts line 4626-4636.
  const t0 = Date.now();
  const response = await client.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: [{ role: "user", parts }],
    config,
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  ensureDir(outputDir);
  const saved = [];

  const candidates = response.candidates || [];
  for (const cand of candidates) {
    for (const part of cand.content?.parts || []) {
      if (part.inlineData?.data) {
        const dest = uniqueName(outputDir, assetName);
        const buf = Buffer.from(part.inlineData.data, "base64");
        fs.writeFileSync(dest, buf);
        saved.push(dest);
        writeSidecar(dest, {
          tool: "nb2_generate",
          provider: "Gemini",
          model: "gemini-3.1-flash-image-preview",
          prompt,
          image_size: imageSize || "2K",
          aspect_ratio: aspectRatio || null,
          reference_images: references || [],
          source_image: null,
          duration_seconds: Number(elapsed),
        });
      }
    }
  }

  if (!saved.length) throw new Error("Gemini returned no image data");

  return {
    provider: "Gemini",
    model: "gemini-3.1-flash-image-preview",
    resolution: imageSize || "2K",
    elapsed,
    paths: saved,
  };
}

// ---------------------------------------------------------------------------
// Gemini smart-resize — Gemini-side equivalent of fal.ai's smart-resize.
// ---------------------------------------------------------------------------
// Replicates the fal-ai/smart-resize recipe (oversample → center-crop) using
// gemini-3.1-flash-image-preview (Nano Banana 2) as the underlying model
// instead of nano-banana-pro. For each "<W>x<H>" target:
//   1. Pick the closest Gemini aspect_ratio preset to the target's W/H ratio
//   2. Pick the smallest Gemini imageSize tier ("1K"/"2K"/"4K") that should
//      cover the target's largest dimension
//   3. Call generateContent with the source image as inline data + a
//      recompose prompt
//   4. Center-crop the returned PNG to the exact requested W×H using pngjs
//
// Pixel-perfect output comes from oversample + crop, same as fal's recipe.
// ---------------------------------------------------------------------------

const GEMINI_ASPECT_RATIOS = [
  ["1:1",   1.0],
  ["2:3",   2 / 3],
  ["3:2",   3 / 2],
  ["3:4",   3 / 4],
  ["4:3",   4 / 3],
  ["9:16",  9 / 16],
  ["16:9",  16 / 9],
  ["21:9",  21 / 9],
];

// Pick the Gemini aspect-ratio preset whose ratio is closest to the target.
function pickGeminiAspectRatio(targetW, targetH) {
  const targetRatio = targetW / targetH;
  let best = GEMINI_ASPECT_RATIOS[0];
  let minDelta = Infinity;
  for (const entry of GEMINI_ASPECT_RATIOS) {
    const delta = Math.abs(entry[1] - targetRatio);
    if (delta < minDelta) {
      minDelta = delta;
      best = entry;
    }
  }
  return best[0];
}

// Pick the smallest Gemini imageSize tier that should comfortably cover the
// requested target dimensions. Conservative — defaults to 4K for any
// dimension >2048 (Gemini's "4K" tier is the largest available).
function pickGeminiResolutionTier(targetW, targetH) {
  const max = Math.max(targetW, targetH);
  if (max <= 1024) return "2K";  // 2K tier easily covers ≤1024 after preset
  if (max <= 2048) return "4K";  // 4K tier for 1080p–2K targets
  return "4K";                    // largest available; Gemini caps at 4K
}

// Center-crop a PNG buffer to exact target dimensions using pngjs (pure JS,
// no native deps). Throws if the source is smaller than the target.
function centerCropPng(srcBuf, targetW, targetH) {
  const src = PNG.sync.read(srcBuf);
  if (src.width < targetW || src.height < targetH) {
    throw new Error(
      `Gemini returned ${src.width}x${src.height}, smaller than requested ` +
      `${targetW}x${targetH}. Try a larger target or use fal.ai for this size.`
    );
  }
  const x = Math.floor((src.width - targetW) / 2);
  const y = Math.floor((src.height - targetH) / 2);
  const out = new PNG({ width: targetW, height: targetH });
  PNG.bitblt(src, out, x, y, targetW, targetH, 0, 0);
  return PNG.sync.write(out);
}

async function geminiSmartResize({ source, outputDir, assetName, targetSizes, prompt }) {
  const client = new GoogleGenAI({ apiKey: GEMINI_KEY });

  // Read source image as inline data (Gemini accepts URLs by fetch + base64,
  // or local files directly).
  let sourcePart;
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const { buffer, mimeType } = await fetchRemoteImageBuffer(source);
    sourcePart = { inlineData: { data: buffer.toString("base64"), mimeType } };
  } else {
    sourcePart = imagePartFromFile(source);
  }

  ensureDir(outputDir);
  const saved = [];
  const overallT0 = Date.now();

  const sizes = validateTargetSizes(targetSizes);
  for (const size of sizes) {
    const match = /^(\d+)x(\d+)$/.exec(size);
    const targetW = parseInt(match[1], 10);
    const targetH = parseInt(match[2], 10);

    const aspectRatio = pickGeminiAspectRatio(targetW, targetH);
    const tier = pickGeminiResolutionTier(targetW, targetH);

    const recomposePrompt =
      (prompt ? prompt + " " : "") +
      `Recompose this image at ${aspectRatio} aspect ratio while preserving the ` +
      `subject, palette, style, and overall mood. Adjust framing as needed to fit ` +
      `the target shape; do not crop awkwardly. Keep the hero subject as the ` +
      `focal point. Match the rendering style of the source exactly.`;

    const t0 = Date.now();
    const response = await client.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [{
        role: "user",
        parts: [
          { text: recomposePrompt },
          sourcePart,
        ],
      }],
      config: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: {
          aspectRatio,
          imageSize: tier,
        },
      },
    });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    // Extract image bytes from the response
    let imageBuf = null;
    const candidates = response.candidates || [];
    outer: for (const cand of candidates) {
      for (const part of cand.content?.parts || []) {
        if (part.inlineData?.data) {
          imageBuf = Buffer.from(part.inlineData.data, "base64");
          break outer;
        }
      }
    }
    if (!imageBuf) {
      throw new Error(`Gemini returned no image for target ${size}`);
    }

    // Center-crop to exact target dimensions
    const croppedBuf = centerCropPng(imageBuf, targetW, targetH);

    // Save
    const dest = uniqueName(outputDir, `${assetName}_${size}`);
    fs.writeFileSync(dest, croppedBuf);
    saved.push(dest);
    writeSidecar(dest, {
      tool: "nb2_smart_resize",
      provider: "Gemini",
      model: "gemini-3.1-flash-image-preview",
      underlying_model: "gemini-3.1-flash-image-preview", // = Nano Banana 2
      prompt: recomposePrompt,
      image_size: size,
      target_size: size,
      actual_width: targetW,
      actual_height: targetH,
      internal_aspect_ratio: aspectRatio,
      internal_resolution: tier,
      aspect_ratio: aspectRatio,
      reference_images: [],
      source_image: source,
      duration_seconds: Number(elapsed),
    });
  }

  const overallElapsed = ((Date.now() - overallT0) / 1000).toFixed(1);
  return {
    provider: "Gemini",
    model: "gemini-3.1-flash-image-preview",
    resolution: sizes.join(", "),
    elapsed: overallElapsed,
    paths: saved,
  };
}

// ---------------------------------------------------------------------------
// Dispatcher — route to gemini (preferred) or fal (fallback)
// ---------------------------------------------------------------------------

async function dispatchGenerate(args) {
  const provider = getProviderForGeneration();
  if (!provider) throw new Error(
    "No API key found. Set GEMINI_API_KEY (https://aistudio.google.com/apikey) " +
    "or FAL_KEY (https://fal.ai/dashboard) then re-run setup-keys.js"
  );
  if (provider === "gemini") return geminiGenerate(args);
  return falGenerate(args);
}

async function dispatchEdit(args) {
  const provider = getProviderForGeneration();
  if (!provider) throw new Error(
    "No API key found. Set GEMINI_API_KEY or FAL_KEY then re-run setup-keys.js"
  );
  if (provider === "gemini") {
    // Gemini edit = generate with source as first reference
    return geminiGenerate({
      ...args,
      references: [args.source, ...(args.extraReferences || [])],
    });
  }
  return falEdit(args);
}

// ---------------------------------------------------------------------------
// Format result as MCP text content
// ---------------------------------------------------------------------------

function formatResult(result, header) {
  // Derive the folder all outputs were saved to. All paths from a single tool
  // call land in the same output_dir, so dirname of the first path is enough.
  // Surfaced explicitly as a "Folder:" line so the user always sees where
  // files landed — without needing to read individual paths.
  const folder = result.paths.length > 0
    ? path.dirname(result.paths[0])
    : "(no output saved)";
  const fileUri = folder !== "(no output saved)"
    ? "file:///" + folder.replace(/\\/g, "/")
    : null;

  const lines = [
    header,
    `  Provider: ${result.provider}`,
    `  Model: ${result.model}`,
    `  Resolution: ${result.resolution}`,
    `  Elapsed: ${result.elapsed}s`,
    `  Folder: ${folder}`,
  ];
  if (fileUri) {
    lines.push(`  Open: ${fileUri}`);
  }
  lines.push(`  Outputs (${result.paths.length}):`);
  for (const p of result.paths) {
    lines.push(`    - ${p}`);
  }
  return [{ type: "text", text: lines.join("\n") }];
}

function formatError(label, err) {
  return [{ type: "text", text: `ERROR (${label}): ${err.message || err}` }];
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "nb2_generate",
    description:
      "Generate a new image with Nano Banana 2 (NB2). " +
      "Use for new symbols, key art, UI surfaces, backgrounds, and contact sheets. " +
      "Always pass a fully-composed slot-art prompt following the rules in shared/nb2_prompting.md. " +
      "Returns the absolute path(s) to the saved PNG(s).",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "The fully-composed NB2 prompt." },
        output_dir: { type: "string", description: "Output directory. Defaults to ~/Pictures/claude_nb2." },
        asset_name: { type: "string", description: "Base filename (no extension). Default: image.", default: "image" },
        image_size: {
          type: "string",
          enum: ["512", "1K", "2K", "4K"],
          description: "Output resolution. Default: 2K.",
          default: "2K",
        },
        aspect_ratio: {
          type: "string",
          enum: ["16:9","1:1","1:4","1:8","21:9","2:3","3:2","3:4","4:1","4:3","4:5","5:4","8:1","9:16","auto"],
          description: "Aspect ratio. Omit to let model infer from prompt context.",
        },
        references: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of reference image paths or URLs (style references).",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "nb2_edit",
    description:
      "In-place edit / reskin of an existing image with NB2. " +
      "Pass the source image path and a prompt describing the change. " +
      "Used by slot-step-07 and for other edit operations. " +
      "Returns the path(s) to the saved PNG(s).",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "The edit instruction prompt." },
        source: { type: "string", description: "Absolute path or URL of the source image to edit." },
        output_dir: { type: "string", description: "Output directory. Defaults to ~/Pictures/claude_nb2." },
        asset_name: { type: "string", description: "Base filename (no extension). Default: edit.", default: "edit" },
        image_size: {
          type: "string",
          enum: ["512", "1K", "2K", "4K"],
          default: "2K",
        },
        aspect_ratio: {
          type: "string",
          enum: ["16:9","1:1","1:4","1:8","21:9","2:3","3:2","3:4","4:1","4:3","4:5","5:4","8:1","9:16","auto"],
        },
        extra_references: {
          type: "array",
          items: { type: "string" },
          description: "Additional reference images (beyond the source) to guide the edit.",
        },
      },
      required: ["prompt", "source"],
    },
  },
  {
    name: "nb2_upscale",
    description:
      "Path-A 4K upscale: pass an approved source image and a 6-part preservation prompt " +
      "(see shared/upscale_workflow.md). NB2 returns a 4K version that preserves the source's " +
      "identity, pose, palette, and rendering style. Review against the 8-axis rubric and iterate on failure.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "The 6-part preservation prompt for the upscale." },
        source: { type: "string", description: "Absolute path or URL of the approved source image." },
        output_dir: { type: "string", description: "Output directory. Defaults to ~/Pictures/claude_nb2." },
        asset_name: { type: "string", description: "Base filename (no extension). Default: upscale.", default: "upscale" },
        image_size: {
          type: "string",
          enum: ["1K", "2K", "4K"],
          default: "4K",
        },
      },
      required: ["prompt", "source"],
    },
  },
  {
    name: "nb2_smart_resize",
    description:
      "Pixel-perfect multi-size resize of an approved asset to one or more exact target dimensions. " +
      "Two backends: (1) fal-ai/smart-resize (preferred when FAL_KEY is set, uses nano-banana-pro / Nano Banana Pro internally — single optimized API call), or " +
      "(2) Gemini fallback when only GEMINI_API_KEY is set (uses gemini-3.1-flash-image-preview / Nano Banana 2 with one call per target + pngjs center-crop). " +
      "Pass the source image and target sizes as 'WxH' strings. Returns paths to each resized output.",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string", description: "Absolute path or URL of the source image." },
        output_dir: { type: "string", description: "Output directory. Defaults to ~/Pictures/claude_nb2." },
        asset_name: { type: "string", description: "Base filename prefix (no extension). Default: resize.", default: "resize" },
        target_sizes: {
          type: "array",
          items: { type: "string" },
          description: "Target sizes as WxH strings. Default: [\"2048x2048\", \"1920x1080\", \"1080x1920\"] (2K-tier marketing trio).",
        },
        prompt: {
          type: "string",
          description: "Optional extra instruction forwarded to the underlying model alongside the auto-generated recompose prompt. Leave empty to preserve the source content as closely as possible. Works on both fal.ai and Gemini backends.",
        },
      },
      required: ["source"],
    },
  },
];

// ---------------------------------------------------------------------------
// MCP server
// ---------------------------------------------------------------------------

const server = new Server(
  { name: "slot-art-creator-node-nb2", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "nb2_generate") {
      const assetName = sanitizeAssetName(args.asset_name, "image");
      const references = await validateImageInputs(args.references || null, "references");
      const result = await dispatchGenerate({
        prompt: args.prompt,
        outputDir: resolveOutputDir(args.output_dir),
        assetName,
        imageSize: args.image_size || "2K",
        aspectRatio: args.aspect_ratio || null,
        references,
      });
      return { content: formatResult(result, "nb2_generate OK") };
    }

    if (name === "nb2_edit") {
      const assetName = sanitizeAssetName(args.asset_name, "edit");
      const source = await validateImageInput(args.source, "source");
      const extraReferences = await validateImageInputs(args.extra_references || null, "extra_references");
      const result = await dispatchEdit({
        prompt: args.prompt,
        source,
        outputDir: resolveOutputDir(args.output_dir),
        assetName,
        imageSize: args.image_size || "2K",
        aspectRatio: args.aspect_ratio || null,
        extraReferences,
      });
      return { content: formatResult(result, "nb2_edit OK") };
    }

    if (name === "nb2_upscale") {
      const assetName = sanitizeAssetName(args.asset_name, "upscale");
      const source = await validateImageInput(args.source, "source");
      const result = await dispatchEdit({
        prompt: args.prompt,
        source,
        outputDir: resolveOutputDir(args.output_dir),
        assetName,
        imageSize: args.image_size || "4K",
        aspectRatio: null,
        extraReferences: null,
      });
      return { content: formatResult(result, "nb2_upscale OK") };
    }

    if (name === "nb2_smart_resize") {
      // Dispatch:
      //   FAL_KEY present       → fal-ai/smart-resize (purpose-built endpoint,
      //                           uses nano-banana-pro internally, single API call)
      //   Otherwise GEMINI_KEY  → our Gemini implementation using NB2
      //                           (gemini-3.1-flash-image-preview), one call per
      //                           target size + center-crop via pngjs
      //   Neither               → clear error
      const targetSizes = validateTargetSizes(args.target_sizes);
      const outputDir = resolveOutputDir(args.output_dir);
      const assetName = sanitizeAssetName(args.asset_name, "resize");
      const source = await validateImageInput(args.source, "source");

      if (FAL_KEY) {
        const result = await falSmartResize({
          source,
          outputDir,
          assetName,
          targetSizes,
          prompt: args.prompt || null,
        });
        return { content: formatResult(result, "nb2_smart_resize OK (fal.ai / nano-banana-pro)") };
      }

      if (GEMINI_KEY) {
        const result = await geminiSmartResize({
          source,
          outputDir,
          assetName,
          targetSizes,
          prompt: args.prompt || null,
        });
        return { content: formatResult(result, "nb2_smart_resize OK (Gemini / NB2)") };
      }

      return {
        content: [{
          type: "text",
          text: "ERROR: nb2_smart_resize needs at least one API key. " +
                "Set FAL_KEY (preferred — purpose-built endpoint) with: node setup-keys.js --fal\n" +
                "Or set GEMINI_API_KEY (uses NB2 with center-crop fallback) with: node setup-keys.js --gemini",
        }],
      };
    }

    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  } catch (err) {
    if (err instanceof McpError) throw err;
    return { content: formatError(name, err) };
  }
});

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
