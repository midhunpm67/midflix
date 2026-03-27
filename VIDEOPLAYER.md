# Design System Specification: Cinematic Immersion

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Auteur"**
This design system rejects the "catalogue" feel of traditional streaming interfaces in favor of a high-end, editorial experience. It is designed to feel like a private screening room—hushed, focused, and expensive. By leveraging high-contrast typography and deep, layered shadows, we move away from "grid-of-boxes" layouts toward an immersive narrative journey.

**The Editorial Shift:**
We break the template by using intentional asymmetry. Large-scale hero titles in `display-lg` should overlap content containers, creating a sense of physical depth. Navigation is not a "bar" but a floating lens, using frosted glassmorphism to bridge the gap between the UI and the cinematic content behind it.

---

## 2. Colors & Surface Architecture
The palette is rooted in the "Deep Black" philosophy, ensuring that the hardware (OLED screens) disappears and only the content remains.

### The Palette (Material Mapping)
- **Background**: `#72787c` (The Void - *Value derived from `neutral_color_hex`*)
- **Surface**: `#141414` (The Canvas)
- **Primary (Accent)**: `#05ace5` (Electric Cyan - *Value derived from `primary_color_hex`*)
- **Secondary (Supporting)**: `#547c93` (Cool Steel - *Value derived from `secondary_color_hex`*)
- **Tertiary (Highlight)**: `#e38d22` (Warm Amber - *Value derived from `tertiary_color_hex`*)
- **On-Surface**: `#E502E1` (Soft Silver-White)
- **Surface Variant**: `#353534` (Muted Charcoal for secondary depth)

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define sections.
Boundaries must be created through:
1.  **Tonal Shifts:** Placing a `surface_container_highest` (#353534) card against a `surface_dim` (#131313) background.
2.  **Vignetting:** Using radial gradients (from `transparent` to `surface_container_lowest`) to naturally draw the eye toward the center of a section.

### The "Glass & Gradient" Rule
Floating elements (Modals, Navbars, Tooltips) must use **Frosted Glassmorphism**:
- **Fill:** `surface` at 60% opacity.
- **Backdrop Blur:** 20px - 40px.
- **Signature Texture:** Apply a 3-5% film grain overlay across all surfaces to prevent "flat" digital banding and add a tactile, celluloid quality.

---

## 3. Typography: The Power of Scale
Our typography relies on the tension between the aggressive, vertical nature of **Bebas Neue** and the sophisticated, breathable clarity of **Plus Jakarta Sans**.

- **Display & Headlines (Epilogue):** (*Font family derived from `headline_font`*)
  - Used for Movie Titles and Hero Section headers.
  - **Character Spacing:** +2% to +5% for `display-lg` to enhance the "theatrical poster" aesthetic.
  - **Role:** Directs the user's focus with "loud" confidence.

- **Body & UI (Plus Jakarta Sans):** (*Font family derived from `body_font` and `label_font`*)
  - Used for synopses, metadata, and functional UI components.
  - **Role:** Provides a high-end, tech-forward contrast to the display type. It ensures legibility in dark environments.

---

## 4. Elevation & Depth: Tonal Layering
We do not use structural lines. We use physics.

### The Layering Principle
Depth is achieved by "stacking" surface tiers from the spacing and color scales:
- **Level 0 (Base):** `surface_dim` (#131313) for the main background.
- **Level 1 (Section):** `surface_container_low` (#1c1b1b) for content grouping.
- **Level 2 (Interaction):** `surface_container_highest` (#353534) for active or hovered states.

### Ambient Shadows
When an element must float (e.g., a "Watch Now" button or a Modal):
- **Shadow:** 0px 20px 40px rgba(0, 0, 0, 0.8).
- **Ghost Border Fallback:** If accessibility requires a border, use `outline_variant` (#5e3f3b) at **15% opacity**. Never 100%.

---

## 5. Components & Primitive Styling

### Buttons: The Primary Pulse
- **Primary State:** Solid `primary_container` (#05ace5). No border. White text. (*Color derived from `primary_color_hex`*)
- **Secondary State:** `surface_variant` with 40% opacity and a backdrop blur.
- **Interaction:** On hover, scale to **1.08** with a 200ms ease-out curve. Add a subtle outer glow (0px 0px 15px) using the `primary` color.

### Cinematic Cards
- **Corner Radius:** `8px` (Standard `DEFAULT` token). (*Value is `2` on a 0-3 scale for `roundedness`*)
- **Structure:** No dividers. Use `Spacing 4` (1.4rem) to separate the title from the metadata.
- **Hover:** Transition to `scale 1.08`. The image should slightly brighten while the background "vignette" on the card deepens to highlight the text.

### Navigation Lens (Global Nav)
- **Style:** A floating pill-shaped container using `full` (9999px) roundedness.
- **Material:** Glassmorphism (Surface @ 60% + 30px Blur).
- **Placement:** Either fixed top or a "breathing" floating dock at the bottom to maximize content real estate.

### Inputs & Search
- **Style:** Underline-only or ghost-style inputs. Use `surface_container_high` for the field background.
- **Focus State:** The underline transitions to `primary` (#05ace5) with a soft glow. (*Color derived from `primary_color_hex`*)

---

## 6. Do’s and Don'ts

### Do:
- **Use Intentional Negative Space:** Utilize `Spacing 16` (5.5rem) between major content rows to allow the "film grain" and background gradients to breathe.
- **Overlap Elements:** Let a movie poster's edge sit slightly behind a `display-lg` title to create a 3D space.
- **Prioritize Motion:** Every interaction (hover, click, scroll) should feel like a camera shutter—smooth, dampened, and intentional.

### Don’t:
- **Don't use 100% White:** Use `on_surface` (#e5e2e1) for text to prevent eye strain against the deep black background.
- **Don't use Dividers:** Never use a horizontal rule `<hr>` to separate list items. Use a background shift to `surface_container_low`.
- **Don't use Sharp Corners:** Avoid `none` (0px) roundedness; it feels too "brutalist" and breaks the cinematic flow. Stick to the `8px` standard. (*This is consistent with `roundedness: 2` which is not sharp*)
