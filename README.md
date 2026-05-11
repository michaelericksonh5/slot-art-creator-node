# slot-art-creator-node

High 5 Games slot machine art generation plugin for Claude Code and Claude Cowork.
**Node.js edition — no Python required.**

Powered by [Nano Banana 2](https://fal.ai/models/fal-ai/nano-banana-2). Generation tools (`nb2_generate`, `nb2_edit`, `nb2_upscale`) prefer Google Gemini; `nb2_smart_resize` uses fal.ai.

---

## Important: Claude Code and Claude Cowork are separate plugin systems

Even though Claude Code (the CLI / desktop standalone) and Claude Cowork (the
collaborative mode inside the Claude desktop app) both live in the same Anthropic
product family, **they have separate plugin installers** and a plugin installed
in one is NOT visible in the other.

The installer in this repo prepares **both** in a single run:

| Ecosystem | What the installer does | Manual step needed? |
|---|---|---|
| **Claude Code** | Copies the plugin into `~/Documents/Claude_Plugins/`, registers the marketplace in `~/.claude/settings.json`, enables the plugin | None — just reload Claude Code |
| **Claude Cowork** | Builds `dist/slot-art-creator-node-cowork-upload.zip` | **Yes — one manual click.** Open Claude Desktop > Cowork > Customize > Browse plugins > upload custom plugin file, select the ZIP |

The Cowork upload **cannot be automated** — Claude Desktop's plugin manager is a GUI, not a CLI, and Anthropic doesn't expose a programmatic install path for it. This is true for every Cowork plugin everywhere, not just this one.

## Quick install (recommended)

### Windows
```
double-click install.bat
```
At the "Where do you want to install this plugin?" prompt, **press Enter** (default is `[1] BOTH`).

### Mac / Linux
```bash
chmod +x install.sh && ./install.sh
```
Same — press Enter at the install-target prompt to get **both**.

### What the installer does end-to-end
1. Check for Node.js 18+
2. `npm ci` to install the MCP server's dependencies (reproducible install via `package-lock.json`)
3. Walk you through API key setup (`setup-keys.js`) — Gemini and/or fal.ai
4. **For Claude Code:** prepare a local marketplace source + register it in `settings.json` + enable the plugin
5. **For Claude Cowork:** build the upload ZIP at `dist/slot-art-creator-node-cowork-upload.zip`

### Claude Code

Use the helper and choose **Claude Code local marketplace**. If the plugin is already present in the local marketplace source folder, you can re-register it with:

```bash
node tools/register-marketplace.js --enable
```

Then open Claude Desktop > Code and use the documented `+ > Plugins` flow to verify `slot-art-creator-node` is installed and enabled. Claude Code documents plugin skill names as `slot-art-creator-node:slot-step-00` style namespaced skills; use `/` or `+` in the Code tab to verify the exact commands shown by your installed version.

### Claude Cowork

Build the upload ZIP:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File tools/package-cowork-zip.ps1
```

Upload `dist/slot-art-creator-node-cowork-upload.zip` in Claude Desktop > Cowork > Customize > Browse plugins. For organization distribution, upload the same ZIP in Organization settings > Plugins or configure GitHub sync. Cowork documentation says plugin skills are available through `/` or `+`, but does not specify the displayed namespace; verify the exact command names in the Cowork app after upload.

---

## API keys

For best results, set BOTH keys (each tool picks the optimal backend).
Either key alone is now sufficient — every tool has a working fallback.

| Tool | When both keys are set | When only one key |
|---|---|---|
| `nb2_generate` | Google Gemini (NB2) | whichever you have |
| `nb2_edit` | Google Gemini (NB2) | whichever you have |
| `nb2_upscale` | Google Gemini (NB2) | whichever you have |
| `nb2_smart_resize` | **fal.ai** (NB Pro, purpose-built endpoint) | Gemini fallback uses NB2 + local pngjs center-crop |

Get keys here:

| Provider | Get a key |
|---|---|
| **Google Gemini** (preferred for generate / edit / upscale; works for smart-resize via NB2 + local crop) | https://aistudio.google.com/apikey |
| **fal.ai** (preferred for smart-resize via the purpose-built nano-banana-pro endpoint; fallback for the other tools) | https://fal.ai/dashboard |

```bash
node setup-keys.js          # interactive (both keys)
node setup-keys.js --gemini # only set the Gemini key
node setup-keys.js --fal    # only set the fal.ai key
node setup-keys.js --check  # verify saved keys
```

Keys are stored in a stable per-user location:

| Platform | Path |
|---|---|
| Windows | `%USERPROFILE%\.h5g-slot-art-creator\.env` |
| macOS / Linux | `~/.h5g-slot-art-creator/.env` |

This survives plugin reinstalls and updates. The MCP server loads from
this file automatically on startup. **If both keys are present, Gemini
runs the three generation tools; `nb2_smart_resize` always uses fal.ai.**

The MCP server also respects shell environment variables (`GEMINI_API_KEY`,
`GOOGLE_API_KEY`, `FAL_KEY`) — useful when running under config managers /
MDM in Claude Cowork.

---

## Numbered workflow

The slash commands are numbered in workflow order — type `/slot-` and the
numbers tell you which step comes next. Project state persists across
sessions and conversation compaction (see [Project memory](#project-memory)).

| # | Command | When | What it does |
|---|---|---|---|
| 00 | `/slot-step-00` | Optional, before brief | Pulls GDD from Drive, seeds project |
| 01 | `/slot-step-01` | Foundation | Locks theme, palette, style, manifest into `project.json` |
| 02 | `/slot-step-02` | After brief | Master key art — becomes the visual style anchor |
| 03 | `/slot-step-03` | After key art | Individual symbols (HP, MP, LP, Wild, Scatter) |
| 04 | `/slot-step-04` | After symbols | Full contact sheet for review |
| 05 | `/slot-step-05` | After symbols | Base, free-spins, bonus, pick-me, wheel BGs |
| 06 | `/slot-step-06` | After BG | Bezel, HUD, paytable, banners, multipliers, lobby tile, logo |
| 07 | `/slot-step-07` | Optional | Adapt an existing UI mock to a new theme |
| 08 | `/slot-step-08` | Final review | RED/YELLOW/GREEN audit report |
| 09 | `/slot-step-09` | Production | Upscale approved 2K to 4K |
| 10 | `/slot-step-10` | Final delivery | Multi-aspect-ratio variants of approved hero |

---

## Project memory

Each game = one project folder on the H: drive. State persists
automatically — restart Claude Code, get compacted, switch machines,
and your project picks up where you left off.

### Folder layout

```
H:\Shared drives\Content Management - AI\Production_AI 2\Asset_Creation_Suite\
└── {GameID}_{username}\                # one folder per game
    ├── project.json                    # source of truth (brief + asset registry + counters)
    ├── game_brief.json                 # human-readable mirror of the brief
    ├── Key_001.png, Key_002.png, ...   # key art iterations
    ├── HP1_001.png, HP1_002.png, ...   # per-symbol iterations
    ├── BG_base_001.png, BG_freespins_001.png, ...
    ├── Bezel_001.png, HUD_001.png, ...
    ├── Banner_big_001.png, Banner_mega_001.png, ...
    ├── Logo_hero_001.png, Logo_compact_001.png, ...
    ├── QA_001.md                       # audit reports
    └── ...                             # flat structure, no subfolders
```

### Asset naming

Every file is `{Label}_{NNN}.png` — three-digit zero-padded counter,
per-label, monotonically increasing, **never overwritten**. See
`shared/asset_naming.md` for the full label table.

### Active project pointer

`~/.h5g-slot-active-project.json` holds the current active GameID so any
slot- skill can find your project without asking. Pass a different GameID
as a skill argument to switch projects:

```
/slot-step-03 4471
```

### Resolution and aspect ratio

Always API parameters, never in prompt text:
- `image_size`: defaults to `2K` (project minimum); `4K` for key art and
  upscales
- `aspect_ratio`: defaults to `1:1` for symbols, `9:16` for portrait BGs

The MCP server enforces these as enums. Any prompt body that contains
resolution or aspect ratio strings fails Gate 1 validation and is
rejected before NB2 sees it.

---

## Two-gate generation protocol

Every design skill runs validation before AND after generating:

- **Gate 1 (pre-generation):** Validates the prompt against the brief —
  style lock present, tier-correct palette, LP gold contamination check,
  wild category break, background color rule, no resolution strings.
  Nothing goes to NB2 until clean.
- **Gate 2 (post-generation):** Claude reads the image immediately. BLOCK
  items trigger automatic re-prompt + regenerate (max 2 retries). FLAG
  items surface a question. Only PASS moves to the next asset.

`/slot-step-08` is the **final** audit, not the first pass — for the
cross-asset consistency review you can only do once a full set is done.

---

## MCP tools

The bundled `nb2node` MCP server exposes 4 tools Claude calls directly:

| Tool | Description |
|---|---|
| `nb2_generate` | Text-to-image |
| `nb2_edit` | Image-to-image edit / reskin |
| `nb2_upscale` | Path-A 4K upscale |
| `nb2_smart_resize` | Multi-size pixel-perfect resize (fal.ai preferred via NB Pro endpoint; Gemini fallback via NB2 + local crop) |

---

## Shared reference docs

| File | Contents |
|---|---|
| `shared/project_memory.md` | Project state schema, startup protocol, atomic writes |
| `shared/asset_naming.md` | Filename convention, per-label counter logic |
| `shared/qa_preflight.md` | Two-gate validation protocol |
| `shared/nb2_prompting.md` | Master prompt formula, templates, style library |
| `shared/art_principles.md` | Mobile slot art principles — silhouette, hierarchy, lighting, CVD |
| `shared/upscale_workflow.md` | Path-A upscale loop |
