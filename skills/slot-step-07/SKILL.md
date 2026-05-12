---
name: slot-step-07
description: STEP 7 (optional) — Adapt an existing UI mock to a new theme/palette while preserving exact layout (button positions, panel proportions, control placement). Edit operation, not from-scratch generation. Use when reusing a proven UI layout across reskinned games or matching a partner's reference UI. Anchored to the locked key art so the new theme stays consistent.
---

# Step 7 — UI Reskin (optional)

Reskins an existing UI mock — same layout, new theme. Required when reusing
a proven UI from another game or adapting a partner's reference UI.

For from-scratch UI design, use `/slot-step-06` instead.

## Startup protocol

Follow `shared/project_memory.md` → "Skill startup protocol", including
the "no active project — guide through setup" pattern.

1. Resolve active project. **If none exists**, route to `/slot-step-01`
   → `/slot-step-02` → resume the reskin here in the same conversation.
2. Load `project.json`, `game_brief.json`.
3. Read `style_anchor.key_art_path` — the new theme's visual anchor.
   **If not locked**, route to `/slot-step-02` first; the new theme
   needs an anchor to reskin against.
4. **Required source image**: the UI mock to reskin. User provides the
   path. Without a source image, this skill has nothing to operate on —
   ask the user to attach or path-to one before continuing. (This is
   distinct from the prerequisite-chain pattern above; it's a per-call
   input the user controls, not a project setup state.)

### If the user pastes / attaches the UI mock in chat

Chat-attached images live in temp paths outside the allowed-roots envelope —
`nb2_edit` will reject them. **Stage first**, then use the staged path:

```
nb2_stage_image({ source: "<chat-temp-path>", label: "ui_reskin_source" })
  → ~/.h5g-slot-art-creator/inputs/ui_reskin_source_NNN.png
```

Pass that staged path as `source` to `nb2_edit` in Step 4. See
`shared/chat_image_staging.md` for full details on when staging is required.

## Workflow

### Step 1 — Identify source and target

- **Source image**: the existing UI mock to reskin (path provided by user
  or pulled from another approved asset like `Bezel_001.png` from a prior project)
- **Target theme**: the locked brief's style + palette

### Step 2 — Build the reskin prompt

Read the full 5-part bracketed-block prompt template in `RESKIN_TEMPLATE.md`
(short — about 30 lines including the substitution guide). The structure
locks layout preservation in part 1 and confines surface changes to part 2,
which is the structural discipline NB2 needs to actually preserve positions
when reskinning.

Fill the template's placeholders from the brief's `theme_summary`,
`palette_leads`, and `style_lock`.

### Step 3 — Pre-generation validation (Gate 1)

- [ ] Source image path provided and exists
- [ ] `style_lock` and palette from brief in the surface-changes block
- [ ] Both "preserve exactly" and "surface changes only" blocks present
- [ ] No hex / resolution / aspect ratio strings in prompt body

### Step 4 — Generate (edit operation)

**Pick the right tool first.** Text-heavy source UIs (paytables, logos,
HUDs with baked button labels, partner reference UIs full of copy)
preserve their wording more reliably with gpt-image-2; everything else
preserves layout better with NB2. Decision rule:

| Source UI has visible required text? | `OPENAI_API_KEY` set? | Use this tool |
|---|---|---|
| yes (labels, wordmarks, pay values) | yes | `mcp__nb2node__gpt2_edit` |
| yes | no | `mcp__nb2node__nb2_edit` (be ready for 2–4 attempts to keep text legible; verify every label at the QA gate) |
| no (pure chrome — bezel, panel, decorative banner) | either | `mcp__nb2node__nb2_edit` |

See `shared/gpt_image2_prompting.md` — its routing table lists this
skill explicitly. Both tools take the source UI mock in the same
`source` arg; the only difference is that `gpt2_edit` accepts a
compositional `extra_references` array (used here to pass the key art
as a style anchor), while `nb2_edit` accepts a single
`extra_references` path for the same purpose.

**API args (NB2 path — pure chrome reskins):**

| API arg | Value |
|---|---|
| `prompt` | composed reskin prompt |
| `source` | absolute path to the source UI mock — resolve any relative filenames against `project_root` first (`path.join(project_root, stored_relative_path)`) |
| `aspect_ratio` | match the source image's ratio (omit to inherit, or pass explicitly) |
| `image_size` | `"2K"` minimum |
| `output_dir` | **the source's category folder** — `path.join(project_root, "<SourceFolder>")`. Look at the source path: if it lives in `Bezels/`, the reskin lands in `Bezels/`; if it lives in `HUD/`, the reskin lands in `HUD/`. This keeps each surface's iterations together regardless of whether they came from generate or reskin. |
| `asset_name` | `"<SurfaceLabel>_reskin"`, e.g. `"Bezel_reskin"`, `"HUD_reskin"`, `"Paytable_reskin"`. The MCP server appends `_NNN.png` and auto-increments by scanning the target folder for files with that prefix. |
| `extra_references` | absolute path — resolve `style_anchor.key_art_path` against `project_root`, then pass `[<absolute>]` to lock the new theme. |

**API args (gpt2 path — text-heavy source UIs):**

| API arg | Value |
|---|---|
| `prompt` | same composed reskin prompt; gpt-image-2 honours the layout-preservation discipline when the source UI mock is passed as `source` (primary input) and the key art rides along as a style reference |
| `source` | absolute path to the source UI mock — same as the NB2 path. This is the **primary input** the edit operates on. Resolve any relative filename against `project_root` first; stage chat-attached paths via `nb2_stage_image` before passing them here. |
| `extra_references` | `[<absolute key art path>]` — gpt-image-2 composes the `source` plus every entry in `extra_references` together, so use this slot for **style anchors only** (the locked key art is the typical entry). Don't put the source UI mock here too — it goes in `source`. |
| `aspect_ratio` | match source |
| `image_size` | `"2K"` (the stable production ceiling) |
| `quality` | `"high"` |
| `output_dir` | same per-surface routing as the NB2 path — the source's category folder |
| `asset_name` | same convention as NB2 |

### Step 5 — Inline QA check — 8-axis layout-preservation rubric

Read the output. Compare against source:

| Axis | PASS | FAIL action |
|---|---|---|
| Control count | Same number of buttons/panels/labels | Add: "Do NOT add any control not visible in source image" |
| Control positions | Each control in roughly same x/y | Add: "preserve every control's pixel position relative to the canvas" |
| Control proportions | Same relative sizes | Add: "preserve the exact aspect-ratio of every individual button and panel" |
| Typographic hierarchy | Same text largest/smallest | Restate hierarchy explicitly |
| Spacing/padding | Same gaps | Add: "preserve all gaps and padding" |
| Theme application | Uniform new palette + decoration | Restate theme bullet in BOTH preservation AND surface-changes |
| Material consistency | Chrome reads as one set | Restate material treatment uniformly |
| Decorative motifs | Same positions as old ones | Add: "place decorative motifs in same positions as source" |

Any FAIL → patch prompt and regenerate (max 2 retries).

### Step 6 — Update state

Append the relative path (e.g. `"Bezels/Bezel_reskin_001.png"`) to
`project.json.assets.ui.<surface>.iterations`. If user approves, set
`project.json.assets.ui.<surface>.approved` to that same relative path.
The reskin iteration lands in the same `assets.ui.<surface>` slot as
a from-scratch generation — reskin is just another way to produce a
bezel/hud/paytable, not a separate asset type.

Set `current_step: "reskin_complete"`, `next_step: "/slot-step-08"`.

Schema follows the canonical asset record shape in
`shared/project_memory.md`.

### Step 7 — Next step nudge

```
✓ Step 7 — UI Reskin complete.
  Source : <source relative path, e.g. Bezels/Bezel_001.png>
  Output : <output relative path, e.g. Bezels/Bezel_reskin_001.png>
  Layout preserved across all 8 axes ✓
  Folder: <project_root>/<SourceFolder>/
  Open:   file:///<project_root>/<SourceFolder>/

Next: run `/slot-step-08` for the final cross-asset audit
or continue with more reskins.

Type `/slot-` to see the full numbered workflow.
```

## Hard rules

- **Source image required.** Skill does nothing without one.
- **Single source image only.**
- **Never change copy.** Don't rewrite button labels.
- **Match source aspect ratio** unless user explicitly requests reformat
  (passed via API arg, not prompt body).

## References

- `shared/qa_preflight.md`, `shared/project_memory.md`, `shared/asset_naming.md`
- `shared/nb2_prompting.md` §9.6 (edit ops — in-place / isolate / recreate / style-transfer / UI reskin / component separation)
- `shared/gpt_image2_prompting.md` (when to prefer `gpt2_edit` over `nb2_edit` — text-heavy source UIs; this skill's routing table is sourced from there)
- `shared/chat_image_staging.md` (required pre-step when the source UI mock is chat-attached — staging copies it into the allowed-roots envelope)
- `RESKIN_TEMPLATE.md` (5-part reskin template, 8-axis rubric)
