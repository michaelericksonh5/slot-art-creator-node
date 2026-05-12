# `game_brief.json` — schema and example

The brief is the single source of truth every other slot-art-creator skill
reads. Keep it small, named-color only, and locked once approved.

## Schema (JSON)

```json
{
  "schema": "slot_game_brief.v1",
  "game_name": "string — user-facing theme name, NEVER the internal codename",
  "mood": "string — 1–2 words, e.g. 'mystical serene', 'aggressive electric'",
  "theme_summary": "string — ≤ 2 sentences",
  "style_lock": "string — EXACTLY one phrase from shared/nb2_prompting.md §9.4",
  "palette_leads": {
    "primary": "string — named colors, e.g. 'warm crimson and antique gold'",
    "accents": "string — 1–2 named accent colors",
    "forbidden_on_lp": ["gold", "amber", "warm orange", "..."]
  },
  "grid": "string — e.g. '5x3', '5x4', '5x6_bonus'",
  "tier_plan": {
    "lp_family": "one of: card_royals | suits | themed_objects | gems",
    "lp_count": 5,
    "mp_count": 2,
    "hp_count": 2,
    "specials_count": 3
  },
  "wild": {
    "category": "string — what it IS, e.g. 'WILD text label', 'lightning bolt object', 'character'",
    "breaks_theme_via": "string — how it breaks: different category / electric color / etc."
  },
  "scatter": {
    "label": "string — usually 'SCATTER' or 'BONUS'",
    "shape": "string — 'circular badge' (default) or other"
  },
  "bonus": {
    "label": "string — read by BONUS_TRIGGER_TEMPLATE.md, e.g. 'BONUS', 'FEATURE'",
    "subject": "string — the themed object the BO trigger renders as, e.g. 'ancient sealed scroll', 'crystal orb'"
  },
  "coins": [
    {
      "id":      "WY1",
      "color":   "gold",
      "mechanic": "standard hold-and-spin coin",
      "notes":   "optional"
    }
  ],
  "//": "coins[] — read by COIN_TEMPLATE.md. One entry per WY1..WY4. Default is WY1 gold; override per game.",
  "banners": [
    {
      "tier":  "big",
      "label": "BIG WIN",
      "min_multiplier": 10
    }
  ],
  "//": "banners[] — read by BANNERS_TEMPLATE.md. tier is one of small/medium/big/mega/epic.",
  "multipliers": [2, 3, 5, 10],
  "//": "multipliers[] — denominations needed in the game. Used by MULTIPLIER_TEMPLATE.md and SPECIAL_MECHANICS_TEMPLATE.md.",
  "jackpot_tier_names": ["Mini", "Minor", "Major", "Grand"],
  "//": "jackpot_tier_names — verbatim tier labels for JP2..JP4 (or JP6). Default is the 4-tier set; override for games using Bronze/Silver/Gold/Platinum or Hourly/Daily/Anytime/etc.",
  "symbol_manifest": [
    {
      "id": "HP1",
      "tier": "HP",
      "subject": "phoenix character bust",
      "role": "high-pay character",
      "notes": "optional notes"
    }
  ],

  "//": "Full prefix vocabulary lives in shared/symbol_vocabulary.md.",
  "//": "Common prefixes:",
  "//": "  HP1-HP4 (high-pay), MP1-MP3 (mid-pay), LP1-LP6 (low-pay)",
  "//": "  WD / WD2+ (wild + 9 variants), SW (scatter-wild hybrid)",
  "//": "  SC (scatter), WY1-WY4 (coin / hold-and-spin)",
  "//": "  BO (bonus trigger), BAG / BAG_BO (money bag scatters), MOJ (money emoji)",
  "//": "  COL (collector), ACT (activator)",
  "//": "  HOT_x* / HOT_ADD / HOT_COMB / HOT_COLLAPSE / HOT_PERSIST (Loot Link operators)",
  "//": "  SF (mystery / special feature), BL (blocker)",
  "//": "  JP1-JP6 (jackpot tiers — 4-tier or 6-tier configurations)",
  "//": "  D2_<base>, D3_<base>, SPLIT_<base> (pay multipliers)",
  "//": "  MULT_x* (non-wild multipliers), R1+ (replacement)",
  "//": "  BALL / PEG / BUCKET_x* (pachinko / drop-style games)",
  "//": "Each manifest entry uses {id, tier, subject, role, notes}.",
  "//": "tier is one of: 'HP', 'MP', 'LP', or 'special' (everything else).",
  "export_background_policy": {
    "hp": "black",
    "mp": "black",
    "lp": "white",
    "wild": "black",
    "scatter": "black"
  },
  "style_anchor": "string | null — 60–90-word block from /slot-step-01; this is a human-readable mirror of project.json.style_anchor.text (which is the canonical location every downstream skill reads)",
  "key_art_path": "string | null — bare filename of the locked key art; human-readable mirror of project.json.style_anchor.key_art_path (the canonical location). Written by /slot-step-02 on approval.",
  "gdd_source": {
    "file_id": "string | null — Google Drive file ID; set by /slot-step-00",
    "file_name": "string | null — full filename including version and extension",
    "drive_url": "string | null — https://drive.google.com/file/d/<ID>/view",
    "version_extracted": "string | null — version string from filename or doc header",
    "extracted_at": "string | null — ISO date when the GDD was last read"
  },
  "mode_list": ["string — e.g. 'base game', 'free spins', 'bonus pick-me', 'wheel'"],
  "rtp": "string | null — e.g. '96.5%'; for reference only, not used in art prompts",
  "open_questions": [
    "string — anything missing from the GDD or undecided"
  ]
}
```

## Example: a fully-locked brief

```json
{
  "schema": "slot_game_brief.v1",
  "game_name": "Phoenix of Ardashir",
  "mood": "mystical regal",
  "theme_summary": "Ancient Persian palace courtyard with a sacred phoenix presiding over a star-filled night sky.",
  "style_lock": "stylized semi-realistic slot game art",
  "palette_leads": {
    "primary": "deep midnight indigo with antique gold and burning crimson",
    "accents": "lapis blue, ember orange",
    "forbidden_on_lp": ["gold", "amber", "warm orange", "crimson"]
  },
  "grid": "5x4",
  "tier_plan": {
    "lp_family": "card_royals",
    "lp_count": 5,
    "mp_count": 2,
    "hp_count": 2,
    "specials_count": 3
  },
  "wild": {
    "category": "WILD text label rendered as molten gold calligraphy",
    "breaks_theme_via": "electric cyan rim light that appears nowhere else in the palette; text breaks the character/object pattern of the rest of the set"
  },
  "scatter": {
    "label": "SCATTER",
    "shape": "circular badge with radiant burst"
  },
  "symbol_manifest": [
    {"id": "HP1", "tier": "HP", "subject": "phoenix bust facing front, wings spread", "role": "high-pay character"},
    {"id": "HP2", "tier": "HP", "subject": "King Ardashir bust in profile", "role": "high-pay character"},
    {"id": "MP1", "tier": "MP", "subject": "ornate brass oil lamp", "role": "mid-pay object"},
    {"id": "MP2", "tier": "MP", "subject": "carved cedar chest with lapis inlay", "role": "mid-pay object"},
    {"id": "LP1", "tier": "LP", "subject": "letter A as cool muted card royal", "role": "low-pay card"},
    {"id": "LP2", "tier": "LP", "subject": "letter K as cool muted card royal", "role": "low-pay card"},
    {"id": "LP3", "tier": "LP", "subject": "letter Q as cool muted card royal", "role": "low-pay card"},
    {"id": "LP4", "tier": "LP", "subject": "letter J as cool muted card royal", "role": "low-pay card"},
    {"id": "LP5", "tier": "LP", "subject": "10 as cool muted card royal", "role": "low-pay card"},
    {"id": "WD1", "tier": "special", "subject": "WILD text label in molten gold with electric cyan rim",   "role": "wild — standard"},
    {"id": "WD2", "tier": "special", "subject": "WILD text label with chains and lock motif",              "role": "wild — sticky variant"},
    {"id": "WY1", "tier": "special", "subject": "gold phoenix-engraved coin",                              "role": "coin — hold-and-spin currency"},
    {"id": "WY2", "tier": "special", "subject": "red phoenix-engraved coin with energy crackle",           "role": "coin — random-wilds variant"},
    {"id": "WY3", "tier": "special", "subject": "green phoenix-engraved coin with collector aesthetic",    "role": "coin — special collector"},
    {"id": "BO",  "tier": "special", "subject": "ancient sealed scroll with phoenix wax seal",             "role": "bonus trigger"},
    {"id": "SF",  "tier": "special", "subject": "shrouded crystal with hidden glow",                       "role": "mystery / transforms at reveal"},
    {"id": "BL",  "tier": "special", "subject": "cracked obsidian shard with dead-cold finish",            "role": "blocker — does not pay"},
    {"id": "JP1", "tier": "special", "subject": "circular jackpot coin with sunburst",                     "role": "jackpot — matrix trigger"}
  ],
  "export_background_policy": {
    "hp": "black",
    "mp": "black",
    "lp": "white",
    "wild": "black",
    "scatter": "black"
  },
  "open_questions": []
}
```

## Anti-patterns

```json
{
  "game_name": "Tesla 4470",                              // INTERNAL CODENAME — wrong
  "palette_leads": { "primary": "#C8960C and #4A1818" }, // HEX — wrong
  "style_lock": "stylized + painterly + cel-shaded",     // multiple — wrong
  "tier_plan": { "lp_family": "cards + gems" }           // mixed family — wrong
}
```
