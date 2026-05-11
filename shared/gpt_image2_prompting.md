# GPT Image 2 (gpt-image-2) — Prompting Playbook

OpenAI's gpt-image-2 is a separate model from Nano Banana 2. The plugin exposes
it through two tools — `gpt2_generate` and `gpt2_edit` — that bypass the
NB2 routing entirely and call OpenAI directly. This doc explains when to
reach for gpt-image-2 over NB2 and how to prompt it well.

Released by OpenAI on 2026-04-21 (model snapshot `gpt-image-2-2026-04-21`),
gpt-image-2 introduces O-series reasoning to image generation — it
proactively researches, plans, and reasons about image structure before
generating. Source: [OpenAI GPT Image 2 docs](https://developers.openai.com/api/docs/models/gpt-image-2).

## Contents

- **When to pick gpt-image-2 over NB2** — the decision matrix
- **Strengths** — what gpt-image-2 does better than NB2
- **Weaknesses** — where NB2 is still the right call
- **Cost** — gpt-image-2 is more expensive; budget guidance
- **Size mapping** — how `image_size` / `aspect_ratio` translate to gpt-image-2's literal sizes
- **Quality parameter** — `low` / `medium` / `high` / `auto`
- **Prompting style** — what works (and what's different from NB2)
- **Compositional editing** — `gpt2_edit` can take multiple reference images
- **What to put in the slot-art workflow** — per-skill recommendations

---

## When to pick gpt-image-2 over NB2

| If the asset needs... | Use | Why |
|---|---|---|
| **Accurate text in the image** (paytable labels, multipliers, banner copy, logo wordmarks with specific spellings, button labels) | `gpt2_generate` / `gpt2_edit` | gpt-image-2 substantially outperforms NB2 at rendering text correctly. NB2 frequently hallucinates letters even when prompted explicitly. |
| **Photorealistic stable 2K** (marketing key art, hero shots that need to look like a render rather than a stylized illustration) | `gpt2_generate` (size `2K`, quality `high`) | gpt-image-2's photorealistic output at 2K is its sweet spot. 2K (2048×2048 or 2048×1152 etc.) is the STABLE native ceiling. |
| **Compositional editing with 2-16 reference images** ("take this character, this prop, and this background and combine them with these specific spatial relationships") | `gpt2_edit` with `extra_references` | gpt-image-2's edit endpoint accepts an array of source images and composes them. NB2 doesn't have this capability natively. |
| **Reasoning about a complex brief** ("a paytable with 8 rows where each row shows symbol_X paying out at value_Y, formatted as a numbered grid with consistent column alignment") | `gpt2_generate` (quality `high`) | gpt-image-2 plans before generating. Briefs that explicitly describe structure / counts / alignment are where it pulls ahead. |
| **Multi-aspect recompose where the source has TEXT** (resize a paytable / logo / banner-with-copy to 1:1 + 16:9 + 9:16) | `gpt2_smart_resize` | Same recompose-per-aspect pattern as the Gemini fallback in `nb2_smart_resize`, but preserves text far better. Cost scales linearly with target count — issues one edit call per size. |
| **Multi-aspect recompose for non-text sources** (resize a character symbol or background scene to multiple aspects) | `nb2_smart_resize` (fal.ai NB Pro) | fal.ai's smart-resize is purpose-built and single-call; gpt-image-2's recompose is N-call. For routine non-text resize, fal.ai wins on cost and speed. |
| **Routine slot symbols at thumbnail size** | `nb2_generate` | gpt-image-2 is overkill (and 5-10× more expensive). NB2 is purpose-tuned for stylized slot art. |
| **TRUE upscaling — preserving an approved 2K source's pixels at 4K** | `nb2_upscale` with N=4 picking | **gpt-image-2 has no faithful upscale mode.** It always regenerates at the target size, not super-resolution. The same prompt + source passed to `gpt2_generate` at 4K just makes a new image, not an upscaled version of the source. |
| **Genuine 4K photorealistic output** | Generate at 2K with `gpt2_generate`, then run an external upscaler (Topaz, Real-ESRGAN) | OpenAI's own docs recommend this. gpt-image-2's 4K targets are experimental and unreliable for production. |

---

## Strengths

1. **Text rendering.** The single biggest practical difference. If the brief
   mentions specific words that need to appear in the image, gpt-image-2 is
   the safer bet — by a wide margin.

2. **Native 2K output.** gpt-image-2's STABLE production ceiling is 2K
   (2048×2048 or its aspect variants). 4K targets (3840×2160 / 2160×3840)
   are accepted by the API but flagged EXPERIMENTAL by OpenAI — they may
   fail or produce inconsistent results. For genuinely high-res output,
   either generate at 2K and pass through an external upscaler (Topaz,
   Real-ESRGAN), or use NB2's `nb2_upscale` on an approved 2K source.

3. **Multi-image composition.** Pass up to ~16 reference images to
   `gpt2_edit` and gpt-image-2 will compose them as instructed by the prompt.
   Useful for slot-art workflows when you want to combine a character pose
   + a prop + a background lit consistently.

4. **Agentic planning.** Briefs that describe structure ("a 5×3 grid of...",
   "labeled columns A through H", "three tiers from smallest to largest")
   are interpreted more reliably than with NB2, which is more of a stylized
   illustrator and less of a structural compositor.

---

## Weaknesses

1. **Cost.** gpt-image-2 is meaningfully more expensive per image than NB2,
   especially at `quality: high` and 4K resolutions. Don't use it for routine
   symbol generation where NB2 produces equivalent results.

2. **Style isn't slot-art-tuned.** NB2 (especially via fal.ai's preset) has
   default behavior that lands closer to mobile-slot-art aesthetics out of
   the box. gpt-image-2 needs more explicit style direction in the prompt.

3. **No native upscale mode.** gpt-image-2 never preserves source pixels at
   a higher resolution — it always regenerates at the target size. Passing
   a 1K source to gpt2_edit with size=4K just generates a new 4K image
   based on the source, not an upscale. For true upscale-of-an-approved-
   asset, use `nb2_upscale`.

4. **Smart-resize is N parallel calls.** We expose `gpt2_smart_resize` for
   multi-aspect recomposition, but it issues one edit call per target size
   (same pattern as the Gemini fallback in `nb2_smart_resize`). Cost scales
   linearly with target count. fal.ai's purpose-built smart-resize endpoint
   handles all targets in a single API call — for non-text sources, that's
   the better choice. Reach for `gpt2_smart_resize` when source text must
   stay legible across the resize.

5. **Output is base64 in the API response.** Not visible while generating
   (no progress URL like NB2). Slightly slower wall-time for the user.

---

## Cost — rule of thumb

- A `gpt2_generate` call at `quality: high` and `size: "2048x2048"` is roughly
  comparable to **5-10× a single NB2 generation** in raw API cost. Exact
  pricing changes; check OpenAI's pricing page.
- A `gpt2_edit` call with N reference images costs more than `gpt2_generate`
  because of the input-image tokenization on top of the output cost.
- The plugin defaults to `quality: "high"` for hero usage. Drop to `"medium"`
  for iteration / drafting; `"low"` for thumbnail tests.

For a typical slot game, the bill stays sensible if you use gpt-image-2
selectively (logo, key art, paytable, win banners, lobby tile) and NB2
for the rest (all reel symbols, backgrounds, bezel, HUD chrome).

---

## Size mapping

The plugin uses an abstract `image_size` (`1K` / `2K` / `4K`) + `aspect_ratio`
combo across all tools. For gpt-image-2 those translate to literal pixel sizes:

| `image_size` | `aspect_ratio` | gpt-image-2 literal size | Stability |
|---|---|---|---|
| `1K` | `1:1` | `1024x1024` | ✓ Stable |
| `1K` | `16:9` or `3:2` | `1536x1024` | ✓ Stable |
| `1K` | `9:16` or `2:3` | `1024x1536` | ✓ Stable |
| `2K` (default) | `1:1` (default) | `2048x2048` | ✓ **Stable native ceiling** |
| `2K` | `16:9` or `3:2` | `2048x1152` | ✓ Stable |
| `2K` | `9:16` or `2:3` | `1152x2048` | ✓ Stable |
| `4K` | `1:1` | `2048x2048` (capped at 2K square; 4K square isn't a thing) | ✓ Stable |
| `4K` | `16:9` or `3:2` | `3840x2160` | ⚠️ **EXPERIMENTAL** — may fail |
| `4K` | `9:16` or `2:3` | `2160x3840` | ⚠️ **EXPERIMENTAL** — may fail |
| any | `auto` | model picks | ✓ |

**Stability ceiling.** gpt-image-2's reliable production output is 2K
(2048×2048 or aspect variants). The 4K-tier sizes are accepted by the
API but OpenAI flags anything beyond ~2560×1440 as experimental —
stability and consistency decrease. For production deliverables that
need genuine 4K, either:

- Generate at 2K with `gpt2_generate`, then run an external upscaler
  (Topaz, Real-ESRGAN) — OpenAI's own docs recommend this path
- Use `nb2_upscale` on an approved 2K source (faithful pixel-preserving
  upscale via NB2's preservation prompt + Path-A vision-loop review)

gpt-image-2 constraints (enforced by the API):
- Max edge ≤ 3840 px
- Both edges multiples of 16
- Aspect ratio ≤ 3:1
- Total pixels between 655,360 and 8,294,400

Sizes outside the table above get snapped to the closest supported size.

---

## Quality parameter

| Value | Use when |
|---|---|
| `low` | Quick iteration on a draft; cost-conscious early-phase exploration |
| `medium` | Standard iteration; "is this idea right?" |
| `high` (default) | Final asset generation; what you actually keep |
| `auto` | Let gpt-image-2 pick based on prompt complexity. Reasonable default for general use. |

Higher quality is slower AND more expensive. The plugin defaults to `"high"`
because the typical use case is hero-asset generation, not bulk iteration.
If you're prototyping, pass `quality: "medium"` explicitly.

---

## Prompting style

gpt-image-2 prompts can be more **prose-like** than NB2 prompts. The
bracketed-block format that works well for NB2 (`[RENDER STYLE — LOCKED]`,
`[PLAQUE SHAPE]`, etc.) is fine but not required — gpt-image-2 parses
natural language well.

What works:

- **Describe structure explicitly.** "A 9-row paytable with the highest-paying
  symbol at the top, each row showing a symbol icon on the left and a
  multiplier value on the right, all labels in a clean sans-serif typeface,
  consistent column alignment." gpt-image-2 plans before generating; the
  structure description guides the plan.

- **State the text exactly.** If the image needs the word "BIG WIN", write
  `the words "BIG WIN" centered at the top`. Quoted text gets rendered
  more faithfully than paraphrased text.

- **Lock the style up front.** Same as NB2 — start with a style lock
  sentence ("Painted CG, soft volumetric lighting, mobile slot game art,
  not photorealistic") so the model commits early.

- **Negatives as positive constraints.** Like NB2, gpt-image-2 doesn't
  have a `negative_prompt` field. Phrase avoids as positive instructions:
  "Flat solid black background, no gradients, no patterns."

What's different from NB2:

- **Less keyword-tag style; more sentence style.** NB2 responds well to
  comma-separated tag lists. gpt-image-2 reads more like a brief.

- **Reference images live as files, not URLs.** The Node SDK takes binary
  uploads via `OpenAI.toFile()`. The plugin handles this automatically —
  pass paths or URLs to `extra_references` like the other edit tools.

- **No persistent style anchor mechanism.** NB2 has the project-wide
  `style_anchor` block prepended to every prompt. gpt-image-2 calls are
  one-shot. Either inline the style anchor in each `gpt2_*` prompt, or
  use `gpt2_edit` with the locked key art as a reference image to lock
  style continuity.

---

## Compositional editing — gpt2_edit with extra_references

This is the most distinctive capability. Example use cases:

- **"Put HP1's character in HP2's plaque"**: pass HP1 as `source` and HP2
  as `extra_references[0]` with a prompt like "Compose: place the character
  from the first image into the plaque from the second image, matching
  the lighting and material of the second image."

- **"Build a paytable from approved symbols"**: pass each approved symbol
  as an `extra_references[]` entry plus a prompt describing the layout
  ("8-row paytable, this symbol pays X, this symbol pays Y, ..."). gpt-image-2
  composites them into a single paytable surface with accurate text.

- **"Composite a banner from approved hero + theme props"**: pass the hero
  + 2-3 prop references plus a prompt with the win-banner structure
  (vignette, sunburst rays, tier label) and gpt-image-2 composes the whole
  surface.

The plugin's `nb2_stage_image` tool works for `gpt2_edit` sources too —
chat-pasted images can be staged then passed as either `source` or
`extra_references`.

---

## Per-skill recommendations

| Skill | NB2 vs gpt-image-2 |
|---|---|
| `/slot-step-02` (key art) | NB2 is default. Consider `gpt2_generate` at **2K** (the stable ceiling) when the brief needs accurate text in the key art or photorealism. For 4K marketing output, generate at 2K with gpt2 then run `nb2_upscale`. |
| `/slot-step-03` (symbols) | NB2 is default. gpt-image-2 only for hero symbols where text matters (rare). |
| `/slot-step-04` (contact sheet, IDEATION mode) | NB2 for early ideation. `gpt2_generate` if the sheet needs labeled symbols. |
| `/slot-step-05` (backgrounds) | NB2. gpt-image-2 doesn't materially win here. |
| `/slot-step-06/PAYTABLE_TEMPLATE.md` | **gpt2_generate is the right call.** Paytables are text-heavy with structural constraints — exactly gpt-image-2's strength. Use `2K`, not 4K (the 4K targets are experimental). |
| `/slot-step-06/BANNERS_TEMPLATE.md` | NB2 for the banner art; `gpt2_edit` if you need the tier label rendered as part of the image (rare — usually composited at runtime). |
| `/slot-step-06/LOGO_TEMPLATE.md` | **gpt2_generate is the right call** if the logo has a specific wordmark spelling. NB2 frequently misspells. Generate at 2K. |
| `/slot-step-06/HUD_TEMPLATE.md` | NB2 for chrome; `gpt2_generate` for any HUD element with required copy. |
| `/slot-step-07` (UI reskin) | `gpt2_edit` is preferable if the source UI has lots of text. Otherwise NB2. |
| `/slot-step-08` (audit) | N/A — no generation in this step. |
| `/slot-step-09` (upscale) | **NB2 always.** gpt-image-2 has no faithful upscale mode (always regenerates rather than preserving source pixels). |
| `/slot-step-10` (multi-aspect) | NB2 by default — fal.ai's purpose-built smart-resize is the cheapest, fastest, single-call path. **Switch to `gpt2_smart_resize` when the source has text** that must remain readable across the resize (paytables, logos, banners with copy). |

Cross-reference: `shared/nb2_prompting.md` for the NB2 playbook,
`shared/chat_image_staging.md` for handling chat-pasted images
end-to-end across either model.
