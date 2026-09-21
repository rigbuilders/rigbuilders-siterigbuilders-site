# Rig Builders — Brand Palette

**System:** Monochrome (black + white + grey ramp) with **one** accent: **Molten Orange `#FF5A1F`**.

**Positioning it serves:** premium, engineered, performance. Trust and reliability are
communicated through *design discipline* — generous space, precise typography, real specs
and proof — **not** through the accent colour. The orange is for *action and energy*.

**The premium rule (most important):** the orange lives on roughly **5–10% of any screen** —
CTAs, active/selected states, key numbers, the logo dot, a single hero keyword. It is never a
background wash or a large fill. Everything else is monochrome. Restraint is what reads as
"Apple/Samsung premium" rather than "gamer sticker sheet."

## Tokens

Defined in two mirrored places:
- `tailwind.config.js` → `colors.rb.*`  → use as `bg-rb-surface`, `text-rb-orange`, `border-rb-line`, etc.
- `app/globals.css` → `:root { --rb-* }`  → use in raw CSS / inline styles / gradients.

### Base — monochrome grey ramp
| Token | Hex | Use |
|---|---|---|
| `rb-black` | `#0A0A0A` | Deepest — hero, full-bleed sections |
| `rb-surface` | `#101112` | Page background |
| `rb-elevated` | `#17181A` | Cards / panels |
| `rb-raised` | `#1F2123` | Hover / elevated card |
| `rb-line` | `#2A2D2F` | Hairline borders |
| `rb-silver` | `#8A8F90` | Muted / tertiary text |
| `rb-mist` | `#C7CBCC` | Secondary text |
| `rb-white` | `#F4F5F5` | Primary text on dark |

### Accent — molten orange (use sparingly)
| Token | Hex | Use |
|---|---|---|
| `rb-orange` | `#FF5A1F` | **The** accent — CTAs, active states, key figures, logo dot, one hero keyword |
| `rb-orange-deep` | `#E24410` | Hover / pressed; calmer fills |
| `rb-orange-ink` | `#160603` | Text/icon colour **on** an orange fill |
| `rb-orange-light` | `#D8420E` | Accent on **light** surfaces (invoices, email, print) — has contrast on white |

### Status — reserved, functional only
| Token | Hex | Use |
|---|---|---|
| `rb-success` | `#22C55E` | In stock / compatible |
| `rb-danger` | `#E5484D` | Out of stock / incompatible — a **true red**, kept clearly redder than the warm brand orange so the two never blur on compatibility screens |
| `rb-warn` | `#EAB308` | Low stock / caution — yellow, deliberately off the orange |

**Do not** use success/danger/warn decoratively. They only ever mean stock/compatibility status.

## Ready-made premium utilities (`app/globals.css`)
- `.rb-ember-glow` — subtle ambient hero glow (a single low, off-centre warm ember).
- `.rb-cta` — primary orange CTA (dark ink, restrained glow on hover).
- `.rb-ghost` — secondary/ghost button (hairline that warms to orange on hover).
- `.rb-surface-card` — elevated mono card; hairline catches a hint of ember on hover (no coloured border at rest).
- `.rb-text-ember` — accent text glow for a single hero keyword (use once per view).
- `.rb-kicker` — small uppercase eyebrow label above a headline.
- `.rb-hairline` — brand-grey divider colour.

## Migration note
The old identity used purple/gold (`brand.purple` is actually `#E6C700` gold, plus stray
`#FFE600` and `#4E2C8B` purple). Those legacy tokens and the older `.rb-hero-glow` / `.rb-card`
/ `.rb-btn-primary` utilities are **left in place** so existing pages keep working. New and
rebranded surfaces should use the `rb-*` tokens and the canonical utilities above. Existing
pages can be migrated to the new system incrementally.
</content>
