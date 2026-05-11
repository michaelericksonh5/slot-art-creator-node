# HP — High-Pay Symbol Templates

HP symbols are the warmest, richest, most dominant tier. They establish the
top of the value gradient. There are usually 2 in a set (HP1, HP2). HP1 is
the warmest/most saturated; HP2 is one notch below HP1.

## Tier rules

- **Background:** flat solid black, no gradients
- **Palette:** warm end of `palette_leads.primary` + rim glow allowed
- **Light:** upper-left key light at 10 o'clock + soft inner rim glow
- **Size phrase:** "large and prominent, more valuable than all mid and low tier symbols"
- **Tier hierarchy:** HP1 sets the high water mark; HP2 is 10–15% less saturated and slightly smaller than HP1

## Prompt — HP character

Use when the HP subject is a character, person, deity, animal, etc.

```
<subject>, high-pay premium slot symbol, large and prominent,
more valuable than all mid and low tier symbols,
<palette_leads.primary> palette, soft inner rim glow,
<style_lock>, not photorealistic,
centered on flat solid black background no gradients,
clear silhouette at tiny thumbnail size, sharp clean edges,
high quality game asset, professional slot game art,
mobile-optimized icon, only one symbol in the frame.
```

## Prompt — HP iconic object

Use when the HP subject is a hero object (a sword, a treasure chest, a
totem, a symbol of power) rather than a character.

```
<subject>, high-pay premium slot symbol, large and prominent,
fills most of the cell with a small border,
warm <palette_leads.primary> palette with metallic highlights and inner rim glow,
<style_lock>, not photorealistic,
centered on flat solid black background no gradients,
clear silhouette, sharp clean edges, professional slot game art,
mobile-optimized icon, only one symbol in the frame.
```

## Pre-gen quick checks

- [ ] Background is `flat solid black background, no gradients`
- [ ] Warm palette pulled from `palette_leads.primary`
- [ ] Rim glow allowed and encouraged
- [ ] If this is HP2: prompt notes it's "one notch below HP1" + slightly less saturated
- [ ] Subject is the manifest's `subject` field, not the internal ID

## Post-gen quick checks

- [ ] Silhouette readable at thumbnail size
- [ ] Background is flat black (no gradient)
- [ ] Warmer/more saturated than the MP and LP tiers in the set
- [ ] Light direction matches prior HP if one exists in the set
