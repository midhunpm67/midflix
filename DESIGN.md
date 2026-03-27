Design a premium, production-grade streaming platform UI (web + mobile) 
inspired by Netflix and JioCinema/Hotstar. The design must feel 
cinematic, immersive, and world-class.

─────────────────────────────────────────
VISUAL IDENTITY & THEME
─────────────────────────────────────────
- Color palette: Deep cinematic black (#0A0A0A) as base, not pure 
  black. Use rich charcoal (#141414) for surfaces. Accent with a bold 
  signature color — choose ONE: electric crimson (#E50914, Netflix-red), 
  royal blue-violet (#6C63FF), or molten gold (#F5A623). 
  Never use more than one accent.
- All UI is DARK MODE only. No light mode.
- Backgrounds must have depth — use subtle radial gradients, 
  film grain texture overlays (3–5% noise), and vignetting on 
  hero sections.
- Glassmorphism only where intentional — frosted nav bars, 
  modal overlays. Never overuse.

─────────────────────────────────────────
TYPOGRAPHY
─────────────────────────────────────────
- Display / Hero font: "Bebas Neue" or "Clash Display" or 
  "Anton" — bold, condensed, cinematic.
- Body / UI font: "DM Sans" or "Syne" or "Plus Jakarta Sans".
- NO Inter, Roboto, or Arial.
- Hero titles: 72–96px, letter-spacing -2px, all caps or 
  sentence case only.
- Card titles: 14–16px, medium weight, tight tracking.
- Meta info (genre, year, rating): 12px, muted (#888), uppercase.

─────────────────────────────────────────
LAYOUT PRINCIPLES
─────────────────────────────────────────
- Full-bleed hero section (100vw × 85–100vh) with a content 
  poster/backdrop filling the screen. Add a left-to-right dark 
  gradient overlay so text is readable.
- Content rows are horizontally scrollable carousels — 
  Netflix-style. Titles: 16px bold, above each row.
- Card aspect ratio: 16:9 for landscape (shows), 2:3 for 
  portrait (movies). Rounded corners: 8px.
- Card hover: scale(1.08), reveal title + play button + 
  metadata. Smooth 200ms ease-out transition.
- Grid layout for search/browse: masonry or uniform 
  3–4 column grid. No list views.
- Navigation: fixed top bar, transparent-to-black scroll 
  gradient. Logo left, nav links center, profile right.

─────────────────────────────────────────
KEY SCREENS TO DESIGN
─────────────────────────────────────────
1. HOME PAGE
   - Full-bleed hero with featured content, animated title 
     card, play + "More info" CTA buttons
   - 5–6 content carousels: "Trending Now", "Continue Watching",
     "New Releases", "Top 10", genre rows
   - Top 10 row shows ranking numbers (large, semi-transparent)

2. CONTENT DETAIL PAGE
   - Full-width backdrop image with gradient
   - Title, rating, year, duration, genre tags
   - Play button (primary), Download, Add to Watchlist, Share
   - Episode list (if series), Similar content row
   - Cast section with circular avatars

3. VIDEO PLAYER
   - Full-screen, minimal UI
   - Controls appear only on hover: progress bar (with 
     preview thumbnails on hover), play/pause, volume, 
     10s forward/back, subtitles, quality selector, 
     fullscreen
   - Progress bar accent color matches brand accent
   - "Next Episode" card slides in at 90% completion

4. BROWSE / SEARCH PAGE
   - Trending searches as chips
   - Content grid, 4 columns on desktop, 2 on mobile
   - Filter bar: Genre, Language, Year, Rating, Type

5. SUBSCRIPTION / PAYWALL PAGE
   - 3 plan cards (Basic, Standard, Premium)
   - Highlight the recommended plan with a golden border 
     and "Most Popular" badge
   - Feature comparison table below
   - Trust signals: "Cancel anytime", "HD/4K available"

6. MOBILE APP (extra)
   - Bottom tab nav: Home, Search, Downloads, Profile
   - Portrait poster cards in a horizontal scroll
   - Swipeable hero banner (3–5 slides, auto-advance)
   - Floating mini-player when navigating away

─────────────────────────────────────────
COMPONENTS LIBRARY
─────────────────────────────────────────
Design these as reusable components:
- ContentCard (landscape + portrait variants)
- HeroBanner
- CarouselRow with arrows
- VideoPlayer controls overlay
- EpisodeListItem
- SubscriptionPlanCard
- ProfileSwitcher (Netflix-style multi-profile)
- RatingBadge (IMDb-style, age rating)
- GenreTag / pill chip
- ProgressBar (for Continue Watching)
- ModalSheet (for mobile bottom sheets)

─────────────────────────────────────────
MOTION & INTERACTION
─────────────────────────────────────────
- Page transitions: fade + slight upward slide (300ms ease)
- Card hover: scale + shadow + reveal (200ms ease-out)
- Carousel: smooth momentum scroll with snap
- Hero background: slow Ken Burns pan (20s loop)
- Skeleton loaders: shimmer animation on card placeholders
- Player progress bar: smooth scrub with preview thumbnails
- Notification toasts: slide in from top-right, auto-dismiss

─────────────────────────────────────────
PLATFORM SPECS
─────────────────────────────────────────
Web:
- Breakpoints: 320px, 768px, 1024px, 1440px, 1920px
- Max content width: 1400px centered
- Card widths in carousel: auto-calculated based on 
  viewport (show 3.5 cards on desktop, 2.2 on tablet, 
  1.5 on mobile to hint scrollability)

Mobile (iOS + Android):
- Safe area insets respected
- Status bar: transparent, white icons
- 44px minimum touch targets
- Swipe gestures: horizontal for carousels, 
  vertical for browse scroll
- Haptic feedback on key actions (play, add to list)

─────────────────────────────────────────
TONE REFERENCE
─────────────────────────────────────────
- Feel: cinematic luxury, confident, premium
- NOT: playful, colorful, cartoonish, flat/material
- Reference: Netflix (confidence), Apple TV+ (restraint), 
  JioCinema (vibrancy + density), Disney+ Hotstar (content-rich)
- The UI should feel like the content is the hero — 
  the interface is invisible, serving only the content.