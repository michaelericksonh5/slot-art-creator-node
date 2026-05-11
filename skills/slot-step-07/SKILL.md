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

## Workflow

### Step 1 — Identify source and target

- **Source image**: the existing UI mock to reskin (path provided by user
  or pulled from another approved asset like `Bezel_001.png` from a prior project)
- **Target theme**: the locked brief's style + palette

### Step 2 — Build the reskin prompt

Use the 5-part structure from `RESKIN_TEMPLATE.md`:

```
Reskin this slot game UI mock with a new theme. Preserve exactly:
- pixel positions and proportions of every button, panel, label
- count and arrangement of all controls
- composition layout
- typographic hierarchy
- spacing and padding

Surface changes only:
- new theme: <theme_summary>
- new palette: <palette_leads.primary> with <palette_leads.accents> accents
- new material treatment for chrome, panels, button fills
- new decorative motifs in same positions
- new icon style for iconographic buttons

Do NOT move any control. Do NOT add or remove controls. Do NOT change
typographic hierarchy. The output is a reskinned version of the source
with the same layout exactly.
```

### Step 3 — Pre-generation validation (Gate 1)

- [ ] Source image path provided and exists
- [ ] `style_lock` and palette from brief in the surface-changes block
- [ ] Both "preserve exactly" and "surface changes only" blocks present
- [ ] No hex / resolution / aspect ratio strings in prompt body

### Step 4 — Generate (edit operation)

Call `mcp__nb2node__nb2_edit`:

| API arg | Value |
|---|---|
| `prompt` | composed reskin prompt |
| `source` | absolute path to the source UI mock — resolve any relative filenames against `project_root` first |
| `aspect_ratio` | match the source image's ratio (omit to inherit, or pass explicitly) |
| `image_size` | `"2K"` minimum |
| `output_dir` | `{project_root}` |
| `asset_name` | `"<SurfaceLabel>_reskin"`, e.g. `"Bezel_reskin"`, `"HUD_reskin"` (the MCP server appends `_NNN.png` and auto-increments) |
| `extra_references` | absolute path — resolve `style_anchor.key_art_path` against `project_root`, then pass `[<absolute>]` to lock the new theme. |

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
