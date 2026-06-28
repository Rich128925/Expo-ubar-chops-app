@AGENTS.md

# Reusable Components

Always use and build on the reusable components in `components/ui/` before writing one-off styles inline:

- `components/ui/Button.tsx` — supports `variant`: `primary` (green), `secondary` (light gray), `inverted` (black), `outlined` (white + border). Accepts `rightIcon` and `loading`.
- `components/ui/FormInput.tsx` — labelled input with optional left icon, right label link, password toggle, and error state
- `components/ui/Divider.tsx` — horizontal rule with optional centred label (e.g. "OR")

When a new UI pattern is needed more than once, extract it into `components/ui/` and import from there.

# Design System

## Colors
All colours come from `BrandColors` in `constants/theme.ts`. Never hardcode hex values.

| Token | Value | Usage |
|---|---|---|
| `primary` | `#006D37` | Green — buttons, links, brand title |
| `black` | `#000000` | Secondary / inverted button |
| `background` | `#F6F6F6` | Screen backgrounds, secondary button fill |
| `cardBg` | `#FFFFFF` | Cards |
| `inputBg` | `#F6F6F6` | Input fields |
| `textPrimary` | `#000000` | Headings, labels |
| `textSecondary` | `#545454` | Body, subtitles (Neutral) |
| `textMuted` | `#AAAAAA` | Placeholders, divider labels |

## Typography
Font: **Hanken Grotesk** — loaded via `@expo-google-fonts/hanken-grotesk`.
Use `FontFamily` tokens from `constants/theme.ts` (`regular`, `medium`, `semiBold`, `bold`, `extraBold`).
Never use `fontWeight` alone — always pair with `fontFamily`.

## Spacing & Radius
Use `Spacing` (`xs`–`xxl`) and `BorderRadius` (`sm`–`xl`, `full`) from `constants/theme.ts`.
