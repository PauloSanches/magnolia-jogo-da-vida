---
name: Magnólia Backstage
description: Observed design tokens for the existing Backstage page; not a replacement for game styling.
colors:
  ink: "#284f45"
  pink: "#b72e60"
  paper: "#fffdf5"
  ground: "#dff0bd"
  soft: "#f7e7eb"
  line: "#c1cec2"
  selection: "#ffd34f"
  tools-divider: "#7b9c8f"
  workflow-divider: "#b72e6050"
typography:
  display:
    fontFamily: "DynaPuff,sans-serif"

    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-.025em"
  headline:
    fontFamily: "DynaPuff,sans-serif"

    fontWeight: 500
    lineHeight: 1.22
    letterSpacing: "-.025em"
  body:
    fontFamily: "Figtree,Arial,sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.65
  body-mobile:
    fontFamily: "Figtree,Arial,sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
  lead:
    fontFamily: "Figtree,Arial,sans-serif"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.55
  action:
    fontFamily: "Figtree,Arial,sans-serif"
    fontSize: "16px"
    fontWeight: 650
    lineHeight: 1.65
  navigation:
    fontFamily: "Figtree,Arial,sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.65
  caption:
    fontFamily: "Figtree,Arial,sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  action: "50px"
  phone: "26px"
  wide-image: "18px"
  local-node: "14px"
spacing:
  inline-small: "8px"
  item: "24px"
  gutter-mobile: "22px"
  gutter-medium: "32px"
  gutter-desktop: "48px"
  section-mobile: "52px"
  section-medium: "64px"
  section-desktop: "80px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.action}"
    rounded: "{rounded.action}"
    padding: "13px 24px"
  button-primary-hover:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.paper}"
  navigation:
    textColor: "{colors.ink}"
    typography: "{typography.navigation}"
  navigation-hover:
    textColor: "{colors.pink}"
  text-link:
    textColor: "{colors.ink}"
  text-link-hover:
    textColor: "{colors.pink}"
  local-node:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.local-node}"
    padding: "24px 18px"
  tools-section:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  workflow-section:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
  phone:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.phone}"
    width: "240px"
---

# Design System: Magnólia Backstage

## Overview

This document records the existing implementation in `docs/backstage/backstage.css`, with component markup checked against `docs/backstage/index.html`. It documents the approved Backstage surface only. `PRODUCT.md` and `editorial/backstage-design.md` establish preservation of the game's colors, fonts and illustrations and separation of the Backstage route from the game.

The frontmatter is the token reference for Backstage. The game remains governed by unchanged `docs/style.css`: its pink is `#cc3f72`, while Backstage's implemented pink is the `pink` token above (`#b72e60`). The editorial brief describes the inherited game pink; the actual Backstage stylesheet is authoritative for this extraction. Ink, paper, ground, selection color and the local DynaPuff/Figtree families are shared. The inherited cream paper is intentional, not a defect. Backstage's scrolling document and typography do not replace the game's fixed stage, balloons, controls or animation rules.

**Key Characteristics:**
- Local DynaPuff headings and Figtree body text.
- Paper page, ink text, pink emphasis and ground/soft section backgrounds.
- Responsive reading grids, real game screenshots and an HTML architecture diagram.

No new qualitative branding, color ramps or unimplemented components are introduced. The sidecar extends these tokens with observed motion, breakpoints, depth and isolated component examples.

## Colors

### Primary
- `ink`: body text, primary action background, tools-section background and phone border.
- `pink`: heading emphasis, link hover, focus outline, play-link underline, diagram arrows and workflow numbers.

### Neutral and supporting surfaces
- `paper`: page, phone and skip-link backgrounds; primary action and tools-section text.
- `ground`: screenshot surround, local architecture node, tools terms and closing section.
- `soft`: workflow section background.
- `line`: header, image, architecture and engineering dividers.
- `tools-divider`: borders above tool descriptions.
- `workflow-divider`: translucent borders above workflow steps.
- `selection`: selected text background, paired with ink text.

Color names preserve the source custom-property names where present. Supporting literal colors use descriptive usage keys. No generated tonal scale is implied.

## Typography

DynaPuff and Figtree are loaded from local TrueType files with `font-display:swap`; their declared weight ranges are 400–700 and 300–900 respectively. Headings use the display/headline tokens with balanced wrapping. Display size is `clamp(44px,5.5vw,80px)` and headline size is `clamp(28px,3vw,42px)`. These exact fluid expressions are preserved in sidecar typography metadata rather than flattened to fixed sizes: the installed DESIGN.md CLI rejects `clamp()` as a frontmatter dimension. Body, lead, action, navigation and caption tokens include inherited body properties where applicable.

At the mobile breakpoint, body uses `body-mobile`, lead text becomes 19px and navigation text becomes 14px. The brand is DynaPuff at 500 25px/1.15, reduced to 22px on mobile; its subtitle is Figtree at 500 12px/1.6. Reading content is capped at 65ch, tool descriptions and engineering items at 55ch. This is an observed role set, not an invented ratio-based type scale.

## Layout

The header/footer max-width is 1320px; hero and sections are 1240px; the wide screenshot is 1144px. Default section padding combines `section-desktop` and `gutter-desktop`. The hero uses `1.3fr 1fr`, a 70px gap and `72px 48px 88px` padding; reading sections use `1fr 1.3fr` with an 80px gap. Actions wrap in a flex row. Tools use two columns, component descriptions five, workflow six and engineering items two.

- At `min-width:1500px`, hero gap becomes 110px and its screenshot surround is capped at 390px.
- At `max-width:1000px`, gutters become 32px, section vertical padding 64px, hero gap 36px and reading gap 40px. Component descriptions and workflow become three columns.
- At `max-width:700px`, hero, reading, tools, architecture and engineering become single-column. Component descriptions and workflow use two columns. Section padding is `52px 22px`; hero padding is `46px 22px 52px`. The screenshot surround is capped at 360px and the phone width is 215px. Architecture arrows rotate 90 degrees; workflow copy stops using columns. The first header navigation link is hidden, closing actions stack and footer content wraps.

Spacing keys are labels for observed recurring values, not additional CSS custom properties. Breakpoint directions and responsive rules also live in the sidecar.

## Elevation & Depth

The phone screenshot has the sole Backstage box shadow: `0 18px 36px #284f4526`. Other separation comes from background changes and borders rather than additional shadows. The phone border is 7px solid ink; general dividers are 1px, and the play underline and workflow step borders are 2px. The sidecar records the shadow without adding a nonstandard frontmatter group.

## Shapes

Actions use the action radius, the phone uses the phone radius, wide screenshots use the wide-image radius and the local architecture node uses the local-node radius. The screenshot surround has the distinct compound radius `50% 50% 28px 28px`; it is not a generic card radius. The phone clips its image with `overflow:hidden`. These Backstage shapes do not redefine game balloons or circular game controls.

## Components

- **Primary action:** an anchor with the button-primary tokens, inline-flex alignment, 28px internal gap and 52px minimum height. Hover changes its background to pink. Background and color transitions are `.18s`; there is no authored active-state variant.
- **Text action:** underlined Figtree link, 16px/600, minimum height 44px, 8px icon gap. Hover changes text to pink.
- **Navigation:** flex row with 32px gap, un-underlined links and 44px minimum link height. The play link adds a 2px pink bottom border and 20px internal gap. Mobile navigation uses an 18px gap and hides its first link.
- **Keyboard access:** anchors receive a 3px solid pink `:focus-visible` outline with 6px offset. The fixed skip link is translated above the viewport until focused; its stacking level is 10.
- **Local architecture node:** ground background, local-node radius and a vertical flex stack. At the medium breakpoint its strong text is 16px and supporting text 13px; mobile uses 19px/15px, centered alignment, full width and 12px padding.
- **Workflow:** numbered list rendered with CSS counters, pink DynaPuff numbers, translucent pink top borders and responsive six/three/two-column layout. It is not an interactive control.
- **Evidence images:** fluid images with automatic height; the hero phone has the border/shadow above, while wide screenshots have a line border and rounded corners.

The page has no input fields or chips. The sidecar examples extract existing components rather than introducing those primitives. Default smooth anchor scrolling becomes automatic under `prefers-reduced-motion:reduce`; all transitions are disabled in that media query. No game animation behavior is inferred from this Backstage rule.

## Do's and Don'ts

- Do preserve the implemented Backstage tokens and local font families.
- Do retain responsive layouts, visible keyboard focus and the reduced-motion override.
- Do keep the game stylesheet and its different pink scoped to the game.
- Don't replace the inherited cream paper or recolor existing illustrations.
- Don't apply Backstage heading sizes, spacing or component styles to game controls.
- Don't treat documentation snippets as new website features or generated color ramps as existing tokens.
