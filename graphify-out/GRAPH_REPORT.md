# Graph Report - wedding  (2026-09-29)

## Corpus Check
- Corpus is ~20,733 words - fits in a single context window. You may not need a graph.

## Summary
- 233 nodes · 435 edges · 21 communities (18 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App Shell & Cloudinary Upload
- Package Dev Dependencies
- TypeScript Config
- Music & Heart Rain
- Wedding Gate & Album
- Guestbook & Store
- Hero & Countdown
- Lunar Calendar
- Runtime Dependencies
- Node TS Config
- Vercel Blob API
- Petals & Reveal
- Fairytale Canvas
- Live Love Reactions
- Confetti
- Scroll Love Spreader
- Celebration Cannon
- Sparkle Trail
- Navigation
- Vercel Rewrites

## God Nodes (most connected - your core abstractions)
1. `useConfigStore` - 26 edges
2. `react` - 24 edges
3. `InvitationPage()` - 22 edges
4. `compilerOptions` - 18 edges
5. `ConfigPage()` - 14 edges
6. `react-router-dom` - 7 edges
7. `Invitation()` - 7 edges
8. `getGoogleCalendarUrl()` - 7 edges
9. `downloadIcsFile()` - 7 edges
10. `INT()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `InvitationPage()`  [EXTRACTED]
  src/App.tsx → src/pages/InvitationPage.tsx
- `InvitationPage()` --calls--> `CelebrationCannon()`  [EXTRACTED]
  src/pages/InvitationPage.tsx → src/components/CelebrationCannon.tsx
- `Rsvp()` --calls--> `Confetti()`  [EXTRACTED]
  src/sections/Rsvp.tsx → src/components/Confetti.tsx
- `Countdown()` --calls--> `useConfigStore`  [EXTRACTED]
  src/components/Countdown.tsx → src/store.ts
- `InvitationPage()` --calls--> `FairytaleCanvas()`  [EXTRACTED]
  src/pages/InvitationPage.tsx → src/components/FairytaleCanvas.tsx

## Import Cycles
- None detected.

## Communities (21 total, 3 thin omitted)

### Community 0 - "App Shell & Cloudinary Upload"
Cohesion: 0.08
Nodes (37): react-dom, App(), BootState, uploadAudioToCloudinary(), uploadImageToCloudinary(), Window, src_index, ConfigPage() (+29 more)

### Community 1 - "Package Dev Dependencies"
Cohesion: 0.08
Nodes (24): devDependencies, @types/node, @types/react, @types/react-dom, typescript, vite, @vitejs/plugin-react, name (+16 more)

### Community 2 - "TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowSyntheticDefaultImports, esModuleInterop, isolatedModules, jsx, lib, module (+12 more)

### Community 3 - "Music & Heart Rain"
Cohesion: 0.14
Nodes (13): HeartRain(), HEARTS, MusicPlayer(), MusicPlayerProps, src_styles_album, src_styles_animations, src_styles_couple, src_styles_gate (+5 more)

### Community 4 - "Wedding Gate & Album"
Cohesion: 0.23
Nodes (11): WeddingGate(), WeddingGateProps, InvitationPage(), Album(), capitalizeWords(), Couple(), Guestbook(), Rsvp() (+3 more)

### Community 5 - "Guestbook & Store"
Cohesion: 0.15
Nodes (13): react-router-dom, QUICK_WISHES, RELATIONS, compressImage(), ConfigStore, CustomGuest, DEFAULT_CONFIG_ID, defaultConfig (+5 more)

### Community 6 - "Hero & Countdown"
Cohesion: 0.31
Nodes (10): Countdown(), parseTarget(), UNITS, Hero(), Invitation(), MONTHS, downloadIcsFile(), getGoogleCalendarUrl() (+2 more)

### Community 7 - "Lunar Calendar"
Cohesion: 0.42
Nodes (11): CAN, CHI, convertSolar2Lunar(), getLeapMonthOffset(), getLunarDateString(), getLunarMonth11(), getLunarYearName(), getNewMoonDay() (+3 more)

### Community 8 - "Runtime Dependencies"
Cohesion: 0.25
Nodes (8): dependencies, emailjs-com, qrcode, react, react-dom, react-router-dom, @vercel/blob, zustand

### Community 9 - "Node TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 10 - "Vercel Blob API"
Cohesion: 0.60
Nodes (5): handler(), normalizeId(), pathFor(), readStored(), @vercel/blob

### Community 11 - "Petals & Reveal"
Cohesion: 0.33
Nodes (4): react, FloatingPetals(), ITEMS, useReveal()

### Community 12 - "Fairytale Canvas"
Cohesion: 0.33
Nodes (5): FairytaleCanvas(), Firefly, FIREFLY_COLORS, Petal, PETAL_GRADIENTS

### Community 13 - "Live Love Reactions"
Cohesion: 0.33
Nodes (5): BLESSINGS, FloatingLove, HEART_COLORS, HEART_ICONS, LiveLoveReactions()

### Community 14 - "Confetti"
Cohesion: 0.50
Nodes (4): COLORS, Confetti(), makeParticles(), SHAPES

### Community 15 - "Scroll Love Spreader"
Cohesion: 0.40
Nodes (4): FLOWERS, HEARTS, LoveParticle, ScrollLoveSpreader()

### Community 16 - "Celebration Cannon"
Cohesion: 0.50
Nodes (3): CELEBRATION_COLORS, CelebrationCannon(), Particle

### Community 17 - "Sparkle Trail"
Cohesion: 0.50
Nodes (3): Sparkle, SPARKLE_CHARS, SparkleTrail()

## Knowledge Gaps
- **94 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+89 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 111 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Petals & Reveal` to `App Shell & Cloudinary Upload`, `Package Dev Dependencies`, `Music & Heart Rain`, `Wedding Gate & Album`, `Guestbook & Store`, `Hero & Countdown`, `Fairytale Canvas`, `Live Love Reactions`, `Confetti`, `Scroll Love Spreader`, `Celebration Cannon`, `Sparkle Trail`, `Navigation`?**
  _High betweenness centrality (0.271) - this node is a cross-community bridge._
- **Why does `react-router-dom` connect `Guestbook & Store` to `App Shell & Cloudinary Upload`, `Package Dev Dependencies`, `Wedding Gate & Album`, `Hero & Countdown`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `Package Dev Dependencies`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _94 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Shell & Cloudinary Upload` be split into smaller, more focused modules?**
  _Cohesion score 0.08233117483811286 - nodes in this community are weakly interconnected._
- **Should `Package Dev Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07977207977207977 - nodes in this community are weakly interconnected._
- **Should `TypeScript Config` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._