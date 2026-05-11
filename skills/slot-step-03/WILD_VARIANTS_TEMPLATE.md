# Wild Variants Template

The basic wild template (`WILD_TEMPLATE.md`) covers the standard
substitute-for-anything wild. Most modern slots ship **multiple wild
variants** with different mechanics — each gets its own ID (`WD1`,
`WD2`, `WD3`) and its own visual treatment.

This template covers nine common variants. Read the section that
matches the variant in the brief. The base wild rules from
`WILD_TEMPLATE.md` (theme break + color break + barely-contained sizing)
apply to ALL variants.

## Universal rules (apply to every variant)

- **Background:** flat solid black, no gradients
- **Theme break:** different category from the rest of the set
- **Color break:** primary color does NOT appear in `palette_leads`
- **Distinctness:** each variant must be visually distinguishable from
  every other wild variant in the same game
- **Currency:** the word "WILD" is allowed and common as part of the symbol

---

## Sticky Wild

Locks in place for N spins. Visual cue: a **chain, pin, or lock motif**
overlaid on the wild design.

```
"WILD" label, special slot wild symbol — sticky variant,
locked in place with chains or a pinned anchor element overlaid,
<wild.breaks_theme_via> palette breaking the theme,
barely contained — fills frame edge to edge,
<style_lock>,
centered on flat solid black background no gradients,
clear silhouette, sharp clean edges, professional slot game art,
only one symbol in the frame.
```

Additional pre-gen check:
- [ ] Lock / chain / pin element is described and visually integrated

---

## Stacked Wild

Renders as a **vertical stack** covering the full reel column. Even when
generated as a single cell, the art should hint at the stacked context
with an aspect ratio that reads as elongated.

```
"WILD" label, special slot wild symbol — stacked variant,
elongated vertical treatment suggesting a multi-cell stack,
<wild.breaks_theme_via> palette,
barely contained, fills frame top to bottom edge,
<style_lock>,
centered on flat solid black background no gradients,
sharp clean edges, professional slot game art.
```

Generate with `aspect_ratio: "1:1"` for the manifest cell. The runtime
composites the stacked appearance.

---

## Expanding Wild

Grows to fill the full reel after landing. Visual cue: **expansion rays
or a pulse motif** suggesting outward growth.

```
"WILD" label, special slot wild symbol — expanding variant,
expansion rays radiating outward from the central wild element,
<wild.breaks_theme_via> palette,
barely contained — fills frame edge to edge,
<style_lock>,
centered on flat solid black background no gradients,
sharp clean edges, professional slot game art.
```

---

## Walking Wild / Wild Train

Moves one position per spin (also called "Wild Train" or snake wild).
Visual cue: a **directional arrow or motion blur trail**.

```
"WILD" label, special slot wild symbol — walking variant,
directional motion treatment with trailing motion blur or arrow indicators
suggesting forward movement,
<wild.breaks_theme_via> palette,
barely contained — fills frame edge to edge,
<style_lock>,
centered on flat solid black background no gradients,
sharp clean edges, professional slot game art.
```

For the "Wild Train" snake variant, the symbol may be themed as
**linked carriages** rather than a single wild — check the brief.

---

## Respin Wild

Triggers a respin when it lands. Visual cue: a **refresh / circular-arrow
loop motif**.

```
"WILD" label, special slot wild symbol — respin variant,
circular refresh arrow loop integrated into the wild treatment,
<wild.breaks_theme_via> palette,
barely contained — fills frame edge to edge,
<style_lock>,
centered on flat solid black background no gradients,
sharp clean edges, professional slot game art.
```

---

## Transforming Wild

Converts low-pays to high-pays. Visual cue: **morph / particle dissolve**
suggesting transformation in motion.

```
"WILD" label, special slot wild symbol — transforming variant,
particle dissolve or morphing energy treatment around the wild element
suggesting transformation in motion,
<wild.breaks_theme_via> palette,
barely contained — fills frame edge to edge,
<style_lock>,
centered on flat solid black background no gradients,
sharp clean edges, professional slot game art.
```

---

## Multiplier Wild

Multiplies the win it's part of (×2, ×3, ×5 …). The numeric multiplier
is the dominant element — even more prominent than the WILD label.

```
"×<value>" multiplier with smaller "WILD" subtitle, special slot wild symbol,
multiplier number as the dominant focal element in metallic gold or
<wild.breaks_theme_via> palette,
barely contained — fills frame edge to edge,
<style_lock>,
centered on flat solid black background no gradients,
sharp clean edges, professional slot game art.
```

Substitute `<value>` from the brief (typically 2, 3, 5, or 10).

Additional pre-gen check:
- [ ] Multiplier number is the dominant focal element
- [ ] Value matches the brief

---

---

## Duplicating Wild

Replicates itself into adjacent positions when it lands (Green Machine
Blitz mechanic). Visual cue: **mirror / clone aura** around the wild
showing the duplication direction.

```
"WILD" label, special slot wild symbol — duplicating variant,
clone aura with mirror echoes radiating sideways from the central wild,
suggesting visual replication into adjacent cells,
<wild.breaks_theme_via> palette breaking the theme,
barely contained — fills frame edge to edge,
<style_lock>,
centered on flat solid black background no gradients,
clear silhouette, sharp clean edges, professional slot game art,
only one symbol in the frame.
```

Quick check:
- [ ] Mirror / clone effect is visible but doesn't crowd the central wild element

---

## Scatter-Wild Hybrid (`SW`)

Acts as **both scatter and wild** simultaneously (Book of Dead's Book
symbol is the canonical example). Triggers free spins when 3+ land,
AND substitutes for pay symbols. The art combines a circular scatter
badge composition with the WILD label/break.

```
Hybrid scatter and wild slot symbol, "SCATTER WILD" or theme equivalent,
combines the radiant burst rays of a scatter symbol with the dominant
WILD label aesthetic of a wild symbol,
warm luminous palette characteristic of scatters,
"WILD" or hybrid label clearly readable,
fills the cell prominently — even larger than a regular scatter,
<style_lock>,
centered on flat solid black background no gradients,
clear silhouette, sharp clean edges, professional slot game art,
only one symbol in the frame.
```

Quick checks:
- [ ] BOTH scatter aesthetic (radiant rays, circular composition) AND wild aesthetic (WILD label, theme break) present
- [ ] Reads as more important than either a regular scatter or a regular wild
- [ ] Differentiable from `SC` (no wild label) and from `WD1` (no radiant burst)

---

## Pre-gen quick checks (all variants)

- [ ] Variant-specific visual cue is in the prompt (chain for sticky, motion blur for walking, etc.)
- [ ] Color is NOT in `palette_leads.primary` or `.accents`
- [ ] Category breaks the rest of the set
- [ ] "Barely contained" / fill phrase present
- [ ] Background is `flat solid black background, no gradients`

## Post-gen quick checks (all variants)

- [ ] Visually distinguishable from every other wild variant in this game
- [ ] Variant cue is unmistakable (locked feels locked, walking feels in motion)
- [ ] Reads as a wild — the WILD label or wild meaning is present
- [ ] Color is unique to this wild
- [ ] Fills the frame; doesn't float in empty space

## Generating multiple variants in one game

When a game ships with two or more wild variants:
1. Generate the simplest variant first (usually the standard wild)
2. Use it as a reference image for subsequent variants
3. State explicitly in each subsequent prompt: "visually distinct from
   the [other variant] already generated — different motif, different
   accent color"
4. After all variants are generated, read them side by side and confirm
   each one's mechanic reads at a glance
