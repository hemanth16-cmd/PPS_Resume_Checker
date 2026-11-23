---
name: Academic Editorial Portal
colors:
  surface: '#f8f9fd'
  surface-dim: '#d8dade'
  surface-bright: '#f8f9fd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3f7'
  surface-container: '#eceef2'
  surface-container-high: '#e7e8ec'
  surface-container-highest: '#e1e2e6'
  on-surface: '#191c1f'
  on-surface-variant: '#42474c'
  inverse-surface: '#2e3134'
  inverse-on-surface: '#eff1f5'
  outline: '#72787d'
  outline-variant: '#c2c7cd'
  surface-tint: '#416279'
  primary: '#315369'
  on-primary: '#ffffff'
  primary-container: '#4a6b82'
  on-primary-container: '#d0eaff'
  inverse-primary: '#a9cbe5'
  secondary: '#436278'
  on-secondary: '#ffffff'
  secondary-container: '#c3e4fe'
  on-secondary-container: '#47667d'
  tertiary: '#2a5841'
  on-tertiary: '#ffffff'
  tertiary-container: '#427158'
  on-tertiary-container: '#c0f3d3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c8e6ff'
  primary-fixed-dim: '#a9cbe5'
  on-primary-fixed: '#001e2e'
  on-primary-fixed-variant: '#284a60'
  secondary-fixed: '#c8e6ff'
  secondary-fixed-dim: '#abcae4'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#2b4a5f'
  tertiary-fixed: '#bbeecf'
  tertiary-fixed-dim: '#a0d2b3'
  on-tertiary-fixed: '#002112'
  on-tertiary-fixed-variant: '#204f38'
  background: '#f8f9fd'
  on-background: '#191c1f'
  surface-variant: '#e1e2e6'
typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 3rem
    fontWeight: '400'
    lineHeight: 3.5rem
  display-lg-mobile:
    fontFamily: Newsreader
    fontSize: 2.25rem
    fontWeight: '400'
    lineHeight: 2.75rem
  headline-lg:
    fontFamily: Newsreader
    fontSize: 2rem
    fontWeight: '400'
    lineHeight: 2.5rem
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 1.625rem
    fontWeight: '400'
    lineHeight: 2.125rem
  headline-md:
    fontFamily: Newsreader
    fontSize: 1.5rem
    fontWeight: '500'
    lineHeight: 2rem
  headline-sm:
    fontFamily: Newsreader
    fontSize: 1.25rem
    fontWeight: '500'
    lineHeight: 1.75rem
  title-md:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.625rem
  title-sm:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Newsreader
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-md:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '600'
    lineHeight: 1.125rem
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
  metric-display:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.25rem
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system embodies an editorial, academic, and quietly authoritative environment tailored for career preparation, professional placement tracks, and university-level vocational guidance. It deliberately avoids high-velocity corporate tech aesthetics, neon highlights, floating glass treatments, and synthetic AI metaphors. Instead, it mirrors the atmosphere of a curated university archive, scholarly syllabus, and dignified literary publication.

### Core Character
- **Restrained & Intellectual**: Layouts prioritize substantive content, typography-led hierarchy, and structured pedagogical cadence over decorative visual noise.
- **Calm & Humane**: Low-stimulus backgrounds and warm neutrals eliminate interface anxiety for students undergoing placement assessments, resume parsing, and interview coaching.
- **Structured Rigor**: Precise 1px warm structural rules, uniform grid divisions, and systematic typographic tiers foster clarity, analytical focus, and trust.

## Colors

The palette draws strictly from natural paper tones, slate stone, library bindings, and archival inks. All surfaces reject sterile digital whites (#FFFFFF) in favor of warm, low-contrast ivory and linen shades to support long reading sessions and complex metric evaluations.

### Palette Architecture
- **Surface Canvas (`#FBFBFA`)**: The global page background. Emulates fine, unbleached, high-rag academic paper.
- **Surface Recessed / Tier 2 (`#F5F5F3`)**: Sub-cards, table headers, inactive sidebars, and nested metric containers.
- **Surface Border (`#E6E4DF`)**: Subtle 1px dividing lines and field strokes that offer architectural structure without visual dominance.
- **Deep Charcoal Text (`#1E2124`)**: Primary high-contrast body and heading ink, softer than pure black to prevent eye strain.
- **Muted Ink Secondary (`#5A6065`)**: Auxiliary labels, captions, metadata footnotes, and secondary states.
- **Mist Blue / Slate Primary (`#4A6B82` / `#3B5A70`)**: Grounded academic blue for primary interactive commands, focused states, and current module anchors.
- **Status Ecosystem**:
  - *Completed / Validated*: Muted Sage Green (`#4E7D63`) paired with soft linen-sage tint (`#EBF3EE`).
  - *Pending / Active Progress*: Warm Ochre Amber (`#A87438`) paired with soft ivory-amber tint (`#FBF4EA`).
  - *Critical / Incomplete / Low Match*: Warm Burnt Red (`#9E4343`) paired with soft blush-tint (`#FDF2F2`).

## Typography

The typographic hierarchy establishes a dialogue between institutional tradition and analytical precision:
- **Newsreader (Display, Headline, Editorial Body)**: Delivers an authoritative, considered publication texture. Used for placement overview headings, interview reflection essays, syllabus titles, and formal module dossiers. It brings human editorial warmth to an otherwise clinical training environment.
- **Inter (Technical Body, Tables, Dashboards, Controls)**: Supplies high-legibility typographic hygiene for dense student progress ledgers, ATS keyword metrics, cohort comparison tables, and user input mechanisms.
- **Numbers and Metrics**: ATS scores, cohort percentiles, and timeline dates are rendered in Inter with tabular numeric alignment enabled to ensure vertical column consistency.

## Layout & Spacing

The portal is governed by a column-based layout grounded in editorial magazine grids, balancing dense analytical panels with generous resting whitespace.

### Grid & Breakpoints
- **Desktop (1200px and up)**: 12-column grid, max-width constrained to 1320px for optimal reading column lengths. Margins set to 3rem, column gutters fixed to 1.5rem.
- **Tablet (768px - 1199px)**: 8-column layout, fluid margins scaling between 1.5rem and 2rem, 1rem gutters.
- **Mobile (Up to 767px)**: 4-column layout, compact margins at 1.25rem, 0.75rem gutters. Complex multi-metric tables reflow into stacked cards with clear border delimiters.

### Spatial Rhythm
- Group logically bound data units (e.g., student name, matriculation ID, match score) with compact internal padding (`space-xs` to `space-sm`).
- Separate independent analytical regions (e.g., ATS Diagnosis vs. Mock Interview Performance) using formal editorial sections separated by `space-xl` and bounded by subtle 1px dividers.

## Elevation & Depth

Visual hierarchy rejects exaggerated drop shadows, glowing halos, and frosted blur membranes. Depth is expressed exclusively through tonal planar layering and crisp boundary definitions reminiscent of architectural paper mockups.

### Layering Mechanics
- **Base Canvas**: Solid `#FBFBFA`.
- **Level 1 (Cards, Metric Modules, Dossiers)**: Background set to `#FFFFFF` with a mandatory 1px border of `#E6E4DF`. Shadows are omitted entirely or restricted to an imperceptible, diffuse contact tone: `box-shadow: 0 1px 2px rgba(30, 33, 36, 0.04)`.
- **Level 2 (Active States, Context Menus, Hover Panes)**: Background set to `#FFFFFF` resting on a dual-stage neutral shadow: `box-shadow: 0 4px 12px rgba(30, 33, 36, 0.06), 0 1px 3px rgba(30, 33, 36, 0.04)`. Border remains `#E6E4DF`.
- **Structural Inset / Recessed Canvas**: Panels indicating inactive tracks or sub-metrics utilize a background of `#F5F5F3` with a fine inset or perimeter boundary.

## Shapes

The portal adheres to a soft, structured, institutional shape system (`roundedness: 1`). Corner radii are deliberately small to evoke trimmed bond paper, catalog cards, and study binder dividers. Large pill containers and spherical bubbles are avoided, except in compact status chips where slight softness reinforces utility.

### Corner Radius Standards
- Base components (cards, text fields, tables, modular blocks): `0.25rem` (4px).
- Intermediate overlays (modals, dropdown popovers): `0.375rem` (6px).
- Status and category chips: `0.25rem` (4px) or fully bound subtle pill form for metadata tokens.

## Components

### Buttons
- **Primary Action**: Solid `#4A6B82` background, `#FFFFFF` text, `0.25rem` border radius. Hover transitions to `#3B5A70`. Focus state rings with a 2px offset in `#4A6B82`. No shadow.
- **Secondary / Outline Action**: Transparent background, 1px `#E6E4DF` border, `#1E2124` text. Hover shifts to `#F5F5F3` background with a `#3B5A70` border stroke.
- **Text / Tertiary Action**: Transparent, deep charcoal text with an underline appearing solely on hover; provides a scholarly citation feel.

### Status, ATS, & Module Badges
Badges are non-glossy, low-saturation data labels using flat tinted fills and high-contrast ink:
- **Completed / Placement Verified**: `#EBF3EE` background, `#4E7D63` text, 1px border `#4E7D63` (20% opacity).
- **In Progress / Assessment Scheduled**: `#FBF4EA` background, `#A87438` text, 1px border `#A87438` (20% opacity).
- **Action Required / Low ATS Match**: `#FDF2F2` background, `#9E4343` text, 1px border `#9E4343` (20% opacity).
- **Module & Cohort Track**: `#F5F5F3` background, `#1E2124` text, 1px border `#E6E4DF`.

### Data Cards & ATS Performance Modules
- Encased in a pure white `#FFFFFF` surface with a crisp 1px `#E6E4DF` stroke.
- Cards feature an optional editorial masthead: a small serif category label, a 1px divider, followed by metrics rendered in Inter tabular figures alongside Newsreader qualitative descriptions.
- No floating cards or hover-tilt micro-interactions.

### Input Fields & Search Controls
- Background `#FFFFFF`, 1px boundary `#E6E4DF`. 
- Focus transitions the border to `#4A6B82` with a subtle outline offset. Placeholder text rendered in `#8A9096`.
- Typography within fields relies on `body-md` (Inter).

### Lists & Placement Tables
- Row dividers are strictly 1px horizontal borders (`#E6E4DF`). Alternating zebra fills are disabled.
- Table headers utilize `#F5F5F3` background with `label-sm` tracking and muted ink (`#5A6065`).
- Hover row state shifts subtly to `#FBFBFA`.

### Iconography
- Crisp, 1.25px to 1.5px stroke weight, monochrome line icons (`#1E2124` or `#5A6065`).
- Icons must never serve as decorative filler; they strictly accompany metadata, download targets, syllabus files, and assessment statuses.