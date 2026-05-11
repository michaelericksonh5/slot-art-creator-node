# Nano Banana 2 (NB2) Prompting Playbook

NB2 = `gemini-3.1-flash-image-preview`. This is the production prompt
playbook every design skill in `slot-art-creator` follows.

---

## Model basics

- **Resolutions:** `"512"`, `"1K"`, `"2K"` (default), `"4K"`. `"0.5K"` is invalid.
- **Aspect ratios:** `"1:1"`, `"3:2"`, `"2:3"`, `"4:3"`, `"3:4"`, `"5:4"`,
  `"4:5"`, `"16:9"`, `"9:16"`, `"21:9"`, `"4:1"`, `"1:4"`, `"8:1"`, `"1:8"`,
  `"auto"`.
- **References:** up to ~10 object refs + ~4 character refs (14 total cap).
  Recommended ~10 for stability. Pass inline image bytes — do not extra-
  base64-encode.
- **Chat mode:** `aspect_ratio` and `image_size` are not supported after the
  first turn. The plugin always makes single-turn calls so dimensions take effect.
- **Prompt text vs tool args:** when `image_size`, `aspect_ratio`, or the output
  file type is supplied by the tool call, do not repeat those values in the
  creative prompt. Put only artistic, functional, and export-background
  instructions in prompt text.
- **Reasoning:** narrative scenes beat keyword lists. State context
  ("mobile slot, tiny thumbnail") explicitly.
- **No `negative_prompt` field.** Express negatives as positive constraints
  ("flat solid black, no gradients"; "no warm gold anywhere, not even trim").

---

## §9.2 Master prompt formula

```
[SUBJECT] + [TIER] + [temperature-matched palette] + [style]
+ [mobile constraints] + [quality tag block] + [semantic avoids]
```

### HP (character)

```
[character description], high-pay premium slot symbol, large and dominant,
warm crimson and deep gold palette, soft inner rim glow,
bold painterly slot game art slightly stylized, not photorealistic,
centered on flat solid black background no gradients,
clear silhouette at tiny thumbnail size, sharp clean edges,
high quality game asset, professional slot game art,
mobile-optimized icon, more valuable than all mid and low tier symbols.
```

### MP (themed object)

```
[object description], mid-pay slot symbol, one tier below the high-pay characters,
moderate warm-leaning palette, no glow—subtle highlight only,
[locked style phrase], stylized not photorealistic,
centered on flat solid white background no gradients, visible padding around subject,
clear silhouette, sharp clean edges, professional slot game art, mobile-optimized icon.
```

### LP (card royal)

```
The letter "A" as a low-pay slot symbol, small and understated with generous empty space,
cool muted palette—soft cyan and pale silver only, no warm gold or amber anywhere,
not even trim, flat vector game icon design, letter shape reads first,
theme decoration subtle and behind the letter,
centered on flat solid white background no gradients,
clear silhouette at tiny thumbnail size, sharp clean edges,
professional slot game art. Do not use the word detailed.
```

### LP (themed object)

```
[Small object] as a low-pay slot symbol, small and understated,
cool muted [theme] palette, no warm gold or amber, flat vector game icon design,
centered on flat solid white background no gradients, generous empty space,
clear silhouette, sharp clean edges. Do not use the word detailed.
```

### Wild

```
"WILD" label, special slot wild symbol, most readable text at reel cell size,
unique electric cyan lightning palette that breaks the theme,
barely contained fills frame edge to edge,
[locked style phrase],
centered on flat solid black background no gradients,
clear silhouette, sharp clean edges, professional slot game art.
```

### Scatter

```
"SCATTER" label, circular badge-shaped bonus symbol, warm luminous golden ticket,
radiant warm palette, [locked style phrase],
centered on flat solid black background no gradients,
clear silhouette, sharp clean edges, professional slot game art.
```

### Reel frame / bezel

**Thickness vocabulary — use exactly one per prompt. Default: `thin`.**

| Level | Prompt phrase |
|---|---|
| `ultra-thin` | "outer border the same width as the interior divider lines — a razor-thin stone strip" |
| `thin` | "outer frame slightly heavier than the interior lines but still narrow — not ornate" |
| `moderate` | "frame about a third of a symbol cell's height" |
| `ornate` | "thick sculptural frame with dimensional relief elements" |

**The single most important rule:** anchor the outer border weight to the interior
dividers. NB2 over-builds frames when given no anchor. Saying "same weight as the
grid lines" is the strongest constraint available.

**Ultra-thin / thin — no decoration:**

```
A <<cols>>×<<rows>> slot reel frame floating on a flat solid black background,
[outer stone border the same width as the interior grid lines — ultra-thin, razor strip, not a thick frame],
[one-pixel warm gold inner liner separating the stone from the transparent black cell interiors],
<theme_material> stone surface, matte and even, upper-left key light at 10 o'clock,
[no glow, no chromatic aberration, no color fringing on the outer edge],
[<<cols>> columns × <<rows>> rows of transparent black cells, interior dividers matching the outer border width],
no symbols inside the cells, no text, no decorative carving, no embellishment,
flat solid black outer background, professional slot game art.
```

**Thin — with shallow engraved theme motifs (corner and center blocks only):**

```
[Same as above but replace "no decorative carving, no embellishment" with:]
[shallow engraved <theme> motifs on the corner blocks and the center top/bottom/side blocks only —
subtle relief, not painted, not brightly colored, recessive against the stone]
```

**Grid dimension note:** always state `<<cols>>×<<rows>>` explicitly. Leaving
it out causes NB2 to guess — often landing on a 3×3 when you need 5×4.

### Background (9:16 portrait)

```
[Theme scene description], mobile slot game background, 9:16 portrait,
bottom third darkest for UI controls, center reel zone blurred and darkened,
upper-left key light at 10 o'clock, [warm/cool] atmospheric perspective,
no UI, no text, [locked style phrase], not photorealistic.
```

---

## §9.3 Quality tag block (reusable)

```
high quality game asset, sharp clean edges, professional slot game art,
mobile-optimized icon, clear silhouette at small size
```

---

## §9.4 Style library (pick one per game; lock it)

- `bold cartoon game art style`
- `stylized 2D mobile game illustration`
- `flat vector game icon design` (LP-leaning)
- `bold painterly slot game art, slightly stylized` (HP-leaning)
- `cel-shaded game art, bold outlines`
- `stylized semi-realistic slot game art`

Do **not** mix styles within a game. Keep the style phrase identical across
every prompt in the set.

---

## §9.5 Export-background policy

| Subject type | Export background |
|---|---|
| Light / warm / HP / gold subjects | **Black** |
| Dark subjects | **White** |
| Cool / LP / blue subjects | **White** |
| Neon / emissive / glow-heavy | **Black** |
| Default unspecified | **Black** |
| Full environment scenes | Exempt — use scene BG |

Always explicitly say "flat solid [black/white] background, no gradients" to
prevent textured mat generation.

---

## §9.6 Edit operations

- **In-place edit:** "keep everything identical, replace the character's hat
  with a golden crown".
- **Isolate from sheet:** pass sheet as reference, prompt for one element only
  on a clean background.
- **Recreate from ref:** "recreate this symbol in [new style/palette]".
- **Style transfer:** explicitly extract technique, palette, shading, outline
  policy, and lighting from reference, then apply to new subject.
- **UI reskin:** edit operation — **preserve exact layout and positions**,
  resurface only.
- **Component separation** (slot-specific):
  - Extract frame: prompt the frame/border, instruct "remove
    character/symbol, leave empty/transparent center".
  - Extract symbol: prompt the character/symbol, "on clean dark background,
    remove any frame or border elements".
  - Label runs clearly (`label="frame_only"`, `label="symbol_only"`).

---

## §9.7 Hard rules (never in any prompt)

- Raw percentages, pixel counts, or hex codes — translate to natural language.
- Internal GDD codenames — use the user-facing game theme.
- `gold` / `amber` / `warm` on LP symbols.
- `detailed` on LP prompts.
- "Wild that fits the theme" — wilds must **break** the category.
- Photorealism for base reel symbols.
- Same richness across tiers.
- Intricate backgrounds behind reels.
- Mixing LP types (cards + gems + fruit = broken set).
- White, busy reel backgrounds.

### Anti-pattern gallery

- `beautiful ornate golden card A` → LP masquerading as HP; gold forbidden on LP.
- `wild that fits the cute theme` → wild must **break** the theme.
- `intricately carved dragon letter A` → letter shape lost under decoration.
- `detailed painterly cherry LP` → "detailed" forbidden on LP; cherry should
  be flat and small.

---

## §9.8 Game Concept Brief fields

Before any production NB2 prompt is written, the game brief should declare:

- **Mood** — 1–2 words ("mystical serene", "aggressive electric").
- **Theme summary** — ≤2 sentences.
- **Style lock** — single phrase from §9.4.
- **Palette leads** — primary + accent (named colors, not hex).
- **Tier plan** — count per tier + LP family choice.
- **Wild category** — what it is (text label, object, character) and how it
  breaks the theme.

This brief is created once per game and read back into every design prompt.
The `slot-step-01` skill writes it to `game_brief.json` and the master `project.json`.

---

## After every generation call

These three steps apply after **every** `nb2_generate`, `nb2_edit`, or
`nb2_upscale` tool call, regardless of which skill triggered it.

### 1. Show thumbnails inline

Use the `Read` tool on each file path returned by the MCP server.
Claude Code renders image files inline — the user sees the result without
leaving the chat. Read every path, not just the first one.

```
# example — do this for each path in the result
Read("C:/Users/name/Pictures/claude_nb2/image_1.png")
```

### 2. State the save location clearly

Echo the full absolute path once, on its own line:

```
Saved to: C:\Users\name\Pictures\claude_nb2\image_1.png
```

Default output folder is `~/Pictures/claude_nb2` — on Windows this is
`C:\Users\<username>\Pictures\claude_nb2`, visible immediately in File
Explorer under Pictures. Always expand `~` to the full path when reporting.

### 3. One-sentence visual assessment

After showing the thumbnail, give one sentence: does it match the brief?
Call out any obvious mismatch (frame too thick, wrong tier color, grid
dimensions wrong) so the user knows whether to iterate before they look
at it closely themselves.
