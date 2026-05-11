---
name: slot-step-10
description: STEP 10 (final) — Produce pixel-perfect multi-aspect variants of an approved asset (e.g., generate 1:1, 16:9, and 9:16 versions of a hero asset). Either Gemini or fal.ai works fully for this; when both keys are set the plugin routes to fal.ai's purpose-built nano-banana-pro endpoint (single API call) over Gemini's NB2 + center-crop path. For single-aspect upscale use /slot-step-09.
---

# Step 10 — Smart Resize (final delivery)

Generates multi-aspect-ratio variants from one source asset. Unlike a
crop, smart-resize **recomposes** the subject for each target — useful
for marketing crops, lobby thumbnails, ad variants.

## Backends — which one runs depends on which key is set AND whether the source has text

There are now **three tools** to choose from. Pick by source content first,
then by which keys are available:

| Source has critical text? | Best tool | Underlying model | Cost |
|---|---|---|---|
| **No** (symbols, characters, scenes, abstract art) | `nb2_smart_resize` | fal.ai NB Pro or Gemini NB2 fallback | Cheapest — single API call for fal.ai, N calls for Gemini |
| **Yes** (paytable, logo, banner with copy, anything with a wordmark) | `gpt2_smart_resize` | OpenAI gpt-image-2 | More expensive — N calls (one per target size), but text stays readable across the resize |

`nb2_smart_resize` routing within NB2:

| Keys present | Backend | Underlying model | Notes |
|---|---|---|---|
| `FAL_KEY` (with or without Gemini) | fal.ai | **nano-banana-pro** | Single API call, purpose-built endpoint. Preferred for non-text sources. |
| Only `GEMINI_API_KEY` | Gemini | **gemini-3.1-flash-image-preview** (NB2) | One Gemini call per target + pngjs center-crop locally. |

`gpt2_smart_resize`:

| Keys present | Behavior |
|---|---|
| `OPENAI_API_KEY` | Issues one `gpt2_edit` call per target size with a recompose prompt. gpt-image-2 preserves text rendering across the resize. STABLE production sizes: up to 2K; 4K targets are experimental. |
| OPENAI key missing | Tool errors with a helpful message pointing at `/slot-setup`. |

**Both NB2 backends produce pixel-perfect output** at the requested
dimensions. The recipe is the same idea — generate at the smallest
preset that fully covers the target, then center-crop to the exact
W×H — but the fal.ai version does it as one server-side call, while
the Gemini version does it client-side here in Node (using pngjs for
the crop, no native deps).

**`gpt2_smart_resize` is one full edit call per target size**, so cost
scales linearly with the number of targets. Worth it when text fidelity
matters; not worth it otherwise.

## Startup protocol

1. Resolve active project
2. Load `project.json`
3. Detect available API key(s):
   - If `FAL_KEY` is set → fal.ai backend
   - Else if `GEMINI_API_KEY` / `GOOGLE_API_KEY` is set → Gemini backend
   - Else → tell the user to run `setup-keys.js` and stop
4. Identify the source asset to resize. Typically the locked key art for
   marketing crops, or an approved hero symbol for lobby/banner variants.

## Workflow

### Step 1 — Pick source and targets

Source: any approved image in the project folder.

**If the user pastes / attaches an external asset in chat** that they want
resized to multiple aspects, that path lives in a temp location outside
the allowed-roots envelope — `nb2_smart_resize` will reject it. Stage it
first:

```
nb2_stage_image({ source: "<chat-temp-path>", label: "user_resize_source" })
  → ~/.h5g-slot-art-creator/inputs/user_resize_source_NNN.png
```

Pass the staged path as `source` to `nb2_smart_resize` in Step 4. See
`shared/chat_image_staging.md` for full details.

Targets: list of `{aspect_ratio, label}` pairs. Common combinations:

| Use case | Targets |
|---|---|
| Marketing trio | `[{1:1, "square"}, {16:9, "wide"}, {9:16, "tall"}]` |
| Lobby + banner | `[{1:1, "tile"}, {16:9, "banner"}]` |
| Mobile portrait + landscape | `[{9:16, "portrait"}, {16:9, "landscape"}]` |

### Step 2 — Build the prompt

Smart-resize uses a short recomposition prompt:

```
Recompose this image at the new aspect ratio while preserving the subject,
palette, style, and overall mood. Adjust framing and composition as needed
to fit the target shape. Do not crop awkwardly; recompose intelligently.
Keep the hero subject as the focal point.
```

If the source is key art with specific composition rules (vignette,
three-layer depth, hero centered), restate them so smart-resize preserves
the design intent at every target ratio.

### Step 3 — Pre-generation validation

- [ ] Source path exists
- [ ] At least one target aspect ratio specified
- [ ] All target ratios are valid NB2 ratios
- [ ] No hex / resolution strings in prompt body
- [ ] At least one of `FAL_KEY` or `GEMINI_API_KEY` is set

### Step 4 — Generate

Call `mcp__nb2node__nb2_smart_resize`:

| API arg | Value |
|---|---|
| `prompt` | composed recomposition prompt |
| `source` | absolute path to the source asset — resolve `style_anchor.key_art_path` (or whichever asset filename) against `project_root` first |
| `target_sizes` | array of `"WxH"` strings derived from target aspect ratios at the same resolution as source (e.g. `["2048x2048", "3840x2160", "2160x3840"]`) |
| `output_dir` | `{project_root}` |

The MCP tool returns one output file per target. Default naming follows
`{source_label}_resized_{aspect}.png` — e.g. `Key_003_resized_16x9.png`.

### Step 5 — Inline review

Read each output. Confirm:
- Subject preserved at each ratio
- Palette consistent across all variants
- No awkward crops or stretched elements
- Composition reads correctly at each aspect (focal point still focal)

If a variant fails, regenerate just that one with adjusted prompt
emphasizing the failure point.

### Step 6 — Update state

Append each variant to the appropriate slot's `resized` array as
`{aspect, path}` entries. Examples:

```json
"assets.key.resized": [
  {"aspect": "1:1", "path": "Key_003_resized_1x1.png"},
  {"aspect": "16:9", "path": "Key_003_resized_16x9.png"}
]
"assets.backgrounds.base.resized": [
  {"aspect": "16:9", "path": "BG_base_001_resized_16x9.png"}
]
```

Set `current_step: "delivery_complete"`, `next_step: null` (project done)
or `"/slot-step-08"` to re-audit the final delivery.

Schema follows the canonical asset record shape.

### Step 7 — Next step nudge

```
✓ Step 10 — Smart Resize complete.
  Source : Key_003.png
  Folder : <project_root>  (e.g. H:\Shared drives\...\Asset_Creation_Suite\{GameID}_{username})
  Open   : file:///<project_root with / separators>
  Variants:
    - Key_003_resized_1x1.png   (1:1 square — lobby tile)
    - Key_003_resized_16x9.png  (16:9 wide — web banner)
    - Key_003_resized_9x16.png  (9:16 tall — mobile loading screen)

Project complete. All assets in:
  H:\Shared drives\Content Management - AI\Production_AI 2\Asset_Creation_Suite\{GameID}_{username}\

To audit final delivery: `/slot-step-08`
To start a new game: `/slot-step-00` or `/slot-step-01`

Type `/slot-` to see the full numbered workflow.
```

## Hard rules

- **Either backend works.** fal.ai is preferred (single API call to a
  purpose-built endpoint). Gemini fallback runs locally — one Gemini call
  per target plus a pngjs center-crop. Both produce pixel-perfect output.
- Hard fail cleanly only if BOTH `FAL_KEY` and `GEMINI_API_KEY` are missing.
- **Source preserved.** Original asset stays untouched; resizes are new files.
- **Per-aspect inline review.** Check each variant individually.

## References

- `shared/project_memory.md`, `shared/asset_naming.md`
- `shared/nb2_prompting.md` §9.6 (edit/recompose operations)
- nb2-mcp-server `nb2_smart_resize` tool definition
