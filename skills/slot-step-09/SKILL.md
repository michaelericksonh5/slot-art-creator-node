---
name: slot-step-09
description: STEP 9 — Upscale approved slot art from 2K to 4K with NB2 using the proven Path-A workflow (vision model in the loop). NB2 has a strong bias toward regenerating rather than upscaling; this skill's prompt structure forces it into upscale mode by following the 6-part preservation template and reviewing the output against an 8-axis rubric, iterating on failure. Run after /slot-step-08 passes GREEN.
---

# Step 9 — NB2 Upscaler

Upscales approved 2K assets to 4K for production delivery. NB2 wants to
regenerate rather than preserve; this skill's preservation-first prompt
structure plus inline review forces it into upscale mode.

For multi-aspect-ratio variants of one source, use `/slot-step-10`
instead.

## Startup protocol

1. Resolve active project
2. Load `project.json`
3. Identify which approved assets to upscale. Common targets:
   - All approved symbols (HP/MP/LP/Wild/Scatter)
   - The locked key art (already at 4K — skip if so)
   - Approved backgrounds (often need 4K for marketing)
   - Approved logos

## Workflow

### Step 1 — Pick the source asset

The source is usually an approved file in the project folder. Common sources:
- `HP1_002.png` (the approved iteration of HP1)
- `BG_base_001.png`
- `Logo_hero_001.png`

**If the user pastes / attaches an external asset in chat** that they want
upscaled, that path lives in a temp location outside the allowed-roots
envelope — `nb2_upscale` will reject it. Stage it first:

```
nb2_stage_image({ source: "<chat-temp-path>", label: "user_upscale_source" })
  → ~/.h5g-slot-art-creator/inputs/user_upscale_source_NNN.png
```

Pass the staged path as `source` to `nb2_upscale` in Step 4. See
`shared/chat_image_staging.md` for full details.

### Step 2 — Build the 6-part preservation prompt

Use the template in `UPSCALE_TEMPLATE.md`. The structure is:

```
Upscale this image to 4K resolution. Preserve exactly:

1. SUBJECT — the exact same character/object/scene; same pose, same expression,
   same details, same composition
2. PALETTE — exact same colors; do not shift hue, saturation, or warmth
3. STYLE — exact same render style; do not change brushwork or finish
4. EDGES — preserve every visible edge; do not smooth, simplify, or add detail
5. BACKGROUND — exact same background; flat solid black/white preserved exactly
6. ASPECT RATIO — exact same proportions; do not crop or extend canvas

Output: a higher-resolution version of the input image with the same
visual content. Do NOT regenerate. Do NOT redesign. Do NOT add or remove
detail. Just increase resolution while preserving every visible element.
```

### Step 3 — Pre-generation validation (Gate 1)

- [ ] Source image path exists and is a real PNG
- [ ] All 6 preservation clauses present in the prompt
- [ ] No hex / resolution / aspect ratio strings in prompt body
- [ ] No instructions that contradict preservation (no "improve", "enhance", "add detail")

### Step 4 — Generate

NB2 is stochastic — the same source + prompt yields a slightly different
output each call. For routine upscales, one call is fine. For **hero
assets** (key art, logo, the game's signature symbol, anything going on
marketing surfaces), generate N variants in parallel and pick the best.

**Choosing N:**
- Routine symbol upscale (LP/MP, repeated set): `N=1`. Single call, retry
  on failure.
- Standard HP / banner upscale: `N=2`. Cheap insurance against a bad draw.
- Key art / logo / marquee asset: `N=3 or 4`. The cost of picking the
  best is small relative to the value of getting the hero right.

**How to run N>1:**

Issue N parallel `nb2_upscale` calls with the same `prompt` and `source`
but different `asset_name` suffixes:

```
nb2_upscale(asset_name="HP1_002_4K_v1", ...)
nb2_upscale(asset_name="HP1_002_4K_v2", ...)
nb2_upscale(asset_name="HP1_002_4K_v3", ...)
nb2_upscale(asset_name="HP1_002_4K_v4", ...)
```

Send them in a single tool batch (parallel MCP calls in one turn). Then
in Step 5, review all N outputs together against the 8-axis rubric and
pick the winner. Save the winner as the canonical `<source_basename>_4K`,
optionally archive the runner-ups (don't delete — they're decent fallbacks
if the winner has a subtle issue you catch later).

For a single-call run:

| API arg | Value |
|---|---|
| `prompt` | composed preservation prompt |
| `source` | absolute path to the approved source asset — resolve any relative filenames against `project_root` first |
| `image_size` | `"4K"` (always — that's the point of this skill) |
| `aspect_ratio` | omit; inherit from source |
| `output_dir` | `{project_root}` |
| `asset_name` | `"<source_basename>_4K"`, e.g. for source `HP1_002.png` pass `"HP1_002_4K"` (the MCP server appends `.png`) |

### Step 5 — Inline review (Gate 2) — 8-axis rubric

For **N=1**: read source and output, compare against the rubric below.

For **N>1**: read source and ALL N outputs, score each output against
the rubric, then declare the highest-scoring output the winner. Rename
the winner to drop the `_v<N>` suffix; keep the runners-up with their
versioned names. If two outputs tie, prefer the one closer to the
source's edge structure (most preservation, least redesign).

Compare each output to the source:

| Axis | PASS | FAIL action |
|---|---|---|
| Subject | Exact same character/scene | Strengthen "preserve exactly" + restate subject |
| Palette | Hue/saturation match | Add: "exact same colors, do not shift hue" |
| Style | Same render finish | Add: "preserve brushwork and rendering style exactly" |
| Edges | Every visible edge preserved | Add: "do not smooth or simplify edges" |
| Background | Flat solid match | Restate background spec |
| Aspect ratio | Identical proportions | Restate aspect preservation; check API arg inheritance |
| Detail | No new details added | Add: "do not invent or add detail" |
| Resolution | Output is meaningfully higher than source | If too close, retry with stronger size cue |

Any FAIL → patch prompt and regenerate. Cap at **3 attempts total per
asset** (initial call + up to 2 retries). After the third failure, stop
and report which axes NB2 was unable to preserve and what you tried — at
that point the source is likely the problem (too low-res, too ambiguous,
or stylistically incompatible with NB2's upscale mode). This matches the
"3 iterations max" rule in `REVIEW_RUBRIC.md` → "When to stop iterating".

### Step 6 — Update state

For each upscaled asset, set the `upscaled` field in the canonical asset
record. Examples:

```json
"assets.symbols.HP1.upscaled":     "HP1_002_4K.png"
"assets.backgrounds.base.upscaled": "BG_base_001_4K.png"
"assets.key.upscaled":              "Key_003_4K.png"
```

The `iterations` and `approved` fields are NOT touched. The 2K original
stays in place; the 4K version lives alongside as a sibling field.

Set `current_step: "upscale_in_progress"`, `next_step: "/slot-step-09"`
(continue) or `"/slot-step-10"` (move to delivery variants).

Schema follows the canonical asset record shape in `shared/project_memory.md`:
`{iterations, approved, upscaled, resized}`.

### Step 7 — Next step nudge

```
✓ Step 9 — Upscaled to 4K.
  Source : HP1_002.png
  Output : HP1_002_4K.png
  All 8 preservation axes passed ✓
  Folder: <project_root>
  Open:   file:///<project_root with / separators>

Next options:
  - Continue upscaling other approved assets with /slot-09 again
  - Run `/slot-step-10` for multi-aspect deliverables
  - Run `/slot-step-08` to confirm the upscale didn't break anything

Type `/slot-` to see the full numbered workflow.
```

## Hard rules

- **Preserve, don't regenerate.** Every output is a higher-res version of
  the source — no new detail, no style drift, no palette shift.
- **Original stays.** Never overwrite the 2K source.
- **Auto-iterate on failure.** 3 attempts max per asset (initial + 2 retries) — matches `REVIEW_RUBRIC.md`.

## References

- `shared/upscale_workflow.md` — Path-A explained (vision-LLM-in-the-loop,
  N-and-pick batches, forbidden-adjective list, identity-lock clause).
  This is the conceptual basis for this entire skill — read it once.
- `shared/chat_image_staging.md` — required when the source isn't already
  inside the active project folder
- `shared/qa_preflight.md`, `shared/project_memory.md`, `shared/asset_naming.md`
- `shared/nb2_prompting.md` §9.6 (edit/upscale operations)
- `UPSCALE_TEMPLATE.md` (6-part preservation prompt template)
- `REVIEW_RUBRIC.md` (8-axis pass/fail rubric)
