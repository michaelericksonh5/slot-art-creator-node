# Project Memory — Persistent State Across Sessions

Every slot-art-creator skill loads and updates a shared project state file
so locked decisions (theme, palette, key art path, asset registry) survive
Claude Code session restarts and conversation compaction.

This document describes the canonical state model. Every skill follows it.

## Contents

- **File layout** — where project folders live, what's inside each
- **`project.json` schema** — canonical structure: brief, style_anchor,
  assets (key/sheet/symbols/backgrounds/ui/qa), counters, timestamps
- **Skill startup protocol** — the 7-step routine every skill follows on
  invocation
- **Active-project pointer file** — `~/.h5g-slot-active-project.json`
- **Path convention** — relative in JSON, absolute at use time, with
  resolution rules for cross-platform safety
- **Atomic writes (Drive Stream safety)** — tmp-write + rename pattern
- **What happens after compaction** — how a fresh Claude session picks
  up where the previous one left off
- **What does NOT go in project memory** — chat messages, partial drafts,
  raw prompt text
- **Style anchor management** — building, storing, and reusing the
  game-wide discipline block from §9.2.1 of nb2_prompting.md
- **Non-linear workflow** — handling out-of-order step invocations

---

## File layout

```
<PROJECT_BASE>/
└── {GameID}_{username}/                          ← one project folder per game
    ├── project.json                              ← THE source of truth
    ├── game_brief.json                           ← human-readable brief mirror
    ├── Key_001.png, Key_002.png, ...             ← key art iterations
    ├── Sheet_001.png                             ← symbol contact sheets
    ├── HP1_001.png, HP1_002.png, ...             ← per-symbol iterations
    ├── HP2_001.png, MP1_001.png, LP1_001.png ...
    ├── BG_base_001.png, BG_freespins_001.png ... ← background variants
    ├── Bezel_001.png                             ← reel frame
    ├── HUD_001.png, Paytable_001.png             ← UI surfaces
    ├── Banner_big_001.png, Banner_mega_001.png   ← win banners by tier
    ├── Logo_hero_001.png, Logo_compact_001.png   ← logo lockups
    ├── QA_001.md                                 ← QA audit reports
    └── (no subfolders — flat structure for fast scanning)
```

### Resolving `<PROJECT_BASE>` at runtime

Every skill resolves `<PROJECT_BASE>` in this order. First hit wins:

1. **`SLOT_ART_PROJECT_BASE` env var** — set per-machine when the user has
   a custom location, e.g. an external drive or shared mount that isn't
   on H:. Most flexible option.
2. **H5G shared Drive Stream** — `H:\Shared drives\Content Management - AI\Production_AI 2\Asset_Creation_Suite\`
   (Windows) or the equivalent Mac path (`/Volumes/GoogleDrive/Shared drives/...`).
   Used by H5G colleagues by default. Detected by checking `fs.existsSync`
   on the path; if missing, fall through.
3. **`~/slot-art-projects/`** — per-user local fallback. Created on first
   write if it doesn't exist. This is the path external (non-H5G) users
   land on without configuration.

Persist the resolved `<PROJECT_BASE>` into `project.json.project_root` as
an absolute path on creation, so subsequent skills don't have to re-resolve.

### H5G colleagues

The default path resolves to `H:\Shared drives\Content Management - AI\Production_AI 2\Asset_Creation_Suite\`
automatically because Drive Stream maps the same way for everyone with the
shared drive mounted. No configuration needed.

### External / non-H5G users

The default path doesn't exist, so resolution falls through to step 3 and
creates `~/slot-art-projects/<GameID>_<username>/` on first generation. To
relocate (e.g. to a Dropbox folder), set the env var before launching
Claude Code:

```
# Windows (PowerShell)
$env:SLOT_ART_PROJECT_BASE = "C:\Users\you\Dropbox\slot-art-projects"

# Mac/Linux
export SLOT_ART_PROJECT_BASE="$HOME/Dropbox/slot-art-projects"
```

Active project pointer (per-user, persists across sessions):

```
%USERPROFILE%\.h5g-slot-active-project.json   (Windows)
$HOME/.h5g-slot-active-project.json           (macOS/Linux)
```

This pointer file holds `{game_id, username, project_root, set_at}` so any
skill can find the active project without asking the user every time.

---

## `project.json` schema (canonical — every skill follows this)

```json
{
  "schema": "h5g_slot_project.v1",
  "game_id": "4470",
  "username": "merickson",
  "project_root": "H:\\Shared drives\\Content Management - AI\\Production_AI 2\\Asset_Creation_Suite\\4470_merickson",
  "created_at": "2026-05-06T15:30:00Z",
  "updated_at": "2026-05-06T16:45:00Z",

  "current_step": "key_art_locked",
  "next_step": "/slot-step-03",

  "brief": { "...full game_brief.json contents..." },

  "style_anchor": {
    "text": "You are generating art assets for a mobile slot machine game (\"Phoenix of Ardashir\" — a mystical regal phoenix awakens over ancient gold). Every output must be optimized for small phone screens — every element must be recognizable by silhouette alone when small on a phone. Use bold, clean shapes — no intricate micro-textures, no dense filigree that collapses at thumbnail size. High contrast between foreground and the flat background. Warm saturated colors signal high pay; cool muted colors signal low pay. Gold is reserved for premium and special symbols only. Maintain a consistent stylized semi-realistic slot game art rendering technique across the entire set.",
    "key_art_path": "Key_003.png",
    "locked_at": "2026-05-06T16:00:00Z",
    "notes": "Approved by user — all downstream art reads this as visual reference"
  },

  "assets": {
    "key": {
      "iterations": ["Key_001.png", "Key_002.png", "Key_003.png"],
      "approved": "Key_003.png",
      "upscaled": null,
      "resized": []
    },
    "sheet": {
      "iterations": ["Sheet_001.png"],
      "approved": "Sheet_001.png",
      "upscaled": null
    },
    "symbols": {
      "HP1": {
        "iterations": ["HP1_001.png", "HP1_002.png"],
        "approved": "HP1_002.png",
        "upscaled": "HP1_002_4K.png",
        "resized": []
      },
      "HP2": { "iterations": [], "approved": null, "upscaled": null, "resized": [] },
      "MP1": { "iterations": [], "approved": null, "upscaled": null, "resized": [] },
      "LP1": { "iterations": [], "approved": null, "upscaled": null, "resized": [] },
      "WILD":    { "iterations": [], "approved": null, "upscaled": null, "resized": [] },
      "SCATTER": { "iterations": [], "approved": null, "upscaled": null, "resized": [] }
    },
    "backgrounds": {
      "base":      { "iterations": [], "approved": null, "upscaled": null, "resized": [] },
      "freespins": { "iterations": [], "approved": null, "upscaled": null, "resized": [] },
      "bonus":     { "iterations": [], "approved": null, "upscaled": null, "resized": [] },
      "pickme":    { "iterations": [], "approved": null, "upscaled": null, "resized": [] },
      "wheel":     { "iterations": [], "approved": null, "upscaled": null, "resized": [] }
    },
    "ui": {
      "bezel":      { "iterations": [], "approved": null, "upscaled": null },
      "hud":        { "iterations": [], "approved": null, "upscaled": null },
      "paytable":   { "iterations": [], "approved": null, "upscaled": null },
      "bonus_screen": { "iterations": [], "approved": null, "upscaled": null },
      "lobby_tile": { "iterations": [], "approved": null, "upscaled": null },
      "banners": {
        "small":  { "iterations": [], "approved": null },
        "medium": { "iterations": [], "approved": null },
        "big":    { "iterations": [], "approved": null },
        "mega":   { "iterations": [], "approved": null },
        "epic":   { "iterations": [], "approved": null }
      },
      "multipliers": {
        "x2": { "iterations": [], "approved": null },
        "x5": { "iterations": [], "approved": null }
      },
      "logos": {
        "hero":     { "iterations": [], "approved": null },
        "standard": { "iterations": [], "approved": null },
        "compact":  { "iterations": [], "approved": null }
      }
    },
    "qa_reports": ["QA_001.md"]
  },

  "gdd_source": {
    "file_id": null, "file_name": null, "drive_url": null,
    "version_extracted": null, "extracted_at": null
  }
}
```

### `style_anchor` field contract

`project.json.style_anchor` is an **object** with four fields. Every
downstream skill reads from it by name — don't relocate these fields.

| Field | Type | Written by | Read by |
|---|---|---|---|
| `text` | string (60–90 words) | `/slot-step-01` from the §9.2.1 template | every NB2 / gpt-image-2 generation skill — prepended verbatim to every prompt body |
| `key_art_path` | bare filename (resolve against `project_root`) | `/slot-step-02` on user approval | every skill that passes the key art as a reference image (`/slot-step-03`–`/slot-step-10`) |
| `locked_at` | ISO timestamp | `/slot-step-02` on user approval | `/slot-step-08` (audit), human ops |
| `notes` | optional string | `/slot-step-02` or user edit | human ops |

`game_brief.json` may carry a `style_anchor` string mirror and a
`key_art_path` mirror for human readability, but the canonical write
target and the canonical read source for downstream skills is always
`project.json.style_anchor`.

### Asset record shape (the universal pattern)

Every asset slot follows this shape:

```json
{
  "iterations": ["File_001.png", "File_002.png"],   // every generation, in order
  "approved": "File_002.png",                       // null until user picks one
  "upscaled": "File_002_4K.png",                    // null until /slot-09 runs
  "resized": [                                      // empty until /slot-10 runs
    {"aspect": "16x9", "path": "File_002_resized_16x9.png"}
  ]
}
```

- `iterations` — append-only list of every generated filename for this slot. Never overwrite.
- `approved` — single filename the user picked as canonical for this slot. Null if not yet approved. Defaults to the latest iteration when ambiguous.
- `upscaled` — null until `/slot-step-09` produces a 4K version of `approved`.
- `resized` — empty until `/slot-step-10` produces aspect variants.

For UI banner tiers and multiplier denominations and logo lockups, the
nested object holds one record per variant, each following the shape above
(with `upscaled`/`resized` optional since banners rarely need them).

### `current_step` and `next_step` vocabulary

`current_step` uses the exact name of the most recently completed step.
`next_step` is a slash command (with leading `/`) the user should run next.

| current_step | next_step | Set by |
|---|---|---|
| `gdd_loaded` | `/slot-step-01` | slot-step-00 |
| `brief_locked` | `/slot-step-02` | slot-step-01 |
| `key_art_locked` | `/slot-step-03` | slot-step-02 |
| `symbols_in_progress` | `/slot-step-03` (continue) or `/slot-step-04` | slot-step-03 |
| `sheet_locked` | `/slot-step-05` | slot-step-04 |
| `backgrounds_in_progress` | `/slot-step-05` (continue) or `/slot-step-06` | slot-step-05 |
| `ui_in_progress` | `/slot-step-06` (continue) or `/slot-step-08` | slot-step-06 |
| `reskin_complete` | `/slot-step-08` | slot-step-07 |
| `audit_complete` | `/slot-step-09` (if audit GREEN) or specific design skill (if RED/YELLOW) | slot-step-08 |
| `upscale_in_progress` | `/slot-step-09` (continue) or `/slot-step-10` | slot-step-09 |
| `delivery_complete` | (project done) | slot-step-10 |

The `audit_complete` step's followup depends on the QA grade — included
in the QA report and the next-step nudge.

---

## Skill startup protocol

Every skill follows this exact sequence on invocation:

### Step 1: Find the active project

```
1. Did the user pass a GameID argument? (e.g., /slot-step-03 4470)
   → Yes: use that GameID to construct project_root, update active-project pointer
   → No: read ~/.h5g-slot-active-project.json
        → File exists: use it
        → File missing: list folders in the active PROJECT_BASE and ask user to pick
                        OR offer to start a new project via /slot-step-01
```

When constructing a NEW `project_root` from a GameID + username, resolve
the `<PROJECT_BASE>` in the order documented above (env var → H5G Drive
Stream → `~/slot-art-projects/`). The resulting `project_root` looks like:

```
<PROJECT_BASE>/<GameID>_<username>/
```

`username` comes from `os.userInfo().username` (or `$USER` / `%USERNAME%`
as a fallback). Persist the resolved absolute `project_root` into
`project.json` so later skills don't re-resolve.

### Step 2: Load project.json

Read `{project_root}/project.json`. If it doesn't exist:
- Skill is `/slot-step-01`: this is fine, you're creating it
- Any other skill: stop and tell the user to run `/slot-step-01` first

### Step 3: Read the style anchor (the key art)

If `project.json.style_anchor.key_art_path` is set, read the image at
`{project_root}/{key_art_path}` using the Read tool. This image is the
visual ground truth for everything else generated. Pass it to NB2 as a
reference image when generating any new asset.

If style_anchor is NOT set and the current skill is anything other than
`/slot-step-01` or `/slot-step-02`, warn the user that downstream
art will be less consistent without a locked key art and offer to run
`/slot-step-02` first.

### Step 4: Do the skill's actual work

Generate, edit, review, etc. — the skill's specific job.

### Step 5: Save outputs

Save generated images to the project_root with the correct naming
convention (see `shared/asset_naming.md`). Never overwrite — always
auto-increment.

### Step 6: Update project.json

After every generation:
- Append the new file path to the appropriate `assets[...]` array
- Update `updated_at`
- Update `current_step` and `next_step`
- Atomic write: write to `project.json.tmp`, then rename to `project.json`
  (avoids corruption if the write is interrupted, especially on Drive Stream)

### Step 7: Nudge the next step

Every skill ends its response with the next-step nudge:

```
✓ [Skill] complete.

Next: run `/slot-XX-skillname` to [what the next step does].
Type `/slot-` to see the full numbered workflow.
```

---

## Active-project pointer file

`~/.h5g-slot-active-project.json` holds:

```json
{
  "schema": "h5g_active_project.v1",
  "game_id": "4470",
  "username": "merickson",
  "project_root": "H:\\Shared drives\\Content Management - AI\\Production_AI 2\\Asset_Creation_Suite\\4470_merickson",
  "set_at": "2026-05-06T15:30:00Z"
}
```

Every skill that successfully resolves an active project writes/updates
this pointer. It survives Claude Code restart and conversation compaction.

A user can switch projects in two ways:
1. Pass a different GameID as a skill argument: `/slot-step-03 4471`
2. Manually edit the pointer file (last resort)

---

## Path convention — relative in JSON, absolute at use time

All asset paths recorded in `project.json` are stored as **bare filenames
relative to `project_root`**. Examples:

```json
"style_anchor": { "key_art_path": "Key_003.png" }
"assets": {
  "key": { "iterations": ["Key_001.png", "Key_002.png", "Key_003.png"], "approved": "Key_003.png" },
  "symbols": { "HP1": { "approved": "HP1_002.png" } }
}
```

Why relative: the project folder stays portable. If a teammate copies
`H:\Shared drives\...\4470_merickson\` to a different drive, the
`project.json` still works — every filename resolves correctly against
the new `project_root`.

**At use time** — whenever you pass an asset path to:
- An MCP tool (`source`, `references`, `image`, etc. — `uploadLocalFile` does `fs.readFileSync` and needs absolute)
- A `Read` tool call (Read needs absolute path)
- A `Write` / save operation
- A child process that reads the file

… resolve to an absolute path first by joining with `project_root`:

```
absolute = path.join(project.project_root, project.style_anchor.key_art_path)
```

The `project_root` field in `project.json` IS stored as an absolute path
(it's the canonical project location), so resolution is one `path.join`
call. Skills that forget to resolve will silently fail with ENOENT or
have the MCP tool save to a wrong default folder.

When the MCP tool RETURNS a path, it returns absolute. Skills should
strip back to bare filename (using `path.basename`) before storing in
`project.json`, to keep the JSON portable.

## Atomic writes (Drive Stream safety)

Google Drive for Desktop / Drive Stream sometimes lags on file syncs.
To avoid corrupting `project.json` if a write is interrupted:

1. Read the existing `project.json` into memory
2. Modify in memory
3. Write to `project.json.tmp` in the same folder
4. Rename `project.json.tmp` → `project.json` (atomic on the same volume)

If a skill encounters a `.tmp` leftover from a previous crashed write,
warn the user and refuse to proceed until they decide whether to keep
the leftover or discard it.

---

## What happens after compaction

Conversation compaction discards the in-memory chat history but does not
touch any disk file. After compaction:

1. The user invokes any slot- skill
2. The skill follows the startup protocol above
3. `~/.h5g-slot-active-project.json` is read → project_root resolved
4. `project.json` is read → all locked decisions restored
5. The key art image is re-read into context as the visual anchor
6. Work continues as if nothing happened

The user does NOT need to re-establish theme, palette, style, or the
generated asset list. That's the entire point of project memory.

---

## What does NOT go in project memory

- API keys (handled by env vars / `setup-keys.js`)
- Generated image bytes (those live as PNGs on disk; `project.json` only stores paths)
- Per-image prompt history (each PNG gets its own `.meta.json` sidecar — see `shared/asset_naming.md`)
- Anything user-specific that isn't tied to this game project

---

## Style anchor management

The `style_anchor.key_art_path` field in `project.json` is what every
downstream skill reads as the visual ground truth. Three ways the user
controls it:

### 1. Approve at generation time (the default flow)

When `/slot-step-02` returns a generated image, it asks:

> Approve this as the locked key art, or iterate?

**On approve:** Claude sets `style_anchor.key_art_path = "Key_NNN.png"`,
records the timestamp, and writes `project.json`. Every later skill
auto-reads this file as a reference.

### 2. Switch the anchor later

The user can change which key art is the locked anchor at any time:

```
"Use Key_005 as the new anchor"
"Lock Key_002 instead — it had better palette"
```

Any skill processes that as a state edit:
- Confirm `Key_005.png` exists in the project folder
- Update `style_anchor.key_art_path = "Key_005.png"`
- Update `style_anchor.locked_at` to now
- Write `project.json` atomically

### 3. Override per generation

For one-off generations using a different reference (e.g., trying a
specific symbol against an experimental key art that isn't locked yet),
pass an explicit reference image:

```
"Generate HP1 using Key_007.png as reference instead of the locked anchor"
```

The skill passes that path to NB2's `reference_images` arg without
touching `project.json`. The locked anchor stays unchanged.

### Picking by visual review (any skill, any time)

The user can ask: "Show me Key_001, Key_003, and Key_005 — I want to pick
one to lock." Claude reads each image, presents them, and the user picks.

Filenames are the canonical identifier. Sidecars (`Key_NNN.meta.json`)
hold the prompt that produced each one — useful for "I liked iteration 3,
let me try a tweak of that prompt" workflows.

---

## Non-linear workflow

The numbered slash commands are a **recommendation**, not enforcement.
After the foundation is laid (brief locked + key art locked), the user
can jump between skills as needed:

- After key art, run `/slot-step-04` in **ideation mode** to
  brainstorm symbols visually before refining individuals
- Bounce between `/slot-step-03` and `/slot-step-04`
  as you iterate
- Skip `/slot-step-04` entirely if you'd rather build symbols
  one at a time
- Run `/slot-step-05` while symbols are still in flux
- Run `/slot-step-08` at any checkpoint, not just at the end

Every skill's startup protocol detects what's already been done. They
adapt:
- If symbols don't exist yet, symbol-sheet runs in ideation mode
- If background isn't done yet, UI designer warns but proceeds
- If brief is missing, every skill stops and routes to `/slot-step-01`

The only hard ordering constraint: **brief and key art must be locked
before any other generation skill runs.** Those two anchor everything.
