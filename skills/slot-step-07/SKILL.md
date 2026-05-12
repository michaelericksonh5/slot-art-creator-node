---
name: slot-step-07
description: STEP 7 (optional) — Adapt an existing UI mock to a new theme/palette while preserving exact layout (button positions, panel proportions, control placement). Edit operation, not from-scratch generation. Use when reusing a proven UI layout across reskinned games or matching a partner's reference UI. Anchored to the locked key art so the new theme stays consistent.
---

# Step 7 — UI Reskin (optional)

Reskins an existing UI mock — same layout, new theme. Required when reusing
a proven UI from another game or adapting a partner's reference UI.

For from-scratch UI design, use `/slot-step-06` instead.

## Startup protocol

1. Resolve active project
2. Load `project.json`, `game_brief.json`
3. Read `style_anchor.key_art_path` — the new theme's visual anchor
4. **Required source image**: the UI mock to reskin. User provides the path.

If no source image, stop. This skill does nothing without one.

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

**Choose the right tool first** — inspect the source image for text density:

- **Art-dominant (buttons, bezels, backgrounds with minimal text):** use
  `nb2_edit`. NB2 is strong at visual reskins and handles palette + material
  changes reliably.
- **Text-heavy (HUD balance displays, paytable screens, lobby tiles with
  readable labels, bet-panel copy):** use `gpt2_edit` instead.
  `nb2_edit` cannot accurately reproduce text — it will scramble or drop
  button labels and numerals. `gpt2_edit` renders text faithfully.
  Requires `OPENAI_API_KEY`. If not set, fall back to `nb2_edit` and flag
  to the user that text may need manual correction.

**nb2_edit call (art-dominant):**

| API arg | Value |
|---|---|
| `prompt` | composed reskin prompt |
| `source` | absolute path to the source UI mock |
| `aspect_ratio` | match the source image's ratio (omit to inherit) |
| `image_size` | `"2K"` minimum |
| `output_dir` | `{project_root}` |
| `asset_name` | `"<SurfaceLabel>_reskin"` (server appends `_NNN.png`) |
| `extra_references` | `[<absolute path to style_anchor.key_art_path>]` |

**gpt2_edit call (text-heavy):**

| API arg | Value |
|---|---|
| `prompt` | composed reskin prompt (same template, same structure) |
| `source` | absolute path to the source UI mock |
| `image_size` | `"2K"` (gpt-image-2's stable ceiling — always specify explicitly) |
| `output_dir` | `{project_root}` |
| `asset_name` | `"<SurfaceLabel>_reskin"` |
| `extra_references` | `[<absolute path to style_anchor.key_art_path>]` |

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

Append to `project.json.assets.ui.<surface>.iterations`. If user approves,
set `project.json.assets.ui.<surface>.approved`.

Set `current_step: "reskin_complete"`, `next_step: "/slot-step-08"`.

Schema follows the canonical asset record shape in
`shared/project_memory.md`.

### Step 7 — Next step nudge

```
✓ Step 7 — UI Reskin complete.
  Source : <source path>
  Output : <Output filename>
  Layout preserved across all 8 axes ✓
  Folder: <project_root>
  Open:   file:///<project_root with / separators>

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
- `shared/nb2_prompting.md` §9.6 (edit ops)
- `RESKIN_TEMPLATE.md` (5-part reskin template, 8-axis rubric)
