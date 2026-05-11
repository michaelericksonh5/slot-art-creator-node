# LP — Low-Pay Symbol Templates

LP is the coolest, simplest, least ornamented tier. There are usually 5–6
in a set (LP1–LP6). The LP family is locked in `brief.tier_plan.lp_family`
and can be one of: `card_royals`, `suits`, `themed_objects`, `gems`. **Never
mix families** within one set.

## Universal LP rules (all families)

- **Background:** flat solid white, no gradients
- **Palette:** cool muted only — soft cyans, silvers, pale theme accents
- **Light:** flat or very subtle; no rim glow
- **Size phrase:** "small and understated, generous empty space"
- **Tier hierarchy:** clearly the simplest, coolest, least ornamented in the set

## ⛔ LP forbidden words (hard gate)

These words must NEVER appear in an LP prompt. If any is present, rewrite
before calling `nb2_generate`:

- `gold`
- `amber`
- `warm`
- `detailed`
- `ornate`
- `rich`
- `glowing`

This is enforced in `shared/qa_preflight.md` Gate 1 — pre-generation
validation will reject the prompt before NB2 sees it.

## LP family — `card_royals` (A K Q J 10 9)

This is the most common LP family. Each LP is one card royal letter/number.

```
The letter "<letter>" as a low-pay slot symbol,
small and understated with generous empty space,
cool muted palette — soft cyan and pale silver only,
no warm gold or amber anywhere, not even trim,
flat vector game icon design,
letter shape reads first, theme decoration subtle and behind the letter,
centered on flat solid white background no gradients,
clear silhouette at tiny thumbnail size, sharp clean edges,
professional slot game art. Do not use the word detailed.
```

## LP family — `themed_objects`

Small theme-relevant objects (e.g., feathers, beads, scarabs, runes — never
the same category as HP/MP).

```
<subject> as a low-pay slot symbol,
small and understated with generous empty space,
cool muted <theme> palette, no warm gold or amber,
flat vector game icon design,
centered on flat solid white background no gradients,
clear silhouette, sharp clean edges,
professional slot game art. Do not use the word detailed.
```

## LP family — `gems`

Faceted gemstones in cool colors only.

```
<gem_type> gemstone as a low-pay slot symbol,
small and understated with generous empty space,
cool muted <gem_color> faceted gem,
2 to 3 clean specular points (not 8 micro-facets),
no warm gold or amber on the stone or setting,
flat vector game icon design,
centered on flat solid white background no gradients,
clear silhouette, sharp clean edges,
professional slot game art. Do not use the word detailed.
```

## LP family — `suits` (♠ ♥ ♦ ♣)

Stylized card suit icons themed to the game.

```
<suit_name> playing card suit icon as a low-pay slot symbol,
small and understated with generous empty space,
cool muted palette — silver and pale theme color,
flat vector game icon design,
centered on flat solid white background no gradients,
clear silhouette, sharp clean edges,
professional slot game art.
```

## Pre-gen quick checks

- [ ] Prompt contains ZERO forbidden words (see list above)
- [ ] Background is `flat solid white background, no gradients`
- [ ] Palette is cool and muted only
- [ ] LP family matches `brief.tier_plan.lp_family` (no mixing)
- [ ] If card_royal: subject is a letter/number, not a themed object
- [ ] Subject is described as "small and understated"

## Post-gen quick checks

- [ ] Zero gold / amber / warm trim visible (any → BLOCK, auto-regenerate)
- [ ] Background is flat white (no off-white, no gradient)
- [ ] Cooler and simpler than every other tier in the set
- [ ] If card_royal: the letter/number reads first, decoration is subtle behind
- [ ] Family is consistent with sibling LPs (no mixing card royals with gems, etc.)
