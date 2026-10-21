---
name: Magnólia Backstage
description: Implemented engineering-editorial design for docs/backstage/ only; game styling is independent.
colors:
  surface: "#ffffff"
  surface-subtle: "#f6f8fa"
  ink: "#18212b"
  muted: "#52606d"
  line: "#d8dee4"
  accent: "#0969da"
  selection: "#ddedff"
  structural: "#8c98a5"
typography:
  display:
    fontFamily: "Figtree,Arial,sans-serif"
    fontWeight: 650
    lineHeight: 1.08
    letterSpacing: "-.035em"
  headline:
    fontFamily: "Figtree,Arial,sans-serif"
    fontSize: "30px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-.025em"
  body:
    fontFamily: "Figtree,Arial,sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.7
  body-mobile:
    fontFamily: "Figtree,Arial,sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  lead:
    fontFamily: "Figtree,Arial,sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.6
  action:
    fontFamily: "Figtree,Arial,sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.7
  navigation:
    fontFamily: "Figtree,Arial,sans-serif"
    fontSize: "14px"
    fontWeight: 550
    lineHeight: 1.7
  caption:
    fontFamily: "Figtree,Arial,sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  surface: "6px"
  image: "4px"
  focus: "2px"
spacing:
  space-1: "8px"
  space-2: "16px"
  space-3: "24px"
  space-4: "32px"
  space-5: "48px"
  space-6: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.action}"
    rounded: "{rounded.surface}"
    padding: "11px 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
  text-link:
    textColor: "{colors.ink}"
  text-link-hover:
    textColor: "{colors.accent}"
  navigation:
    textColor: "{colors.ink}"
    typography: "{typography.navigation}"
  contents:
    textColor: "{colors.muted}"
  local-node:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "16px 12px"
  evidence:
    backgroundColor: "{colors.surface-subtle}"
    rounded: "{rounded.surface}"
    padding: "24px"
---

# Design System: Magnólia Backstage

## Overview

A sober software-engineering article: white surface, graphite hierarchy, slate supporting text and blue interaction states. This replaces the former playful Backstage world, following `editorial/backstage-design.md`. Source of truth: `docs/backstage/backstage.css` and `docs/backstage/index.html`.

Scope is exclusively `docs/backstage/`. The illustrated game retains its own colors, fonts and behavior in `docs/style.css`; the real game captures retain their original appearance. No new branding, components or tonal ramps are inferred.

**Key Characteristics:**
- Local Figtree throughout, restrained rectangular controls and fine rules.
- Desktop contents navigation beside a readable article; mobile single-column reading.
- Genuine screenshot evidence, semantic architecture and ordered delivery workflow.

## Colors

### Primary
`ink` provides text and primary-action fill. `accent` is reserved for link hover, button hover and keyboard focus; headings remain graphite.

### Neutral
`surface` is the page and button text; `surface-subtle` groups evidence, the human-direction note and local execution node. `muted` supports captions and descriptions; `line` separates sections and frames evidence. `structural` records the existing literal used for the scrollbar thumb and local-node border. Selected text uses `selection` with `ink`.

## Typography

Figtree is self-hosted at `docs/assets/fonts/Figtree.ttf`, variable weight 300–900, with `font-display:swap` and Arial/sans-serif fallbacks. No DynaPuff is loaded by Backstage.

The display size is `clamp(36px,4.6vw,64px)`, capped at 18ch. At widths ≤900px it is 52px; ≤600px uses `clamp(34px,9.4vw,46px)` and 1.12 line-height. Fluid expressions are retained in sidecar metadata, not flattened into fixed frontmatter dimensions. Balanced section headings have a 31ch cap; on mobile they use 26px, 1.25 line-height and -.02em tracking. Lead text becomes 18px on mobile. Paragraphs cap at 72ch; reading wrappers at 74ch. Workflow numerals use tabular figures, not a monospace display face.

## Layout

Header, content and footer cap at 1280px with 40px horizontal padding. The content grid is `184px minmax(0,1fr)` with a 64px gap and 64px top padding. Contents navigation is sticky at 32px, scrollable within `calc(100dvh - 64px)`. Sections use 56px vertical padding. Actions wrap; evidence uses a 1:2.4 grid; tool and responsibility rows use 160px labels with 24px gaps. Workflow uses three columns.

- ≤1100px: 32px gutters, 156px contents column and 40px gap; architecture becomes vertical, with rotated connectors; evidence padding/gap become 16px.
- ≤900px: contents hidden, article/header/footer capped at 824px, 48px section and top spacing; evidence ratio becomes 1:2.2.
- ≤600px: 20px gutters, 40px section and top spacing; only Play remains in header navigation. Evidence stacks, with the mobile capture and caption beside each other. Definition rows stack; workflow uses two columns; footer wraps.

Spacing primitives preserve the declared `--space-1` through `--space-6` values; rules currently repeat literal measurements rather than consuming these variables.

## Elevation & Depth

No box shadows. One-pixel borders and subtle neutral surfaces supply separation. The local execution node has a stronger neutral border, not a raised card treatment.

## Shapes

Controls, evidence group, note and architecture nodes share the surface radius. Screenshots use the image radius; the phone capture clips overflow. No organic screenshot surround, pill actions or device-mockup shadow remains.

## Components

- **Primary action:** real game anchor, 48px minimum height, 24px internal gap; blue background/border on hover. Transition: background and border-color, .16s ease-out. Mobile: 14px type, 16px horizontal padding/gap.
- **Text action:** underlined repository anchor, 15px/550, 48px minimum height and 12px gap; mobile 14px and 8px gap.
- **Header navigation:** 44px minimum link height, 32px gap; Play adds a one-pixel border and 16px horizontal padding. Mobile gap is 16px, type 13px, Play padding 12px.
- **Contents:** labeled section anchors, 14px/1.4, 44px minimum targets; muted at rest, blue and underlined on hover. No active-section tracking is implemented.
- **Architecture:** labeled HTML group with four nodes and decorative connectors. Desktop node headings are 15px/1.35; supporting text 13px/1.45. At ≤1100px padding becomes 20px, heading 17px and supporting text 14px.
- **Workflow:** semantic six-step ordered list, fine top rules, two-digit CSS counters; not interactive.
- **Evidence:** two genuine lazy-loaded images with intrinsic dimensions, alternative text and captions. Provenance stays in `editorial/backstage-assets.json`.

All anchors have a 2px blue `:focus-visible` outline, 5px offset and focus radius. A fixed skip link appears on focus. Smooth anchor scrolling uses 32px scroll padding; reduced motion switches scrolling to auto and disables transitions. There are no forms, loading/error widgets, chips or authored active/disabled action variants.

## Do's and Don'ts

- Do preserve the implemented neutral palette, local Figtree and visible keyboard focus.
- Do keep screenshot evidence and semantic diagrams readable across breakpoints.
- Do keep Backstage styles isolated from the illustrated game.
- Don't restore the superseded playful Backstage palette, display font or organic frames.
- Don't recolor evidence images or change approved narrative to suit the layout.
- Don't invent token ramps, component states or application behavior absent from the source.
