## Project Overview
Idolverse: A K-Pop idol management simulation web game.
Kairosoft-style pixel art, mobile-first, weekly time progression.
Core gameplay: Strategic choices based on trade-offs. Results are determined by the combination of members, their chemistry, and their concepts.

## Architecture
- React 19 (UI) + Phaser 3 (pixel art simulation view) hybrid
- State sharing via a vanilla Zustand v5 store (React: useStore, Phaser: getState/setState/subscribe)
- EventBus for React <-> Phaser event communication
- Supabase Auth + PostgreSQL

## State Design Principles
- All game state is centralized in the Zustand store
- Separated into 10 domains: gameStore, traineeStore, staffStore, albumStore, fandomStore, competitorStore, financeStore, calendarStore, eventStore, foundingStore
- System logic is implemented as pure functions in src/systems/. Takes the current state and returns a new state. Separated from UI/rendering code.

## Core Game Rules (Always refer to these when implementing code)
- Each week, players make only 3–4 key decision cards; the manager handles the remaining schedules and operational details
- Every choice has an opportunity cost (e.g., sending a member to variety shows skips training; skipping training lowers their condition)
- Members have specific positions (Leader/Main Vocalist/Main Dancer/Center/Visual/Variety/Producing)
- Trainee stats are visual, vocal, dance, charm, stamina, and mental. Stamina includes the old diligence role; do not add a separate diligence stat.
- Audition candidate names must match the selected group gender (`groupGender`).
- Each member pair has a chemistry value (-100 to +100) that affects team efficiency
- Each member has a concept affinity; repeatedly using an unsuitable concept accumulates dissatisfaction -> defection
- Fans/fame is divided into 4 categories: public recognition, core fandom, overseas fandom, and industry reputation
- Investor type dictates the overall gameplay style (IT = Streaming/SNS growth, Entertainment = Stage/Awards, VC = Investment returns, Cosmetics = Visuals, Fashion = Style/Trend alignment)
- Competitive groups: 3–5 teams (5 types) at any given time + event-based pop-up groups
- 52-week seasonal cycle (Spring/Summer/Fall/Winter) influences concept demand and the market

## UI Rules
- Mobile-first: 360px baseline, desktop scales to max-width
- Tailwind CSS, avoid inline styles (exception: dynamic values that cannot be expressed via classes — e.g., `backgroundImage` from `assetUrl()`)
- Dark theme by default (background #0f172a–#1e293b, accent pink #ec4899 + cyan #06b6d4)
- Touch area minimum 44px
- Pixel fonts only within the game view; system fonts for UI panels
- Player-facing copy must treat members, staff, content, and company operations as real people and work. Use "manager," not "manager AI," and prefer human actions such as planning, assigning, reporting, and negotiating over implementation terms such as automation, processing, logic, or system.
- Prefer plain player-facing language over business shorthand. Describe performance as concrete goals such as streaming growth, SNS response, or promises made to investors. In Korean player-facing copy, avoid em dashes and en dashes; use short sentences, commas, parentheses, or `~` for ranges.

## Asset Loading
- All static images (under `public/images/` in dev) are referenced via `assetUrl()` from `src/utils/assets.ts`
- `VITE_ASSET_BASE_URL` env var swaps the base path: unset = local `/images`, set = remote CDN (e.g., R2 public URL)
- Bucket layout must mirror `public/images/` so the same relative path works in both modes
- Do not hardcode `/images/...` in new code; always go through `assetUrl()`

## Code Style
- TypeScript strict mode
- Functional components; do not use React.FC
- Centralize constants and balance values in src/data/; no magic numbers
- Commit: feat/fix/refactor/style/data
