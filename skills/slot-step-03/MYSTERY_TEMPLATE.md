# Mystery / Special Feature Template (`SF`)

`SF` symbols are **wildcards in the literal sense** — players don't know
what they'll do until reveal. Common SF mechanics:

- **Mystery transform** — reveals as a random pay symbol (most common)
- **Surprise multiplier** — reveals as a ×N multiplier
- **Pick reveal** — player taps to reveal a prize
- **Mystery prize** — reveals as a cash value or feature trigger

The art is the **closed / unrevealed state**. The reveal animation that
swaps in the actual symbol is a runtime behavior — not part of this art.

## Universal rules

- **Background:** flat solid black, no gradients
- **Closed-state aesthetic:** the symbol must look like something
  hiding a secret — sealed, shrouded, gift-wrapped
- **Question-mark vibe (don't be literal):** suggest mystery without
  always painting a literal "?" — though "?" is fine for some themes
- **Sizing:** "prominent, fills the cell, more visually weighted than MP/LP"

## Common SF visual treatments

| Treatment | When to use |
|---|---|
| Closed treasure chest with glowing crack | fantasy / adventure / pirate |
| Gift box with ribbon | Christmas / casual / candy themes |
| Crystal ball with shrouded interior | mystical / fortune-telling / fantasy |
| Sealed envelope with wax seal | classic / Victorian / mystery |
| Question-mark medallion | retro / classic Vegas / fruit machines |
| Veiled portrait | gothic / horror / Victorian |
| Wrapped scroll with shimmer | Egyptian / ancient / library |
| Glowing orb with hidden silhouette | sci-fi / fantasy |

The brief's `mystery.subject` field should specify; if not, pick the
treatment that fits the theme and confirm with the user.

## Prompt — Mystery / SF symbol

```
<mystery.subject> as a mystery symbol slot icon,
closed and unrevealed state — the secret is hidden,
glowing or shimmering hint that something is inside without revealing it,
fills the cell prominently with a small border,
<style_lock>,
centered on flat solid black background no gradients,
<palette_leads.primary> palette with mysterious accent glow,
clear silhouette, sharp clean edges, professional slot game art,
only one symbol in the frame.
```

Substitute `<mystery.subject>` from the brief — examples above.

## Pre-gen quick checks

- [ ] Symbol is described as the CLOSED / unrevealed state
- [ ] Mystery cue is present (glow, shimmer, "hidden inside")
- [ ] Subject is theme-appropriate
- [ ] Background is `flat solid black background, no gradients`
- [ ] Single subject — not multiple objects competing

## Post-gen quick checks

- [ ] Looks closed / sealed — does NOT show a revealed symbol
- [ ] Mystery cue (glow / shimmer) is visible but subtle
- [ ] Theme-appropriate (a treasure chest in a sci-fi game is wrong)
- [ ] Reads as "something secret is here"
- [ ] Distinguishable from BONUS / WILD / SCATTER symbols

## Anti-patterns

- ❌ Showing the revealed symbol inside the closed state — that's the
  runtime animation, not the art
- ❌ Using a generic "?" symbol when the theme calls for an object
- ❌ Making the SF look like a coin (that's WY territory)
- ❌ Painting actual transformation in progress (use the closed state)

## Multiple SF symbols in one game

If a game has SF1 and SF2 (different mystery mechanics), they need
distinct visual treatments — different closed-object types so players
can tell which mystery is which. Pass the first SF as a reference when
generating the second and state the visual difference explicitly.
