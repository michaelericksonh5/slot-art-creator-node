# Wild Symbol Template

The wild is the most distinctive symbol in the set. Its job is to be
**immediately recognizable as different**. It must break the theme in
TWO ways: a different category from the rest of the set, AND a unique
color that doesn't appear elsewhere in the palette.

## Tier rules

- **Background:** flat solid black, no gradients
- **Category break:** if the rest of the set is characters, the wild is text or an object. If the rest is objects, the wild is text. Never the same category.
- **Color break:** wild's primary color does NOT appear in `brief.palette_leads.primary` or `.accents`
- **Size phrase:** "barely contained fills frame edge to edge, large and dominant"
- **Text policy:** the word "WILD" itself is allowed (and common) as part of or all of the symbol

## Prompt — Wild

```
"WILD" label, special slot wild symbol,
most readable text at reel cell size,
<wild.category> rendered as <visual_treatment>,
unique <wild.breaks_theme_via> palette that breaks the theme completely,
barely contained — fills frame edge to edge,
<style_lock>,
centered on flat solid black background no gradients,
clear silhouette, sharp clean edges, professional slot game art,
only one symbol in the frame.
```

Substitution guide:
- `<wild.category>` — pull from `brief.wild.category` (e.g., `"WILD text label"`, `"lightning bolt object"`, `"character"`)
- `<wild.breaks_theme_via>` — pull from `brief.wild.breaks_theme_via` (e.g., `"electric cyan rim light"`, `"molten silver"`)
- `<visual_treatment>` — describe how the wild is rendered (e.g., `"molten gold calligraphy with cyan rim light"`, `"chrome with glitch noise"`)

## Pre-gen quick checks

- [ ] Wild's category is DIFFERENT from the rest of the set
- [ ] Wild's primary color does NOT appear in `palette_leads.primary` or `.accents`
- [ ] "Barely contained" or similar fill phrase is in the prompt
- [ ] Background is `flat solid black background, no gradients`

## Post-gen quick checks

- [ ] Wild reads as visibly different from every other symbol in the set
- [ ] Wild's color is unique to the wild (doesn't appear in any HP/MP/LP)
- [ ] Wild fills the frame to its edges (not floating in empty space)
- [ ] If the wild is text, the text is the dominant element

## Common failure modes

- **Wild matches the theme** — must regenerate with stronger break instruction
- **Wild's color is in the palette** — must regenerate with explicit "use a color that doesn't appear in the rest of the set" instruction
- **Wild is too small** — restate "barely contained, fills frame edge to edge"
