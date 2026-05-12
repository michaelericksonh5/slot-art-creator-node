---
name: slot-compare
description: Side-by-side model comparison — generate the same slot art asset with both NB2 (Gemini/fal.ai) and gpt-image-2 (OpenAI) from an identical prompt, then evaluate the outputs against each other. Use this whenever you want to pick the better model for a specific art style, symbol type, or UI surface, or when you're unsure whether to use nb2_generate vs gpt2_generate for a task. Triggers on phrases like "compare models", "which is better NB2 or GPT", "show me both", "test both providers", "nb2 vs gpt2", or "which model should I use for X".
---

# slot-compare — NB2 vs gpt-image-2 Side-by-Side

Generates the same asset with both model families and gives you a concrete
basis for choosing the right tool for your game's specific style.

**When this is useful:**
- You're unsure whether NB2 or gpt-image-2 will handle your style better
- A new symbol type or UI surface hasn't been benchmarked for this theme
- You want to verify that gpt-image-2's text fidelity is worth the cost
  for a specific asset class
- A model is producing unexpected output and you want to see if the other
  handles it better

**Requires both `GEMINI_API_KEY` (or `FAL_KEY`) AND `OPENAI_API_KEY`.**
If only one provider is configured, run `/slot-setup` first. You can still
run a one-sided compare if you only need to test prompts against one model —
just say so.

---

## Startup protocol

1. Resolve the active project (or ask for GameID)
2. Load `project.json` — read `style_anchor` and `brief`
3. Read `style_anchor.key_art_path` — used as a reference image
4. Confirm both keys are available:
   - NB2: `GEMINI_API_KEY` or `FAL_KEY` (or both)
   - gpt-image-2: `OPENAI_API_KEY`
   If a key is missing, note which models are unavailable and proceed
   with the available one(s)

---

## Workflow

### Step 1 — Get the subject

Ask the user what they want to compare. Be flexible — they might give:
- A symbol type: "compare HP1 — a golden phoenix"
- A surface: "compare paytable background"
- A concept: "compare a stylized gem stone"
- An existing prompt: they paste the prompt directly

If the user didn't specify a brief/style (session is not attached to a
project), ask for: (a) subject, (b) style description, (c) color palette.
Otherwise pull these from `project.json`.

### Step 2 — Build the shared prompt

Build ONE prompt that will be sent to both models. This is critical for a
fair comparison — both models must get identical inputs.

For symbol comparisons, use the bracketed-block format from
`shared/nb2_prompting.md` §9.2.3:

```
[RENDER STYLE]
<style_lock>, professional mobile slot game art, stylized illustration

[SUBJECT INSIDE]
<subject description>

[ANATOMY LOCK]
<any specific proportions or details to preserve>

[MOBILE CONSTRAINTS]
Must be readable as a 64px silhouette. No micro-textures. Bold clean shapes.
High contrast foreground against background. No gradients on flat surfaces.
```

For UI / background comparisons, use a structured prose prompt (same
format as in `PROMPT_TEMPLATES.md` for that surface type).

**Prepend `style_anchor` verbatim** if one is set in `project.json`.

Show the final prompt to the user and confirm before generating.

### Step 3 — Generate both in parallel

Issue both calls in a **single turn** (parallel MCP calls):

**NB2 call:**
```
nb2_generate({
  prompt: <shared_prompt>,
  aspect_ratio: "1:1",        // or whatever matches the subject
  image_size: "2K",
  output_dir: {project_root},
  asset_name: "<subject_slug>_nb2"
})
```

**gpt-image-2 call:**
```
gpt2_generate({
  prompt: <shared_prompt>,
  image_size: "2K",           // always specify — default is 1K
  output_dir: {project_root},
  asset_name: "<subject_slug>_gpt2"
})
```

Both outputs land in the same project folder.

### Step 4 — Evaluate side-by-side

Read both output images. Score each on the axes below. Use your vision
to compare — don't just describe; judge.

| Axis | What to look at |
|---|---|
| **Identity / subject accuracy** | Does the output show the correct subject? Are key features present? |
| **Style match** | How well does it match the `style_lock`? (stylized 3D, flat vector, painterly, etc.) |
| **Text fidelity** | If the prompt contained any text/labels: which rendered them legibly? |
| **Palette accuracy** | How well does it match the named palette from the brief? |
| **Mobile readability** | Is the subject readable as a silhouette at thumbnail size? Bold enough? |
| **Detail quality** | Appropriate detail level — not too busy, not too sparse |
| **Prompt adherence** | Did it follow every constraint in the prompt? Flag specific misses. |
| **Artifacts / quality** | Any distortion, scrambled elements, soft edges, color banding? |

### Step 5 — Report

Present the comparison as a table:

```
SUBJECT: <subject>
PROMPT: (truncated to first 60 chars) "..."

                    NB2              gpt-image-2
─────────────────────────────────────────────────────
Identity          : PASS / FAIL     PASS / FAIL
Style match       : PASS / FAIL     PASS / FAIL
Text fidelity     : N/A / PASS/FAIL N/A / PASS/FAIL
Palette accuracy  : PASS / FAIL     PASS / FAIL
Mobile readability: PASS / FAIL     PASS / FAIL
Detail quality    : PASS / FAIL     PASS / FAIL
Prompt adherence  : PASS / FAIL     PASS / FAIL
Artifacts         : none / minor/serious

WINNER: NB2 | gpt-image-2 | TIE
REASON: one sentence

FILES:
  NB2       : <absolute path>
  gpt-image-2 : <absolute path>
```

For ties or close calls, give a recommendation for when to use each:
"NB2 for visual style; gpt-image-2 if this surface needs legible text."

### Step 6 — Save comparison record (optional)

If the user wants to keep the comparison for reference, append to
`project.json.comparisons`:

```json
{
  "subject": "<subject_slug>",
  "prompt_hash": "<first 40 chars of prompt>",
  "nb2_path": "<absolute path>",
  "gpt2_path": "<absolute path>",
  "winner": "nb2 | gpt2 | tie",
  "reason": "<one sentence>",
  "compared_at": "<ISO timestamp>"
}
```

---

## Quick compare (no project context)

If there's no active project and the user just wants a quick test:

Ask for: subject, style, palette. Build a minimal prompt with these three
inputs. Generate and compare as above. Don't write to any project state.

---

## Cost note

This skill makes two API calls per comparison. gpt-image-2 at 2K is
significantly more expensive than NB2. For large batch comparisons,
consider comparing one representative asset per surface type rather
than every symbol.

---

## Hard rules

- **Same prompt to both models** — never adjust the prompt per-model.
  The point is an apples-to-apples comparison.
- **Both calls in parallel** — don't run them sequentially. Issue both
  in one turn.
- **Always specify `image_size: "2K"` for gpt2_generate** — 1K is the
  default and makes gpt-image-2 look worse than it is.
- **Never declare a winner without looking at both images** — read both
  outputs with the vision tool before scoring.

---

## References

- `shared/nb2_prompting.md` (NB2 prompting guide, §9.2 bracketed format)
- `shared/gpt_image2_prompting.md` (when to choose gpt-image-2)
- `shared/project_memory.md` (state schema)
