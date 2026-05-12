---
name: slot-step-00
description: STEP 0 (optional) — Pull a Game Design Document from the team Google Drive, extract theme/mechanics/symbol structure, and seed the project. Run this BEFORE /slot-step-01 if a GDD already exists for this game. Skip directly to /slot-step-01 if you're pitching a new concept without a GDD.
---

# Step 0 — GDD Connect (optional)

Pulls a GDD from the team's shared Drive folder and uses it to bootstrap a
new project. After this skill runs, the brief is pre-populated and the
user can review/refine in `/slot-step-01`.

**Prerequisite:** Google Drive must be connected to Claude. If Drive tools
aren't available, tell the user to enable the Google Drive integration in
Claude settings, then reload.

This skill is **optional**. Skip directly to `/slot-step-01` if:
- The user is pitching a fresh concept (no GDD on Drive)
- Google Drive isn't connected and won't be in this session
- The user has the GDD content as plain text and prefers to paste it

---

## Startup protocol

Follow the standard startup from `shared/project_memory.md`, with two
caveats specific to step 0:

1. **Active project may not exist yet.** This is often the FIRST step in a
   project's life. If `~/.h5g-slot-active-project.json` is missing, that's
   fine — this skill creates the project. If it points to an existing
   project, ask the user: "Are you bootstrapping a new project, or
   re-syncing the GDD on the active project?"
2. **Drive tools must be present.** Detect Drive MCP tools at startup
   (look for `mcp__*__read_file_content`, `search_files`, etc.). If
   missing, tell the user to enable Google Drive in Claude settings and
   offer to skip ahead to `/slot-step-01` for a manual brief.

If both gates pass, continue to the workflow.

---

## Workflow

### Step 1 — Identify project + GDD

Ask: **"What's the GameID for this project?"** (numeric, e.g. `4470`).

Then ask: **"What's the game name or title of the GDD on Drive?"**

Search the canonical GDD folder
(`https://drive.google.com/drive/folders/1SfzTV7n6CPlNXjMTR-RfRLtXIaJ-wCtr`)
restricting to that folder so unrelated team-wide hits don't pollute results:

```
'1SfzTV7n6CPlNXjMTR-RfRLtXIaJ-wCtr' in parents
  and fullText contains '<game name>'
  and mimeType != 'application/vnd.google-apps.folder'
  and trashed = false
```

Drive CQL uses `'<folder_id>' in parents` (not `parentId = '<folder_id>'`)
— the latter is invalid and silently returns nothing.

Use the **highest version** if multiple are found. Confirm with the user.

### Step 2 — Read the GDD

Call `read_file_content` with the file ID. `.docx`, `.pdf`, and Google Docs
all return clean text. Do not download or convert to PDF.

### Step 3 — Read reference images (if any)

Search the same folder for image files using the correct CQL form:

```
'<folder_id>' in parents
  and (mimeType = 'image/png' or mimeType = 'image/jpeg')
  and trashed = false
```

Call `read_file_content` on each — Claude sees them visually. Use them to
sharpen palette, mood, and style decisions before locking the brief.

### Step 4 — Bootstrap the project folder

Resolve `<PROJECT_BASE>` using the standard order from
`shared/project_memory.md` → "Resolving `<PROJECT_BASE>` at runtime":

1. `SLOT_ART_PROJECT_BASE` env var if set
2. The H5G shared Drive Stream path
   (`H:\Shared drives\Content Management - AI\Production_AI 2\Asset_Creation_Suite\`
   on Windows, the equivalent `/Volumes/GoogleDrive/Shared drives/...` on
   Mac) — only if it exists on this machine
3. `~/slot-art-projects/` per-user fallback

`username` comes from `os.userInfo().username` (or `%USERNAME%` on Windows
/ `$USER` on Mac/Linux as a fallback). Do not hardcode it.

Construct the project root:

```
<PROJECT_BASE>/{GameID}_{username}
```

Create the folder if it doesn't exist. Inside it, create:

- `project.json` — populated from the schema in `shared/project_memory.md`
- `game_brief.json` — partial brief seeded from GDD extraction

Set `~/.h5g-slot-active-project.json` to point to this new project.

### Step 5 — Extract GDD structure into the brief

Pull the following from the GDD text. Mark fields `null` if absent — never
fabricate:

| Field | Where to look |
|---|---|
| `game_name` | Title — use marketing/player-facing name, NEVER internal codenames |
| `theme_summary` | Overview / concept |
| `grid` | Math spec ("5x3", "5x4") |
| `symbol_manifest` | Paytable or art spec table |
| `mode_list` | Feature list |
| `rtp` | Math spec (record only, not used in art prompts) |
| `lp_family` | Are LPs cards, suits, gems, or themed objects? |
| `wild_description` | Wild symbol section |
| `scatter_description` | Scatter section |

Store the GDD source in both `project.json.gdd_source` and `game_brief.json.gdd_source`:

```json
"gdd_source": {
  "file_id": "<Drive ID>",
  "file_name": "<filename>",
  "drive_url": "https://drive.google.com/file/d/<ID>/view",
  "version_extracted": "<version>",
  "extracted_at": "<ISO date>"
}
```

### Step 6 — Atomic write + report

Atomic-write `project.json` and `game_brief.json` (write `.tmp`, then rename).

Set `current_step: "gdd_loaded"`, `next_step: "/slot-step-01"`. See
`shared/project_memory.md` → "current_step and next_step vocabulary".

Show a summary table:

```
GameID           : 4470
Project root     : <resolved PROJECT_BASE>/4470_<username>
Game name        : Jungle Kingdom
Grid             : 5x4
Symbols          : 13 (extracted)
Modes            : base, free spins, bonus pick-me
GDD source       : Jungle Kingdom Game Design Document v.0.0.2.docx
Reference images : 3 (visually analyzed)
Open questions   : 2 (style_lock, palette — to be locked in /slot-01)
```

### Step 7 — Next step nudge

```
✓ Step 0 — GDD Connect complete.
  Project active: {GameID}_{username}
  Folder: <project_root>
  Open:   file:///<project_root with / separators>

Next: run `/slot-step-01` to lock theme, palette, and tier plan.
Type `/slot-` to see the full numbered workflow.
```

---

## Re-syncing from an updated GDD

If `project.json.gdd_source.file_id` is already set, running this skill again
re-reads the same GDD and shows a diff. User approves changes one by one
before the brief is updated.

---

## When Drive isn't connected

Tell the user to enable Google Drive in Claude settings. Offer to skip
ahead to `/slot-step-01` for a manual brief.

## References

- `shared/project_memory.md` (project state schema, atomic writes)
- `shared/asset_naming.md` (file conventions for the project folder)
- `skills/slot-step-01/GAME_BRIEF_TEMPLATE.md` (target schema)
