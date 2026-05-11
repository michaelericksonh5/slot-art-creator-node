#!/usr/bin/env node
/**
 * API key setup for slot-art-creator-node
 *
 * Supports two providers — EITHER KEY ALONE is fully sufficient for all 4
 * tools. Both providers have a complete implementation of every tool. With
 * both keys set, the plugin routes each tool to its strongest backend.
 *
 *   GEMINI_API_KEY  — Google AI Studio. Routes generate/edit/upscale through
 *                     Google's direct API (gemini-3.1-flash-image-preview =
 *                     Nano Banana 2). Also runs smart_resize via NB2 + local
 *                     pngjs center-crop.
 *                     https://aistudio.google.com/apikey
 *
 *   FAL_KEY         — fal.ai. Routes generate/edit/upscale through fal-ai/
 *                     nano-banana-2 (same NB2 model, wrapped by fal). Runs
 *                     smart_resize through fal-ai/smart-resize — a purpose-
 *                     built endpoint using Nano Banana PRO (different/larger
 *                     model than NB2), single API call.
 *                     https://fal.ai/dashboard
 *
 * Routing when both keys are set:
 *   generate / edit / upscale  → Gemini (one fewer API hop; same NB2 model)
 *   smart_resize               → fal.ai (NB Pro endpoint is better for resize)
 *
 * Keys are written to a `.env` file at a STABLE user-level location:
 *   ~/.h5g-slot-art-creator/.env  (Mac/Linux)
 *   %USERPROFILE%\.h5g-slot-art-creator\.env  (Windows)
 *
 * This survives plugin reinstalls and updates. Both Claude Code and Claude
 * Cowork's MCP server pick it up via dotenv from this canonical location.
 *
 * Usage:
 *   node setup-keys.js              # interactive — prompts for both keys
 *   node setup-keys.js --fal        # set FAL_KEY only
 *   node setup-keys.js --gemini     # set GEMINI_API_KEY only
 *   node setup-keys.js --check      # verify saved keys
 *   node setup-keys.js --clear-fal  # clear FAL_KEY
 *   node setup-keys.js --clear-gemini  # clear GEMINI_API_KEY
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import * as os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = path.join(os.homedir(), ".h5g-slot-art-creator");
const ENV_PATH = path.join(CONFIG_DIR, ".env");
const EXAMPLE_PATH = path.join(__dirname, ".env.example");

// Legacy location — read on first run to migrate, then ignored
const LEGACY_ENV_PATH = path.join(__dirname, ".env");

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    try { fs.chmodSync(CONFIG_DIR, 0o700); } catch {}
  }
}

function migrateLegacyEnv() {
  if (!fs.existsSync(LEGACY_ENV_PATH) || fs.existsSync(ENV_PATH)) return;
  try {
    ensureConfigDir();
    fs.copyFileSync(LEGACY_ENV_PATH, ENV_PATH);
    try { fs.chmodSync(ENV_PATH, 0o600); } catch {}
    console.log(`Migrated legacy .env → ${ENV_PATH}`);
  } catch (e) {
    console.error(`Could not migrate legacy .env: ${e.message}`);
  }
}

migrateLegacyEnv();

// ---------------------------------------------------------------------------
// .env read / write
// ---------------------------------------------------------------------------

function readEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const out = {};
  for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

function writeEnv(values) {
  ensureConfigDir();
  let header = "";
  if (fs.existsSync(EXAMPLE_PATH)) {
    for (const line of fs.readFileSync(EXAMPLE_PATH, "utf8").split("\n")) {
      if (line.startsWith("#")) header += line + "\n";
      else break;
    }
  }
  const body = Object.entries(values)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
  fs.writeFileSync(ENV_PATH, header + body, "utf8");
  try {
    fs.chmodSync(ENV_PATH, 0o600);
  } catch {}
}

// ---------------------------------------------------------------------------
// Input helpers (hides input like getpass)
// ---------------------------------------------------------------------------

function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function hiddenInput(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    process.stdout.write(question);

    let input = "";
    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    const onData = (char) => {
      if (char === "\n" || char === "\r" || char === "") {
        process.stdin.setRawMode?.(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        process.stdout.write("\n");
        rl.close();
        resolve(input);
      } else if (char === "") {
        input = input.slice(0, -1);
      } else {
        input += char;
      }
    };

    process.stdin.on("data", onData);
  });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

async function validateGemini(key) {
  if (!key || key.length < 20) return { ok: false, msg: "Key too short to be a real Gemini key." };
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(key)}&pageSize=1`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (resp.status === 200) return { ok: true, msg: "Validated against Gemini API — key works." };
    if (resp.status === 401 || resp.status === 403)
      return { ok: false, msg: "Gemini rejected the key (401/403). Verify at https://aistudio.google.com/apikey" };
    return { ok: false, msg: `Unexpected response ${resp.status} from Gemini API.` };
  } catch (err) {
    return { ok: true, msg: `Network check skipped (${err.message}). Key saved; re-run --check to verify.` };
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdSetFal() {
  console.log("\nfal.ai API key setup for slot-art-creator-node");
  console.log("----------------------------------------------");
  console.log("Get a key at https://fal.ai/dashboard");
  console.log("Input is hidden; paste your key and press Enter.\n");

  const key = await hiddenInput("FAL_KEY: ");
  if (!key) { console.log("No key entered. Nothing written."); return 1; }
  if (key.length < 10) { console.log("FAIL: Key looks too short."); return 1; }

  const values = readEnv();
  values["FAL_KEY"] = key;
  writeEnv(values);
  console.log(`\nWrote ${ENV_PATH}`);
  console.log("fal.ai will handle all 4 tools. If you also set GEMINI_API_KEY,");
  console.log("generate/edit/upscale switch to Gemini and smart_resize stays on fal.ai.");
  return 0;
}

async function cmdSetGemini() {
  console.log("\nGemini API key setup for slot-art-creator-node");
  console.log("-----------------------------------------------");
  console.log("Get a key at https://aistudio.google.com/apikey");
  console.log("Input is hidden; paste your key and press Enter.\n");

  const key = await hiddenInput("GEMINI_API_KEY: ");
  if (!key) { console.log("No key entered. Nothing written."); return 1; }

  const { ok, msg } = await validateGemini(key);
  console.log(`${ok ? "OK" : "FAIL"}: ${msg}`);
  if (!ok) return 1;

  const values = readEnv();
  values["GEMINI_API_KEY"] = key;
  writeEnv(values);
  console.log(`\nWrote ${ENV_PATH}`);
  console.log("Gemini will handle all 4 tools. smart_resize uses Gemini's NB2 +");
  console.log("pngjs center-crop path (one call per target size). If you also set FAL_KEY,");
  console.log("smart_resize switches to fal.ai's purpose-built endpoint (NB Pro, single call).");
  return 0;
}

async function cmdCheck() {
  const values = readEnv();
  const falKey = values["FAL_KEY"] || process.env.FAL_KEY || "";
  const geminiKey = values["GEMINI_API_KEY"] || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

  let rc = 0;

  if (geminiKey) {
    const { ok, msg } = await validateGemini(geminiKey);
    console.log(`GEMINI_API_KEY  ${ok ? "OK" : "FAIL"}: ${msg}`);
    if (!ok) rc = 1;
  } else {
    console.log("GEMINI_API_KEY  MISSING — run: node setup-keys.js --gemini");
  }

  if (falKey) {
    console.log(`FAL_KEY         OK: key present (length ${falKey.length})`);
  } else {
    console.log("FAL_KEY         MISSING — run: node setup-keys.js --fal");
  }

  // Routing summary — based on what's actually set.
  console.log("");
  if (!falKey && !geminiKey) {
    console.log("Neither key is set. At least one is required (either alone works for all 4 tools).");
    rc = 1;
  } else if (geminiKey && falKey) {
    console.log("Both keys set. Routing:");
    console.log("  generate / edit / upscale  → Gemini (one fewer API hop, same NB2 model)");
    console.log("  smart_resize               → fal.ai (purpose-built NB Pro endpoint)");
  } else if (geminiKey) {
    console.log("Gemini only. All 4 tools route through Gemini.");
    console.log("  smart_resize uses NB2 + pngjs center-crop (one call per target).");
    console.log("  Add FAL_KEY to switch smart_resize to fal.ai's purpose-built NB Pro endpoint.");
  } else {
    console.log("fal.ai only. All 4 tools route through fal.ai.");
    console.log("  Add GEMINI_API_KEY to switch generate/edit/upscale to Gemini's direct API.");
  }

  return rc;
}

async function cmdClearFal() {
  const values = readEnv();
  if (!values["FAL_KEY"]) { console.log("No FAL_KEY to clear."); return 0; }
  values["FAL_KEY"] = "";
  writeEnv(values);
  console.log(`Cleared FAL_KEY in ${ENV_PATH}`);
  return 0;
}

async function cmdClearGemini() {
  const values = readEnv();
  if (!values["GEMINI_API_KEY"]) { console.log("No GEMINI_API_KEY to clear."); return 0; }
  values["GEMINI_API_KEY"] = "";
  writeEnv(values);
  console.log(`Cleared GEMINI_API_KEY in ${ENV_PATH}`);
  return 0;
}

async function cmdInteractive() {
  console.log("\nslot-art-creator-node — API key setup");
  console.log("======================================");
  console.log("This plugin can use Google Gemini and/or fal.ai.");
  console.log("Either key alone is fully sufficient for all 4 tools — both providers can");
  console.log("do everything. Setting both only matters because each tool gets routed to");
  console.log("its strongest backend:");
  console.log("");
  console.log("  generate / edit / upscale  → Gemini (same NB2 model, one fewer API hop)");
  console.log("  smart_resize               → fal.ai (purpose-built NB Pro endpoint)");
  console.log("");
  console.log("Either key alone is sufficient. Setting BOTH gives each tool its optimal backend.\n");

  const choice = await prompt("Which key would you like to set? [1] GEMINI_API_KEY  [2] FAL_KEY  [3] both  > ");

  if (choice === "3") {
    await cmdSetGemini();
    await cmdSetFal();
  } else if (choice === "2") {
    await cmdSetFal();
  } else {
    await cmdSetGemini();
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

let rc = 0;
if (args.includes("--check")) {
  rc = await cmdCheck();
} else if (args.includes("--clear-fal")) {
  rc = await cmdClearFal();
} else if (args.includes("--clear-gemini")) {
  rc = await cmdClearGemini();
} else if (args.includes("--fal")) {
  rc = await cmdSetFal();
} else if (args.includes("--gemini")) {
  rc = await cmdSetGemini();
} else {
  rc = await cmdInteractive();
}

process.exit(rc);
