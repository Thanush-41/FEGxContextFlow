# PSK Demo Prototype — Design System

## Product and experience

PSK is a fictional, demo-only iOS sports betting and casino prototype for adults 18+. It prioritizes live score comprehension, fast market selection, transparent estimated-return calculations, and visible responsible-gaming controls. No real money, payments, personal information, or gambling service is used.

Primary journeys:

- Short splash/onboarding → demo sign-up/sign-in/OTP → live home.
- Browse Live, Today, Next 3 Hours, or the Sports directory.
- Open a fictional event, inspect the scoreboard, momentum, stats, line-ups, and market groups.
- Select/deselect odds, resolve same-event incompatibilities, accept changed odds, enter a stake, and place a demo bet.
- Browse three original casino demos and play short simulations with demo credits.
- Open Menu → PSK Arena, preview a community slip, remove selections, and explicitly copy valid picks into the user's slip.
- Reach session reminders, spending controls, self-exclusion information, and help from Menu and contextual notices.

## Research-derived UX rules

- Use five persistent top-level destinations with icon + one-word label: Live, Today, Sports, Casino, Menu. Preserve state when switching tabs and never repurpose a tab item as an action.
- Place the contextual bet-slip accessory immediately above the bottom navigation. It can expand as a bottom sheet and has a separate full-page review.
- Make live state unmistakable through a small red dot, compact clock/stage, prominent score, and rapid-scan market buttons.
- Use horizontal sport chips and compact segmented time filters. Selected filters must remain visually obvious.
- Progressive disclosure: show primary markets on cards; reveal additional markets, statistics, and player props inside the event detail.
- Treat odds like compact trade quotes: decimal value is visually dominant; movement uses directional arrows and color, never color alone.
- Keep transaction math continuously visible and label return/profit as estimates. Changed odds require explicit acceptance.
- Community-copy actions always open a preview; nothing is placed automatically.
- Responsible-gaming tools are first-class: reminder status, session/spending controls, help, and self-exclusion entry points.

## Visual thesis

Use a high-contrast dark iOS interface with a premium but quiet “signal grid” personality. Adapt the Neural Noir library prompt by retaining its precise dark depth, faint radial data texture, compact status glow, and clear card layering—but replace gold, editorial serif, and broad glass effects with PSK's own electric-lime sports identity and SF-style typography.

### Color tokens

- Canvas: `#080B0A`
- App background: `#0B0F0D`
- Elevated surface: `#121814`
- Elevated surface 2: `#18201B`
- Pressed surface: `#202A23`
- Hairline: `#29332D`
- Primary text: `#F5F8F6`
- Secondary text: `#A8B2AC`
- Muted text: `#758079`
- Primary accent: `#C7F65B`
- Accent strong: `#AEE83F`
- Accent ink: `#10150D`
- Positive: `#42D392`
- Live / destructive: `#FF5A67`
- Warning / odds changed: `#FFB44A`
- Informational: `#67D9FF`

The lime accent is for selection, primary actions, active navigation, and positive signal—not decorative flooding. Red is reserved for live indicators, losses, warnings, and destructive actions.

## Typography

- Font stack: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, sans-serif`.
- Large score: 36–44px, 750–800 weight, tabular numerals.
- Page title: 24–28px, 750 weight, tight tracking.
- Card title / team market: 15–17px, 650–700 weight.
- Body: 14–15px, 450–550 weight.
- Meta / timestamps: 11–13px, 500–650 weight.
- Odds: 15–17px, 750 weight, tabular numerals.
- Never use tiny legal text below 11px. Keep long notices line-height at least 1.45.

## Layout and spacing

- Design first for 390 × 844 points with `env(safe-area-inset-*)` support.
- Page horizontal padding: 16px. Card padding: 14–16px. Vertical rhythm: 8px base unit.
- Minimum touch target: 44 × 44px.
- Cards: 16–20px radius. Pills/chips: full radius. Bottom sheet: 26px top radius.
- Desktop: center the mobile app in a polished 430px-wide phone shell with a dim signal-grid backdrop. Do not stretch the app into a desktop dashboard.
- Avoid horizontal overflow; horizontal lists scroll only within their own regions with hidden scrollbars and visible continuation cues.

## Components

### Header

Compact logo lockup at left, demo wallet and deposit action centered/right, then 44px search, notification, and voice-agent actions. The voice agent uses a waveform/mic icon with a subtle cyan ring and opens a demo listening panel.

### Sport and time filters

Sport chips combine a Lucide-style line icon and label. Time scope uses a three-segment control: Live, Today, Next 3 Hours. Chips and segmented controls use strong text contrast and clear selected fill.

### Match card

Top row: league and favorite/stream/stats actions. Score row: live stage, two teams, current scores. Market row: 2–3 equal-width odds controls with market label and decimal odds. Whole card opens detail except nested controls. Additional markets expand inline.

### Odds control

Rounded 12px dark button with 44px minimum height. Market outcome label is smaller; decimal odd is bold. Selected state uses lime fill and dark text. Changed state uses warning border + arrow with accessible text. Suspended state is disabled with a lock icon and `SUSP` label.

### Bet-slip accessory and sheet

Persistent 56px accessory above tab bar when selections exist. Expanded sheet uses a drag handle, selection list, Single/Accumulator segmented tabs, stake input, quick stakes, formula breakdown, balance, warnings, and one primary demo action. Full-page review is reachable from the sheet.

### Navigation

Five fixed icon+label tabs. Active tab uses lime foreground and a small rounded indicator. Bet-slip count remains a separate accessory badge, never a sixth navigation item.

### Feedback and system states

- Toasts sit above the slip/nav area.
- Skeletons use subtle dark shimmer.
- Empty states use a small line icon, plain explanation, and one recovery action.
- Success uses a contained emerald pulse/check. Error uses red border/icon without full-screen red.
- Loading controls preserve layout and announce status through an ARIA live region.

## Motion

- 160–220ms ease-out for press, sheet, tab, and card transitions.
- Tactile press: translateY(1px) and scale(0.985).
- Score update: brief 400ms soft highlight; odds movement: short arrow/fade.
- Loading screens may use restrained rotating/orbiting geometry.
- Under `prefers-reduced-motion: reduce`, remove transforms, smooth scrolling, shimmer, and autoplay-like effects.

## Accessibility and safety

- Maintain WCAG AA contrast for text and controls.
- Use semantic headings, forms, labels, buttons, navigation, `aria-current`, `aria-expanded`, `aria-live`, and descriptive odds labels.
- Visible 2px focus ring offset from controls.
- Never rely on color alone for live, odds movement, selected, win/loss, or error states.
- Every screen displays or can reach “Demo Prototype” and “18+ Play responsibly.”
- Forms use demo values only; client validation never stores personal information.
- Casino uses demo points/credits and original abstract game art only.

## Hard constraints

- Original PSK visual identity; do not copy another sportsbook, finance, fantasy, score, or casino brand.
- No copyrighted league logos, team crests, player photos, slot art, or branded game imagery.
- No aggressive promotional claims, “guaranteed win,” “risk-free,” or “easy money.”
- No excessive glassmorphism, blurred content surfaces, tiny text, or noisy gradients.
- Use only the fonts, colors, spacing, and component styles defined here. Do not introduce any fonts, colors, or visual styles not in this system.
