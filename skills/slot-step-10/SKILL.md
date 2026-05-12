---
name: slot-step-10
description: STEP 10 (final) — Produce pixel-perfect multi-aspect variants of an approved asset (e.g., generate 1:1, 16:9, and 9:16 versions of a hero asset). Outputs are named `<source>_resize_<W>_<H>.png` showing the exact target dimensions, and they live in the same category folder as the source. Either Gemini or fal.ai works fully for this; when both keys are set the plugin routes to fal.ai's purpose-built nano-banana-pro endpoint (single API call) over Gemini's NB2 + center-crop path. For single-aspect upscale use /slot-step-09.
---

# Step 10 — Smart Resize (final delivery)

Generates multi-aspect-ratio variants from one source asset. Unlike a
crop, smart-resize **recomposes** the subject for each target — useful
for marketing crops, lobby thumbnails, ad variants.

## Backends — which one runs depends on which key is set

| Keys present | Backend | Underlying model | Notes |
|---|---|---|---|
| `FAL_KEY` (with or without Gemini) | fal.ai | **nano-banana-pro** (Nano Banana Pro) | Single API call, purpose-built endpoint. Preferred. |
| Only `GEMINI_API_KEY` | Gemini | **gemini-3.1-flash-image-preview** (NB2) | One Gemini call per target + pngjs center-crop locally. |
| Neither | error | — | Need at least one NB2 key. |

Both backends produce **pixel-perfect** output at the requested dimensions.
The recipe is the same idea — generate at the smallest preset that fully
covers the target, then center-crop to the exact W×H — but the fal.ai
version does it as one server-side call, while the Gemini version does
it client-side in Node (using pngjs for the crop, no native deps).

> [!NOTE]
> A gpt-image-2-based smart-resize tool was prototyped in earlier versions
> but not shipped — we couldn't verify the output quality matched fal.ai's
> well-tested path, so it didn't meet the "we only ship skills that work"
> bar. For multi-aspect resize of text-heavy sources (paytables, logos),
> the current recommendation is: if fal.ai's NB Pro garbles the text on a
> specific asset, regenerate that asset directly at each target aspect ratio
> via `gpt2_generate` with explicit text instructions. Not as convenient as
> a one-call smart-resize, but reliable.

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
| `source` | absolute path to the source asset — resolve `style_anchor.key_art_path` (or whichever asset relative path) against `project_root` first (`path.join(project_root, stored)`) |
| `target_sizes` | array of `"WxH"` strings — explicit pixel dimensions for each target, e.g. `["2048x2048", "3840x2160", "2160x3840"]` for a marketing trio. The MCP tool encodes both aspect and resolution into the output filename. |
| `output_dir` | **the source's category folder** — `path.dirname(absolute_source_path)`. Resized variants live next to their source so `Key_Art/Key_Art_003.png` and `Key_Art/Key_Art_003_resize_2048_2048.png` sit side by side. |

The MCP tool returns one output file per target. Default naming follows
`{source_basename}_resize_<W>_<H>.png` where `<W>_<H>` is the exact
target dimensions — e.g. for source `Key_Art_003.png` with target
`"2048x2048"` the output is `Key_Art_003_resize_2048_2048.png`. The
older `_resized_<aspect>` suffix (e.g. `_resized_16x9`) is **retired** —
new generations always carry exact pixel dimensions so a designer can
read the size off the filename without opening the file.

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
`{aspect, dimensions, path}` entries. Paths are project-relative
including the subfolder. Examples:

```json
"assets.key.resized": [
  {"aspect": "1:1",  "dimensions": "2048x2048", "path": "Key_Art/Key_Art_003_resize_2048_2048.png"},
  {"aspect": "16:9", "dimensions": "3840x2160", "path": "Key_Art/Key_Art_003_resize_3840_2160.png"}
]
"assets.backgrounds.base.resized": [
  {"aspect": "16:9", "dimensions": "3840x2160", "path": "Backgrounds/BG_base_001_resize_3840_2160.png"}
]
```

Set `current_step: "delivery_complete"`, `next_step: null` (project done)
or `"/slot-step-08"` to re-audit the final delivery.

Schema follows the canonical asset record shape.

### Step 7 — Next step nudge

```
✓ Step 10 — Smart Resize complete.
  Source : Key_Art/Key_Art_003.png
  Folder : <project_root>/Key_Art/
  Open   : file:///<project_root>/Key_Art/
  Variants:
    - Key_Art/Key_Art_003_resize_2048_2048.png   (1:1 square — lobby tile)
    - Key_Art/Key_Art_003_resize_3840_2160.png   (16:9 wide — web banner)
    - Key_Art/Key_Art_003_resize_2160_3840.png   (9:16 tall — mobile loading screen)

Project complete. All assets organized by category under:
  <project_root>/

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
