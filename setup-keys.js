#!/usr/bin/env node
/**
 * API key setup for slot-art-creator-node
 *
 * Supports two providers — either alone works for all 4 tools, but BOTH
 * gives you the best backend per tool:
 *   GEMINI_API_KEY  — preferred for nb2_generate / nb2_edit / nb2_upscale (Nano Banana 2)
 *                     fallback for nb2_smart_resize (NB2 + local center-crop via pngjs)
 *                     https://aistudio.google.com/apikey
 *   FAL_KEY         — preferred for nb2_smart_resize (purpose-built endpoint, Nano Banana Pro)
 *                     fallback for the other tools (Nano Banana 2 via fal-ai/nano-banana-2)
 *                     https://fal.ai/dashboard
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
  console.log("fal.ai will be used for nb2_smart_resize (always) and as fallback");
  console.log("for nb2_generate / nb2_edit / nb2_upscale when no Gemini key is set.");
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
  console.log("Gemini will be the primary provider for nb2_generate / nb2_edit / nb2_upscale.");
  console.log("nb2_smart_resize will fall back to Gemini (NB2 + local center-crop) if FAL_KEY isn't set;");
  console.log("set FAL_KEY too for the purpose-built fal.ai endpoint (single API call, NB Pro).");
  return 0;
}

async function cmdCheck() {
  const values = readEnv();
  const falKey = values["FAL_KEY"] || process.env.FAL_KEY || "";
  const geminiKey = values["GEMINI_API_KEY"] || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

  let rc = 0;

  if (geminiKey) {
    const { ok, msg } = await validateGemini(geminiKey);
    const note = ok ? " — preferred for generate / edit / upscale; smart-resize fallback" : "";
    console.log(`GEMINI_API_KEY  ${ok ? "OK" : "FAIL"}: ${msg}${note}`);
    if (!ok) rc = 1;
  } else {
    console.log("GEMINI_API_KEY  MISSING — run: node setup-keys.js --gemini");
  }

  if (falKey) {
    console.log(`FAL_KEY         OK: key present (length ${falKey.length}) — preferred for smart-resize; fallback for other tools`);
  } else {
    console.log("FAL_KEY         MISSING — run: node setup-keys.js --fal  (recommended for fastest smart-resize)");
  }

  if (!falKey && !geminiKey) {
    console.log("\nNeither key is set. At least one is required.");
    console.log("Recommendation: set BOTH for full functionality.");
    rc = 1;
  } else if (!falKey) {
    console.log("\nNote: All 4 tools will use Gemini (NB2). nb2_smart_resize will use the");
    console.log("Gemini fallback (per-target generation + local pngjs center-crop). Add FAL_KEY");
    console.log("for the purpose-built fal-ai/smart-resize endpoint.");
  } else if (!geminiKey) {
    console.log("\nNote: All 4 tools will use fal.ai. Add GEMINI_API_KEY to switch generate/edit/upscale to Gemini.");
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
  console.log("");
  console.log("  Gemini  — preferred for generate / edit / upscale; works for smart-resize via NB2 + local crop");
  console.log("  fal.ai  — preferred for nb2_smart_resize (purpose-built endpoint); fallback for the other tools");
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
