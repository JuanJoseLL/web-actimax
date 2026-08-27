# Destinos Actimax × WOPU — full route package

Extract this ZIP into the root of:
C:\Users\pauli\Projects\web-actimax-destinos

It contains:
- src/app/destinos/page.tsx
- src/app/destinos/DestinosClient.tsx
- src/app/destinos/data.ts
- src/app/destinos/destinos.module.css
- src/app/api/destinos/lead/route.ts

Notes:
- Destination card/modal images are intentional placeholders.
- Google Reviews are intentional placeholders until the live source is connected.
- Email sending is coded but requires RESEND_API_KEY and DESTINOS_FROM_EMAIL.
- DESTINOS_PUBLIC defaults to false/noindex. It should become true only at launch.
- The normal Actimax header remains. On /destinos, the normal Actimax footer and global WhatsApp button are hidden after the Destinos client mounts, and the Destinos-specific footer/WhatsApp are shown.


V2 additions:
- Real Actimax and WOPU SVG logos (white + blue variants).
- Real project WhatsApp icon in hero and floating action.
- Modal secondary CTA contrast corrected to white text on navy.
- Website / Instagram / email icons restored in WOPU section.
- "Elige tu próximo destino" helper copy moved under the title.
- Live EUR/COP informational reference card using:
  EUR/USD European Central Bank × USD/COP Colombia TRM.
- New API route: src/app/api/destinos/exchange-rate/route.ts


V3 additions:
- Yellow CTA text changed to Actimax blue.
- “Qué incluye” duplicated second numbers replaced with plane, bed, ticket and people icons.
- Experiences reordered chronologically, with Barcelona first.
- Barcelona dates corrected to 11–20 March 2027.
- Added Grandes Batallas · Francia y Bélgica · cycling · 340 KM.
- Grandes Batallas dates: 8–19 July 2027; estimated price: €5,800.
- Card price label changed to “PRECIO ESTIMADO”.
- WOPU website link changed to https://woputravel.com/es/.
- Form CTA centered.
- Modal and form CTA wording changed to “Quiero más información”.
- 2027 season seal redesigned as a vintage/adventure postal stamp.


V4 final visual polish:
- All yellow primary CTAs now explicitly use Actimax blue text, including yellow links inside dark sections.
- Hero brand lockup tightened and centered beneath the CTA group; "RENDIMIENTO + OPERACIÓN" moved closer to the logos.
- 2027 seal keeps the existing page background and uses vintage postal-stamp linework/ink styling instead of a sepia fill.


V5 hero alignment:
- The CTA buttons and the Actimax × WOPU lockup now share one intrinsic-width
  container.
- The brand lockup is centered specifically under the CTA button group rather
  than under the wider hero content area.
- The current 2027 seal remains only as a temporary visual until Destinos
  Studio exposes a replaceable/editable seal asset.
