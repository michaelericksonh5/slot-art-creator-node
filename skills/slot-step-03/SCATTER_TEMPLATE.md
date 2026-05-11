# Scatter Symbol Template

The scatter is the bonus trigger. It's instantly recognizable as a
**circular badge with a label and radiant burst**. Players need to spot it
on a busy reel grid in under a second.

## Tier rules

- **Background:** flat solid black, no gradients
- **Shape:** circular badge — NOT square, NOT a free-form object
- **Palette:** warm and luminous — gold, amber, sun-bright accents are allowed and encouraged (this is the OPPOSITE of LP)
- **Label:** the word "SCATTER" or `brief.scatter.label` is part of the symbol
- **Size phrase:** "prominent, circular badge-shaped, fills the cell"

## Prompt — Scatter

```
"<scatter.label>" label, special bonus symbol,
circular badge-shaped, prominent, fills the cell,
warm luminous <palette_leads.primary> with radiant burst rays,
radiant warm palette,
<style_lock>,
centered on flat solid black background no gradients,
clear silhouette, sharp clean edges, professional slot game art,
only one symbol in the frame.
```

Substitution:
- `<scatter.label>` — pull from `brief.scatter.label` (default: `"SCATTER"`)

## Pre-gen quick checks

- [ ] Shape is "circular badge" stated explicitly
- [ ] Label text is part of the prompt
- [ ] Background is `flat solid black background, no gradients`
- [ ] Warm luminous palette is allowed (this is one of the few places where warm palettes apply outside HP)

## Post-gen quick checks

- [ ] Recognizable as a circular badge
- [ ] Label text is readable at thumbnail size
- [ ] Distinct from any HP symbol (radiant burst is the giveaway)
- [ ] Background is flat black

## Variations

- **Bonus trigger** uses the same template with `label = "BONUS"` and a slightly different burst pattern
- **Free-spins trigger** sometimes uses the scatter symbol; check the brief
