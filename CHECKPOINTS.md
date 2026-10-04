# Checkpoints

## 1 — Repository audit

Completed: inspected D:\Madinum including hidden entries; the workspace is empty. No package manifest, lockfile, routes, styles, database, auth, tests, assets, Git repository, or project instructions exist to preserve or extend. Read both supplied briefs.

Architecture decisions: one Next.js application and PostgreSQL/Prisma as requested. Sites' Worker starter does not match the specified stack; do not substitute SQLite or mock persistence.

Files affected: README.md, CHECKPOINTS.md; package.json and .gitignore begin phase 2.

Validation: TypeScript, lint, tests, build: N/A (no application existed). Functional inspection: PASS (empty workspace confirmed).

Issues found: no PostgreSQL runtime or connection configured; no supplied brand asset found among the two text attachments. No npm executable on PATH; bundled pnpm is available.

Issues resolved: located Node 24 and bundled pnpm; registry access verified after requesting network permission.

Complexity review: no existing code to remove or consolidate. Avoid monorepo packages, generic repositories, global state, and unused UI libraries.

Known non-blocking items: PostgreSQL needed by phase 4. Logo supplied during phase 3 and integrated from the original JPEG.

Technical debt introduced: NONE.

Ready for next phase: YES.

## 2 — Architecture and dependencies

Goal: establish the smallest runnable, typechecked production foundation.

Existing systems affected: package.json and documentation only.

Expected files: Next.js entry layout/page, TypeScript config, ESLint config, framework type declarations, lockfile.

Data model impact: none. API impact: none. UI impact: minimal foundation page, not final marketing or completed product.

Risks: installation and framework compatibility. Dependencies: Next.js, React, React DOM; TypeScript and ESLint tooling only. Add Prisma with the database phase, validation with first domain input, and map/motion packages only when used.

Test plan: strict typecheck, lint, production build, HTTP smoke check. Business logic tests begin when business logic exists.

Completed: minimal server-rendered Next.js foundation with pinned dependencies and lockfile.

Validation: TypeScript PASS; lint PASS; production build PASS; HTTP smoke PASS (200, Arabic language, RTL direction, brand content); dependency peer check PASS. Tests: N/A, no business logic yet.

Issues resolved: latest TypeScript 7 and ESLint 10 exceeded framework plugin peer ranges. Pinned compatible TypeScript 6.0.2 and ESLint 9.39.5; Node type definitions match runtime major 24. Disabled optional resolver postinstall; installed native dependency works without it.

Complexity review: runtime consists only of Next.js, React, React DOM; no client component, global state, generic component kit, or speculative service. No removable authored duplicates found.

Known non-blocking items: ESLint 9 is deprecated upstream but required by the current Next.js plugin peer ranges; revisit when that toolchain supports ESLint 10. No application runtime dependency is affected.

Technical debt introduced: temporary development-only ESLint compatibility pin noted above.

Ready for next phase: YES.

## 3 — Design system foundation

Goal: establish accessible forest-green/stone design tokens and native Arabic layout primitives.

Existing systems affected: existing layout and foundation page. Expected files: one shared stylesheet and a simple favicon; extend existing page as a bounded development specimen rather than create a component showcase package.

Data model/API impact: none. UI impact: design specimen only, not final homepage. Risks: Arabic line height, narrow-screen overflow, contrast, focus visibility. Dependencies: none added.

Test plan: typecheck, lint, build; inspect 375, 390, 430, 768, 1024, 1280, 1440, 1920 widths and RTL/LTR; keyboard focus and reduced-motion CSS. Remove unused speculative variants.

Completed: shared color/spacing/type/motion tokens, logical layout properties, focus styling, reduced-motion rule, development specimen. Original user-supplied JPEG is preserved byte-for-byte and served through Next Image; placeholder wordmark and invented favicon removed. The supplied logo is also used for icon metadata.

Architecture decisions: extend the existing server page and layout; one stylesheet, no UI package or new component abstractions. Source brand colors are visually matched to the supplied image, not claimed as official measured brand specifications. Additional controls will be introduced and validated in the features that consume them.

Files affected: src/app/layout.tsx, src/app/page.tsx, src/app/globals.css, public/madinum-logo.jpeg; removed src/app/icon.svg.

Validation: TypeScript PASS; lint PASS; production build PASS. Functional inspection PASS for this foundation: logo decoded successfully at all eight specified widths in both document directions, no horizontal overflow, keyboard link focus visible. Desktop and mobile screenshots visually inspected. Original/logo-copy SHA-256 equality PASS. Unit tests N/A (no business logic). English content and language switching are phase 5, not validated by changing document direction.

Issues resolved: bundled Playwright browser absent; used installed Edge headlessly with bundled Playwright, without adding dependencies. Replaced provisional palette and mark after logo arrived.

Complexity review: removed obsolete favicon file and wordmark selector; reused the original logo for header and icon metadata. No custom client JavaScript, duplicated components, stored UI state, or animation dependency added. Reserved tokens are the explicit design-system contract.

Known non-blocking items: full square logo has limited readability as a tiny favicon; a separately approved compact source mark would improve it. No brand geometry was redrawn. This is a development specimen, not a finished marketing homepage.

Technical debt introduced: NONE.

Ready for next phase: YES, subject to database prerequisite below.

## 4 — Database prerequisite inspection

Goal: design and validate PostgreSQL/Prisma schema and migrations before building data-backed features.

Existing systems affected: future database package/configuration, schema, migrations; no database files currently exist to reuse. Model scope: shared physical properties, service-specific listings/units, guests/reservations/occupancy, quotes/rates, owners, identity, CRM, and explicit integration mappings. API/UI impact: none until database gate passes.

Required validation: Prisma schema validation, migration application to a disposable development database, constraints and concurrent occupancy conflict tests. Do not apply unreviewed migrations to an existing production database.

Inspection: no DATABASE/POSTGRES environment key, psql executable, Docker executable, PostgreSQL Windows service, or PostgreSQL installation under Program Files was found. A database setup question remains pending.

Validation: database connection and migrations NOT RUN. No database functionality is claimed complete. No fallback memory store or fake persistence added.

Resolved on continuation: official PostgreSQL 17.11 binaries installed inside ignored .local, initialized with SCRAM password authentication, bound only to 127.0.0.1:55432. Credentials are in ignored .env. No Windows service installed. Prisma 7.10 is the supported stable ORM line; no release candidate adopted.

Completed: normalized shared property, listing, unit, owner, identity, CRM, reservation, quote, pricing, content, audit, and explicitly required future integration mapping models. Two versioned migrations; one server-only Prisma client. Expiring holds require explicit transaction cleanup in the reservation service; the database conservatively blocks an expired row until removed.

Validation: Prisma schema/client generation PASS; migrations applied PASS; migration status PASS; TypeScript PASS; lint PASS; production build PASS; four PostgreSQL integration tests PASS covering concurrent occupancy writes, blocked/maintenance conflict, checkout boundary, invalid dates, missing booking for holds, negative rates, and foreign keys. Full reservation service tests belong to phase 11.

Issues resolved: PostgreSQL startup required sandbox escalation; TypeScript loader required escalation due sandbox account lookup failure. Excluded local runtime files from TypeScript/ESLint scans.

Complexity review: one occupancy table and exclusion constraint replaces separate reservation/block conflict implementations. Guest contact is on the reservation; no unused one-to-one guest/profile models. Roles are an enum until editable permissions have a consumer. Integration models are requested future boundaries, with no fake adapters.

Technical debt: NONE beyond the documented tooling compatibility pin. Full auth and booking services are not yet implemented.

Ready for next phase: YES.

## 5 — Arabic/English infrastructure

Goal: Arabic default route, validated locale routes, true document direction, and page/query-preserving language switching.

Existing systems: root layout, foundation page, stylesheet. Changes: move foundation into [locale], one shared locale dictionary, one interactive language switcher, request locale selection. No new database models or APIs. Risk: hydration/document language mismatch and lost search state. Tests: locale validation, switch URLs, rendered HTML and responsive RTL/LTR. Reuse Next routing rather than adding an i18n framework.

Completed: / redirects to /ar; ar/en validation; localized document language and direction; shared public layout and copy; skip link; query-preserving language switch.

Validation: TypeScript/build PASS; lint PASS; five combined database/localization tests PASS. Browser PASS at all eight required widths in Arabic and English, with no horizontal overflow; actual switch retained query and changed html lang/dir; invalid locale returned 404.

Issue resolved: client navigation preserved the root layout and stale direction. Language change now uses document navigation. No effect on ordinary within-language page navigation.

Complexity review: reused shared stylesheet/layout and native Next routing; no i18n framework, duplicate translated pages, global locale store, or client-rendered page.

Technical debt introduced: NONE. Ready for next phase: YES.

## 6 — Public marketing pages

Goal: replace the development specimen with a branded editorial homepage and brokerage, management, about, and contact pages, with connected owner/contact inquiries.

Existing systems: locale layout/dictionary, design tokens, Prisma Lead/ContentPage. Extend them; create one shared lead form and one CRM write service only where actually used. Property/stay discovery links will be connected as their vertical slices land; do not claim search/booking complete at this checkpoint.

Data/API: validated server action creates lead and initial activity atomically. Risks: misleading stock imagery, invented contact details, personal information in logs, spam, responsive navigation. No invented business contact details or metrics. Tests: submission validation/persistence, bilingual routes, mobile navigation, keyboard/focus, build/lint/typecheck and responsive inspection.

Completed: editorial homepage, brokerage service page, property management page with detailed owner inquiry, about/contact pages, shared responsive navigation/footer, licensed illustrative photography. Original logo retained. Property and stay CTAs currently lead to service/inquiry flows until marketplace/reservation phases land.

Validation: TypeScript/build PASS; lint PASS; seven integration tests PASS. Browser PASS: 80 route/width combinations across two languages; mobile menu, query-preserving language switch, actual form submission and exactly one database lead; no client errors. Screenshots inspected. Synthetic leads removed by test cleanup.

Issues resolved: actual locale document navigation; local runtime excluded from checks. Database per-contact submission limit serialized via advisory transaction lock. Input validation and honeypot applied server-side; field errors, pending, success, and failure states localized. Logs contain only an event code.

Complexity review: one form handles contact and owner flows; one CRM service creates lead/activity atomically; one service-page route handles the four related pages. Removed development specimen CSS and unused development copy. No icon, animation, form, or state-management package added.

Known non-blocking items: production abuse protection still needs host-level request limiting beyond per-contact limits; stock photos are visibly identified as editorial; verified contact numbers, social URLs, and approved legal copy are absent and not invented. CMS administration is phase 13.

Technical debt introduced: NONE. Ready for next phase: YES.

## 7 — Brokerage discovery and inquiries

Goal: database-backed residential search and detail pages, URL filters, deterministic demo seed, and linked property inquiries.

Existing systems: Property/BrokerageListing/PropertyImage, shared tokens, Prisma client, CRM form/service. Extend those rather than introducing repositories or a second form system. Models unchanged. Add a catalog query module, search/detail route, and shared result card only because homepage/detail will reuse it.

Validation plan: filter/sort/pagination tests against PostgreSQL; public query must exclude drafts and private coordinates; schema rejects malformed price/area/date inputs; mobile/RTL browser checks, linked inquiry, build/lint/typecheck. Demo inventory must be explicitly labeled.

Completed: validated URL search, deterministic sorting/pagination, sale/rent details, responsive gallery, similar listings, linked viewing/inquiry form, eight labeled demo listings, reusable cards on homepage. No precise coordinates or private addresses selected in public queries.

Validation: TypeScript/build PASS; lint PASS; nine integration tests PASS; 112 bilingual browser layout checks PASS; city/empty results and database-linked browser inquiry PASS; no client errors. Added localized runtime failure boundary.

Complexity review: reused CRM service/form and public layout; one catalog query handles homepage/search/similar listings; one result card; native GET forms hold search state. Removed obsolete intent-bar CSS. No new dependency.

Known non-blocking items: account-backed favorites await identity phase; contact buttons require verified public number. Map phase follows. Mobile advanced filters currently use accessible native disclosure; full-height drawer refinement remains in experience phase. Demo photos explicitly labeled.

Technical debt introduced: NONE. Ready for next phase: YES for map integration; final marketplace sign-off still includes favorites and interaction refinement.

## 8 — Map search

Goal: lazy OpenStreetMap/Leaflet map with provider-isolated UI, public-coordinate markers, deliberate Search this area, list/split/map URL modes, mobile single-surface view.

User chose OpenStreetMap development map. Existing systems: catalog filter schema and public result projection, property page, demo seed. No data-model change. Dependencies: Leaflet and its TypeScript definitions only; no React wrapper. Tests: valid/invalid bounds, list behavior unchanged, marker popup/link, map failure state, mobile view, no homepage map download.

Completed: map/list/split modes, keyboard markers and safe DOM popup links, deliberate bounded search, map-area clear action, mobile map-only surface, approximate public demo coordinates, tile failure feedback, visible OSM attribution, configurable tile URL. Leaflet imports only inside the map effect.

Validation: TypeScript/build/lint PASS; nine integration tests PASS including valid and invalid map bounds. Browser PASS for popup detail link, Search this area URL bounds, mobile map with no cramped list, Arabic map, and simulated tile failure. Homepage requested zero tiles. OSM tile policy respected: visible-only browser requests, browser caching and referrer, no prefetch/offline downloader.

Complexity review: one map component owns the provider; backend knows only geographic bounds, not Leaflet. Consolidated duplicated URL query construction. No map state store or provider factory. Technical debt introduced: NONE.

Known non-blocking items: development OSM tiles have no SLA; production tile supplier/contact details need configuration. Results markers are explicitly current-page only. Cross-highlighting polish remains in motion phase.

Ready for next phase: YES.

## 9–11 — Hospitality reservation vertical slice

Goal: curated unit discovery, date/guest validation, deterministic server-side quotes, conflict-safe guest reservations, private confirmation. Treat the dependent discovery/pricing/reservation stages as one integration gate; do not present date search as functional until its backend exists.

Existing systems: shared Property, HospitalityUnit, PricingRule, DailyRate, BookingQuote, Booking, Occupancy and reference counter; server-only Prisma client, locale layout/tokens and forms. No payment processor or fake PMS implementation. Add a pricing module and hospitality service; reuse form and gallery patterns rather than install calendar/form packages.

Data/API: expiring saved quotes, server repricing and availability revalidation in a transaction, unique booking per quote, database-excluded overlapping occupancy, random hashed guest-access token in HTTP-only cookie. Booking starts PENDING and holds inventory until staff decision. Required tests: pricing matrix, dates, capacity, changed/expired quote, blocked dates, concurrent bookings, checkout boundaries, private confirmation and browser guest submission.

Completed: bilingual city/date/guest discovery and detail pages, three labeled demo units, native date inputs, two-step quote/request form, itemized nightly/fee/discount/tax breakdown, guest contact and consent, private pending confirmation, header/footer/homepage navigation. Minimum stay constraints apply to dated discovery. No payments or confirmation emails implied.

Validation: 17 domain/integration tests PASS; production build, TypeScript and lint PASS. Edge browser PASS for 12 bilingual responsive route checks, server quote, persisted pending request and total, HTTP-only SameSite cookie, anonymous confirmation denial and locale switch. Synthetic browser booking/hold/history/quote removed after test. Arabic mobile screenshot inspected. Automatic approval usage limitation from the previous session resolved on retry.

Complexity review: reused existing Property/Unit/Quote/Booking/Occupancy models, shared locale layout/gallery/forms and CSS. One pricing function is called by both quote and submission. No new dependency, calendar library, state store, payment stub, or redundant reservation DTO. Client code limited to two server-action forms; discovery/detail/confirmation stay on the server. Removed stale README claims.

Limits: staff decisions and hold release await phase 13; pending inventory is intentionally held without automatic expiry. Tax-rate transitions require staff review; cleaning uses arrival-date policy. Public quote abuse controls, guest account history, full discovery filters/pagination, verified business contacts and production policies remain for later hardening. PostgreSQL adapter emits a pg@9 forward-compatibility warning during concurrency tests; pinned pg8 tests pass.

Ready for next phase: YES for owner intake and administrative workflow. Production readiness: NO; do not publish while staff authentication/decision workflows and hardening remain unfinished.
