# Backstage v2: engineering article

Scope: `docs/backstage/v2/`. The existing `/backstage/` route and game remain independent. This is an extension of the established system in `DESIGN.md`, not a visual redesign.

## Preserved system

Local Figtree; white, graphite and slate with restrained blue interactions; existing body/heading hierarchy and responsive article/sidebar frame. The mobile and desktop screenshots preserve their original bytes and colors. The six-step Hairline tour, controller and vendored library are copied unchanged from the baseline revision df26a17e36b3b80a5c8c1f1ac18999a03ecb6b27, with their license.

## V2 additions

- Runtime figure distinguishes static hosting from browser responsibilities, without mixing in the development agents.
- State figure presents the simplified writing/reading/question sequence with a caption that keeps cross-house navigation manual.
- Delivery figure separates expected revision, served artifact and public behavior checks.
- Scrollable code excerpt uses system monospace, a caption and visible keyboard focus.
- Source links point to the reviewed baseline revision, not a moving branch.
- Native details/summary contents on screens up to 900px; one-column links up to 600px.
- Historical metrics live in delivery evidence, not the hero.
- Print rules replace the animated workflow with its static fallback.

All additions use existing color/radius tokens. New SVG arrows are decorative; meaning remains in selectable text and figure captions. The base stylesheet only relocates its self-hosted font URL to the v2 asset directory. The overlay stylesheet is `v2.css`.

## Approval and evidence

The exact approved article is in `editorial/backstage-v2-copy.json`; publication approval and permitted draft-to-public wrapper changes are in `editorial/backstage-v2-approval.json`. Main copy is marked `data-case-copy` and verified against the fixture. The v2 route has its own canonical/share metadata; draft-only labels are removed for publication.

The preview passed browser checks across 11 widths, including keyboard/mobile contents, plus the original autoplay harness at mobile/desktop sizes and reduced motion. Independent technical and visual review found no remaining material blocker after a documentation-only finding was resolved. These records do not substitute for post-deployment public verification.

Do not add audience, productivity, uptime or ROI claims. Keep frozen historical metrics separate from new editorial commits. Do not ship local audit outputs, review captures, private helpers or credentials.
