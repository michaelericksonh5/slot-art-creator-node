# H5G Symbol Vocabulary — The Full Prefix System

This is the master reference for every symbol type a slot game might use.
Symbol manifests in `game_brief.json` use these standardized prefixes.
Every skill that handles symbols (`/slot-step-03`,
`/slot-step-04`, `/slot-step-08`, `/slot-step-09`) reads
this file when it needs to disambiguate.

> Source: distilled from the team's `Slot_Symbol_Taxonomy.md`,
> `SYMBOL_HIERARCHY.md`, and historical GDD analyses across multiple
> shipped games (Jungle Kingdom, Dragon's Blessings, Santa's World,
> Super Stack Fortunes, Golden Asp of Fortune, etc.).

---

## Prefix table (canonical)

### Pay tiers

| Prefix | Stands for | Pay tier | Common variants |
|---|---|---|---|
| `HP1`–`HP4` | High-Pay | Premium | character, iconic object, stacked / oversized, animated |
| `MP1`–`MP3` | Mid-Pay | Mid | themed object, themed animal, themed artifact |
| `LP1`–`LP6` | Low-Pay | Filler | card royals, suits, fruits, gems, themed small objects |

### Substitution / wild family

| Prefix | Stands for | Common variants |
|---|---|---|
| `WD` / `WD1`+ | Wild | sticky, stacked, expanding, walking, respin, transforming, multiplier, **duplicating**, **scatter-wild hybrid** |

### Trigger / scatter family

| Prefix | Stands for | Notes |
|---|---|---|
| `SC` | Scatter | classic scatter (legacy term — most newer games use `WY`) |
| `SW` | Scatter-Wild hybrid | acts as BOTH scatter AND wild (Book of Dead style) |
| `WY1`–`WY4` | Coin / Hold-and-Spin | gold (default), color-coded variants (red / green / blue) |
| `BO` / `BO1`+ | Bonus trigger | bonus-game launcher; sub-variant: **Bonus Bag** (`BAG_BO`) — money bag scatter with bonus tag |
| `BAG` | Money bag scatter | green / theme-colored bag; collected into a top row or meter |
| `MOJ` | Money emoji trigger | "💰" or theme emoji that triggers scatter collection over N spins |
| `SF` / `SF1`+ | Special Feature / Mystery | mystery transform, surprise — closed state until reveal |
| `BL` | Blocker / Dead | obstacle; doesn't pay |

### Loot Link / Hotspot mini-matrix family (modern feature family)

These appear in mini-matrix bonus games (Loot Link, Hotspot, Hold-and-Spin
side mechanics). Most often appear together inside a single bonus mode.

| Prefix | Stands for | Mechanic |
|---|---|---|
| `COL` | Collector | symbol that pulls value into a meter or sweeps adjacent scatters |
| `ACT` | Activator | triggers another mechanic (spawn wild, duplicate, expand) when present |
| `HOT_x2`, `HOT_x5`, ... | Hotspot multiplier | multiplies surrounding values by N |
| `HOT_ADD` | Hotspot adder | adds the symbol's value to all surrounding cells |
| `HOT_COMB` | Hotspot combiner | combines / sums values in surrounding cells |
| `HOT_COLLAPSE` | Hotspot collapse | resolves a collapse / clear event |
| `HOT_PERSIST` | Persistent hotspot | stays fixed across multiple spins of the bonus |

### Jackpot family

| Prefix | Stands for | Notes |
|---|---|---|
| `JP1` | Jackpot trigger (matrix) | the symbol that lands on the reel grid |
| `JP2`–`JP4` | Jackpot tiers | Mini / Minor / Major / Grand (4-tier — most common) |
| `JP2`–`JP6` | Jackpot tiers | Mini / Minor / Major / Mega / Grand / Premium (6-tier — Joker's Gems Jackpots style) |

Tier names vary: Mini/Minor/Major/Grand · Bronze/Silver/Gold/Platinum ·
Hourly/Daily/Anytime · etc. Always check `brief.jackpot_tier_names`.

### Pay-multiplier symbols (variants of base pays)

| Prefix | Stands for | Notes |
|---|---|---|
| `D2_<base>` | Double symbol | renders as 2 of the base symbol; pays as 2 (e.g. `D2_HP1`) |
| `D3_<base>` | Triple symbol | renders as 3 of the base; pays as 3 (e.g. `D3_HP1`) |
| `SPLIT_<base>` | Split symbol | mirrored / split treatment; pays as multiple |
| `MULT_<value>` | Multiplier symbol | dedicated multiplier (not a wild) e.g. `MULT_x10` |

### Pachinko / drop-style symbols (Drop Zone family)

For pachinko-style games (vertical drop, pegs, buckets — different game type entirely):

| Prefix | Stands for | Notes |
|---|---|---|
| `BALL` | Drop ball | the animated dropping element |
| `PEG` | Peg | the deflectors on the board |
| `BUCKET_<value>` | Award bucket | e.g. `BUCKET_x100`, `BUCKET_x1000` |

### Replacement / runtime swap

| Prefix | Stands for | Notes |
|---|---|---|
| `R` / `R1`+ | Replacement | swaps in for another symbol on a triggered event |

**Reading the symbol manifest:**

```json
"symbol_manifest": [
  {"id": "HP1", "tier": "HP", "subject": "phoenix bust", "role": "high-pay character"},
  {"id": "WD1", "tier": "special", "subject": "WILD label",   "role": "wild — sticky variant"},
  {"id": "WY1", "tier": "special", "subject": "gold coin",    "role": "hold-and-spin coin (gold currency)"},
  {"id": "WY2", "tier": "special", "subject": "red coin",     "role": "hold-and-spin coin (random-wilds variant)"},
  {"id": "BO",  "tier": "special", "subject": "bonus medallion", "role": "bonus game trigger"},
  {"id": "SF",  "tier": "special", "subject": "mystery box",  "role": "mystery / transforms at reveal"},
  {"id": "BL",  "tier": "special", "subject": "obsidian shard", "role": "blocker — does not pay"},
  {"id": "JP1", "tier": "special", "subject": "jackpot coin", "role": "jackpot trigger (matrix)"}
]
```

---

## Wild family (`WD`)

The basic wild substitutes for any pay symbol. Most modern games ship
**multiple wild variants** with different mechanics. Each variant gets
its own entry in the manifest (`WD1`, `WD2`, `WD3` …).

| Variant | What it does | Visual cue |
|---|---|---|
| Standard wild | Substitutes for any pay symbol | clean WILD label, theme-distinct color |
| Sticky wild | Locks in place for N spins | chain / pin / lock motif |
| Stacked wild | Appears as a vertical stack covering a whole reel | stretched / vertical-bar treatment |
| Expanding wild | Grows to fill the reel after landing | expanding rays / pulse motif |
| Walking wild | Moves one position per spin (also "Wild Train" / snake) | directional arrow / motion blur |
| Respin wild | Triggers a respin when it lands | refresh / arrow-loop motif |
| Transforming wild | Converts low-pays to high-pays | morph / particle dissolve motif |
| Multiplier wild | Multiplies the win it's part of (×2, ×3 …) | numeric multiplier on the wild |

For art generation, use `skills/slot-step-03/WILD_VARIANTS_TEMPLATE.md`.

---

## Coin / Hold-and-Spin family (`WY`)

The "WY" family is H5G's coin / hold-and-spin / collect-feature symbol
group. They appear as **circular coins** with a currency value (which is
overlaid at runtime, NOT painted into the art). Multiple variants in
one game are distinguished by **color**:

| ID | Typical color | Mechanic |
|---|---|---|
| `WY1` | gold (default) | standard coin — currency value |
| `WY2` | red | random-wilds variant — shoots wilds onto the reel |
| `WY3` | green | special collector — pins to position, fills a meter |
| `WY4` | blue / silver | combined / trigger-only (sometimes no matrix art needed) |

Coins ALWAYS render as circular medallions with a clean color block and
flat numeral space. The runtime overlays the currency amount; the art
generates with placeholder space (or no number at all).

Visual differentiation between WY variants must be **strong** —
players need to read the difference at a glance during fast spins.
Don't rely on subtle color shifts; use distinct hue families.

For art generation, use `skills/slot-step-03/COIN_TEMPLATE.md`.

---

## Bonus trigger (`BO`)

`BO` is a dedicated bonus-game launcher, distinct from a scatter. Some
games use `BO` AND a scatter (each triggers a different feature); some
games use only one. Check the brief.

Visual: typically a **non-circular badge** or a unique theme object
(scrolls, crystals, symbols of power) — designed to look meaningfully
different from the WY coins and the SC scatter.

For art generation, use `skills/slot-step-03/BONUS_TRIGGER_TEMPLATE.md`.

---

## Special Feature / Mystery (`SF`)

`SF` symbols are wildcards in the literal sense — players don't know what
they'll do until reveal. Common SF mechanics:

- **Mystery transform** — reveals as a random pay symbol
- **Surprise multiplier** — reveals as a ×N multiplier
- **Pick reveal** — player taps to reveal a prize

Visual: typically a **closed object** (treasure chest, crystal ball,
question-mark shrouded shape) — the *closed* state is what's drawn.
The opened/revealed state is a runtime animation that swaps in another
symbol's art.

For art generation, use `skills/slot-step-03/MYSTERY_TEMPLATE.md`.

---

## Blocker / Dead / Obstacle (`BL`)

`BL` symbols **do not pay** and **block clusters or paylines**. They're
mostly used in cluster-pay and grid-clear mechanics.

Visual: typically a **dead, dark, decorative object** — broken stone,
rusted gear, obsidian shard, ash pile. Must read as "not a pay symbol"
at a glance.

For art generation, use `skills/slot-step-03/BLOCKER_TEMPLATE.md`.

---

## Jackpot family (`JP`)

Jackpots come in two flavors:

- **Matrix jackpot coins** (`JP1`) — appear on the reel grid; landing N triggers a jackpot mini-game
- **Tier-only indicators** (`JP2`, `JP3`, `JP4`) — appear on a separate jackpot reel or in the jackpot wheel; never on the matrix; sometimes don't need full art (just a label / metallic texture)

Tier names vary by game:

| Common naming | Variant naming | Variant naming 2 |
|---|---|---|
| Mini · Minor · Major · Grand | Bronze · Silver · Gold · Platinum | Mini · Minor · Major · Mega |

Confirm the brief's `jackpot_tier_names` field; never assume.

For art generation, use `skills/slot-step-03/JACKPOT_TEMPLATE.md`.

---

## Replacement (`R`)

`R1`, `R2`, etc. are **runtime substitutions** — a triggered event swaps
this symbol in for another. The *mechanic* is set by the GDD; the art
just needs to be visually distinctive enough to catch the eye on landing.

If the brief shows an `R` symbol with `mechanic: TBD`, hold on art
generation and ask the user (or developer) for clarification.

---

## Other special mechanics

These are less common but may appear:

- **Split symbols** — a single symbol that pays as two (or more) of the same. Visual: a doubled / mirrored treatment, or a "2x" overlay
- **Collector symbols** — accumulate values into a meter; the symbol art is a vessel (jar, chest, pouch)
- **Sticky multiplier** — like sticky wild but with a multiplier value
- **Cluster symbols** — for cluster-pay games; usually look like generic mid-pays but the mechanic differs
- **Cascade / tumble symbols** — same as base symbols visually; the mechanic is a respin behavior

For these less-common types, see `skills/slot-step-03/SPECIAL_MECHANICS_TEMPLATE.md`.

---

## What goes where in the manifest

When generating, always:

1. Use the canonical prefix as the symbol ID (`HP1`, `WY2`, `BO`, etc.)
2. Set `tier` to one of: `HP`, `MP`, `LP`, `special`
3. Set `subject` to the user-facing thematic noun (`"phoenix bust"`, `"red coin"`)
4. Set `role` to a short description of mechanic/intent
5. For variants of a base type, append a number (`WD2`, `BO1`)

The art-generation skills route based on the prefix:

| Prefix | Reads template |
|---|---|
| `HP` | `HP_TEMPLATE.md` |
| `MP` | `MP_TEMPLATE.md` |
| `LP` | `LP_TEMPLATE.md` |
| `WD` (basic wild) | `WILD_TEMPLATE.md` |
| `WD2`+ or special wild variant | `WILD_VARIANTS_TEMPLATE.md` |
| `SC` | `SCATTER_TEMPLATE.md` |
| `WY` | `COIN_TEMPLATE.md` |
| `BO` | `BONUS_TRIGGER_TEMPLATE.md` |
| `SF` | `MYSTERY_TEMPLATE.md` |
| `BL` | `BLOCKER_TEMPLATE.md` |
| `JP` | `JACKPOT_TEMPLATE.md` |
| `R` | (clarify mechanic with user, then route by visual treatment) |
| Split / Collector / etc. | `SPECIAL_MECHANICS_TEMPLATE.md` |

---

## Naming convention for output files

Asset filenames follow `shared/asset_naming.md`. Each symbol slot uses
its prefix as the label:

```
HP1_001.png, HP1_002.png, ...
WD1_001.png, WD2_001.png, ...
WY1_001.png, WY2_001.png, WY3_001.png, ...
BO_001.png, BO_002.png, ...
SF_001.png
BL_001.png
JP1_001.png, JP2_001.png, JP3_001.png, JP4_001.png
R1_001.png
```

Each PNG is paired with a `.meta.json` sidecar containing its prompt
and parameters (see `shared/asset_naming.md`).
