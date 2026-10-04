# Madinum

Arabic-first residential brokerage, managed hospitality, and property management.

## Engineering constraints

Inspect existing code before creating any file, component, dependency, or abstraction. Extend an existing implementation when its responsibility fits. Keep one application and a single source of truth for each business rule. Default to server components and URL search state.

At each checkpoint inspect duplication, unused code and dependencies, unnecessary client code, stored state that can be derived, and business rules that belong in one domain service. Reduce complexity before expanding. Do not advance past a failed critical check. Record evidence in CHECKPOINTS.md.

## Planned architecture

- Next.js App Router, strict TypeScript, one application. Arabic `/ar` is the default; English `/en` preserves page and query on language switching.
- PostgreSQL with Prisma. Physical properties are shared; brokerage listings and hospitality units hold channel-specific data.
- Server-side domain services for pricing, availability, reservations, brokerage search, and CRM. Add each service with its first integrated feature, never empty scaffolding.
- Integer SAR minor units; property-local ISO calendar dates with checkout-exclusive intervals. Default timezone Asia/Riyadh.
- Database-enforced occupancy conflicts; server-generated expiring quotes; transactional availability and price revalidation when reserving. Guest reservations start PENDING; no payment processing in V1.
- Explicit server-side permissions and audit records for administrative mutations. Owners and provider mappings are structural future requirements, not active portals or fake integrations.
- No sample records presented as real inventory, reviews, or operating metrics.

## Phase order

1. Repository audit
2. Architecture and dependencies
3. Design system
4. Database schema and migration validation
5. Arabic/English infrastructure
6. Public marketing pages
7. Brokerage marketplace
8. Map search
9. Hospitality discovery
10. Availability and pricing
11. Reservations
12. Owner leads
13. Admin and CRM
14. Motion refinement
15. SEO, accessibility, performance
16. Full production readiness review

The checkpoint requirements take precedence over apparent feature coverage: unfinished or unvalidated work is not complete.

## Current status and local use

Implemented and validated: bilingual marketing pages, database-backed inquiries, residential search/details, OpenStreetMap development search, hospitality discovery, server pricing, expiring quotes, conflict-safe pending reservation requests, and browser-private confirmation. All seeded inventory is explicitly marked as demo. See CHECKPOINTS.md for evidence.

Still pending: owner submission workflow, staff authentication and permissions, administrative booking decisions/calendar, CRM interface, account favorites, production legal/contact configuration, and final SEO/accessibility/security/deployment review. This is a local development application, not a production-ready booking service.

With Node 24 and pnpm available:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm build
pnpm dev
```

The supplied logo is preserved in `public/madinum-logo.jpeg`. No artificial replacement mark is used.

Keep the development PostgreSQL connection string in ignored `.env` as `DATABASE_URL`; never commit credentials. Do not use a production database for migration/concurrency tests. The existing local PostgreSQL cluster is in `.local/pgdata`, listening on 127.0.0.1:55432 when started. It is not a Windows service.

After configuring a development database, run `pnpm db:generate`, `pnpm db:migrate`, and `pnpm db:seed`. Run `pnpm test` for domain/integration tests. Demo seeding is idempotent and refuses to overwrite non-demo inventory.

Reservation prices use SAR minor units and checkout-exclusive calendar dates. Quotes expire after 15 minutes; submission rechecks price and inventory transactionally. PENDING requests hold inventory until a staff decision (the administrative workflow is still pending). A hashed access token protects guest confirmation; its HTTP-only cookie lasts 24 hours. No email confirmation or payment is sent/collected.

Cleaning fees use the arrival date, lodging discounts require full-stay applicability, and extra guest fees are nightly. A stay crossing different configured tax rates is refused for staff review rather than incorrectly taxed. Production tax rules and legal policies require business configuration.
