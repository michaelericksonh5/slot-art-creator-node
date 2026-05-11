# Bezel / Reel Frame Template

The bezel (reel frame) sits between the background and the symbol grid.
Its job is to frame the reels, not steal attention. **Reel is always the
hero.** Default thickness is `thin`. Only go ornate when the brief
explicitly calls for it.

## Surface rules

- **Background:** flat solid black (it's a transparent overlay; the BG sits behind it in production)
- **Center:** transparent or semi-transparent so the reels show through
- **Outer border weight:** matches the interior grid divider lines
- **Aspect ratio:** match game orientation (`9:16` portrait or `16:9` landscape) — passed via API arg, not prompt body
- **Grid:** state `<cols>×<rows>` from `brief.grid` — omitting causes NB2 to guess

## Thickness vocabulary

| Level | Exact phrase to use in prompt |
|---|---|
| `ultra-thin` | `"outer border the same width as the interior divider lines — a razor-thin stone strip"` |
| `thin` (default) | `"outer frame slightly heavier than the interior lines but still narrow — not ornate"` |
| `moderate` | `"frame about a third of a symbol cell's height"` |
| `ornate` | `"thick sculptural frame with dimensional relief elements"` |

## Prompt — bezel, ultra-thin / thin (default)

```
A <cols>×<rows> <theme_summary>-themed slot reel frame floating on a
flat solid black background, <style_lock>,
outer stone border the same width as the interior grid lines —
ultra-thin, razor strip, not a thick frame,
one-pixel <palette_leads.primary>-tinted gold inner liner separating
the stone from the transparent black cell interiors,
matte stone surface, upper-left key light at 10 o'clock,
no glow, no chromatic aberration, no color fringing on the outer edge,
<cols> columns × <rows> rows of transparent black cells,
interior dividers matching the outer border width,
no symbols inside the cells, no text, no embellishment,
flat solid black outer background,
professional slot game art.
```

## Prompt — bezel with engraved theme motifs

Use when the brief calls for a bit of theme decoration without going ornate.

```
[Same as thin template but replace "no embellishment" with:]
shallow engraved <theme_summary> motifs on the corner blocks and
center top/bottom/side blocks only —
subtle relief carving, not painted, not brightly colored,
recessive against the stone surface.
```

## Pre-gen quick checks

- [ ] Grid dimensions stated as `<cols>×<rows>`
- [ ] "Reel is the hero" intent stated (the prompt should not describe a frame that dominates)
- [ ] Background is `flat solid black background, no gradients`
- [ ] No glow / no chromatic aberration / no color fringing stated
- [ ] No symbols / no text / no embellishment inside the cells

## Post-gen quick checks

- [ ] Center cells are transparent or near-transparent (reels would be visible)
- [ ] Frame doesn't dominate visually
- [ ] Grid divider lines match the outer border weight
- [ ] No accidental decorative elements inside the cells
- [ ] Light direction matches the symbol set's upper-left convention
