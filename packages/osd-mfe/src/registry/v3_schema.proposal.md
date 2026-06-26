# Registry schema v3 proposal — Phase 16 Story 1 (HUMAN_REVIEW)

**Status:** awaiting orchestrator review before Stories 2-8 proceed.
**Authored by:** Phase 16 Story 1 loop (2026-06-26).

## What v3 adds

v3 extends v2 with **four optional global top-level fields** that let the
registry advertise URL + integrity + version for assets today served by
`:5602/bundles/...`. v2's layered substructure
(`default` / `rollouts` / `tenantOverrides`) is **unchanged**.

```ts
interface V3Document {
  schemaVersion: 3;
  generatedAt: string;
  // v2 substructure (unchanged):
  default:         V2DefaultLayer;
  rollouts:        V2Rollout[];
  tenantOverrides: Record<string, V2TenantOverride>;
  // v3 NEW global fields (each OPTIONAL):
  core?:           V3AssetDescriptor;  // core.entry.js
  orchestrator?:   V3AssetDescriptor;  // osd_bootstrap_mfe.js
  sharedDepsCss?:  V3AssetDescriptor;  // osd-ui-shared-deps.css
  themes?:         Record<string, V3AssetDescriptor>;  // 'light' | 'dark' | ...
}

interface V3AssetDescriptor {
  url: string;          // REQUIRED, absolute (or /bundles/... dev fallback)
  integrity?: string;   // OPTIONAL; when present MUST start with 'sha384-'
  version: string;      // REQUIRED, data-controlled (cache-bust + telemetry)
}
```

## Design choices (the parts the orchestrator should sign off on)

1. **File: `schema_v3.ts` (mirrors `schema_v2.ts`).** The PROMPT listed
   `{v3_types,migrate,parse}.ts` but says "or wherever the v2 schema validation
   lives" — the existing convention is `schema_v2.ts` housing types + validator
   + migration + coerce. Following the same shape for v3 keeps one canonical
   home per schema version.

2. **The four new fields are GLOBAL, not per-layer.** Core, orchestrator,
   themes, and sharedDepsCss describe INFRASTRUCTURE (the OSD core binary, the
   bootstrap engine, the platform CSS) — not per-tenant plugin variants.
   v2's layering exists to traffic-shift plugin versions; layering these would
   force operators to author the same global URL N times per registry. Keeping
   them global keeps the resolution algorithm pure (Phase 13's resolver
   untouched) and the migration trivial. A future v4 can lift them into the
   layered structure if a credible use case emerges.

3. **Each new field is OPTIONAL.** A v3 doc may have `core` set, absent, or
   anything in between. Consumers (Stories 3-7) check each field individually
   and fall back to the existing `/bundles/...` server-bundled path when
   absent (PRD §"backward-compat at every consumption site"). Auto-migration
   from v2 → v3 leaves new fields absent by default; an explicit
   `V3MigrationDefaults` (used by the dev server-config-derived path) can fill
   them.

4. **`integrity` on `V3AssetDescriptor` is OPTIONAL.** Same-origin asset loads
   don't benefit from SRI (browsers don't enforce it on same-origin by spec).
   When the URL is a `/bundles/...` fallback, integrity is correctly absent.
   Production registries pointing at CDN URLs MUST set integrity (Phase 12
   fail-closed posture); this is enforced by **deployment**, not by the schema.
   The validator only checks: when present, integrity must start with `sha384-`.

5. **`migrateV2ToV3(v2, defaults?)` is forward-only.** v2 → v3 only. A v2-only
   consumer reading a v3 doc uses `coerceToV2Document` which downgrades by
   stripping v3-only fields — forward-compat for the migration period when
   not all callers have moved to v3-aware code.

6. **Audit log: `AuditOp` extends with `'migrate-v2-to-v3'`.** Emitted ONCE by
   Story 2's CLI when it first writes a v3 doc derived from a v2 input. Per-op
   v3 mutation kinds (`set-core` / `set-orchestrator` / `set-theme` /
   `set-shared-deps-css`) will be added by Story 2 alongside their handlers.

## Validation rules (in `validateV3`)

- `schemaVersion === 3` (rejected otherwise).
- v2 substructure validated by delegation to `validateV2` on a synthetic v2
  view — single-sourced rules, future v2 tweaks flow into v3 automatically.
- When a v3-only field is present:
  - `url` and `version` non-empty strings.
  - `integrity`, if present, non-empty AND starts with `sha384-`.
- `themes`, if present, is an object keyed by non-empty theme name with each
  value an `AssetDescriptor`.

## Test coverage (39 tests in `schema_v3.test.ts`)

- 6 acceptance: fully-populated / migration-only / partial / canary+tenant+v3 /
  no-integrity / empty-themes-record.
- 11 rejection: non-object / wrong schemaVersion / bad integrity prefix /
  empty integrity / empty url / missing version / non-object themes /
  malformed theme integrity / assert throws / v2-substructure error
  bubble-up.
- 5 migration: no-defaults / full-defaults / partial-defaults /
  rollouts+tenants preserved / input not mutated.
- 4 `detectRegistryShape`: v3 / v2 / v1 / unknown.
- 7 `coerceToV3Document`: v3 identity / invalid v3 throws / v2→v3 no-defaults
  / v2→v3 defaults / v1→v2→v3 / unknown throws / malformed v1 throws.
- 2 `coerceToV2Document` v3-downgrade: full / migration-only.
- 1 audit-log: `op='migrate-v2-to-v3'` round-trips through JSON.

## Open questions for the orchestrator

Q1. Should v3 lock integrity to REQUIRED at the schema level (force the
fail-closed posture into the type system, accept the dev-fallback awkwardness)?
Current proposal: keep OPTIONAL; rely on deployment policy to enforce
required-in-prod.

Q2. Should `themes` enumerate known theme names (`'light' | 'dark'`) or stay
open (any non-empty string)? Current proposal: open record — OSD has shipped
custom theme bundles historically (e.g., the v8 vs legacy theme split).

Q3. Are the audit-log op kinds named acceptably?
(`'migrate-v2-to-v3'`, future `'set-core'`, `'set-orchestrator'`,
`'set-theme'`, `'set-shared-deps-css'`.)

## Files touched in Story 1

NEW: `packages/osd-mfe/src/registry/schema_v3.ts`,
     `packages/osd-mfe/src/registry/fixtures_v3.ts`,
     `packages/osd-mfe/src/registry/schema_v3.test.ts`,
     `packages/osd-mfe/src/registry/v3_schema.proposal.md` (this file).

MODIFIED:
- `packages/osd-mfe/src/registry/schema_v2.ts` — `DetectedRegistryShape`
  gains `'v3'`; `detectRegistryShape` checks v3 first; `coerceToV2Document`
  downgrades v3 input by stripping v3-only fields.
- `packages/osd-mfe/src/registry/update_cli_v2.ts` — `AuditOp` adds
  `'migrate-v2-to-v3'`.
- `packages/osd-mfe/src/registry/index.ts` — re-exports the v3 surface.

## Verification

- `tsc -p packages/osd-mfe/tsconfig.json --noEmit` : rc=0.
- `node scripts/jest packages/osd-mfe --forceExit` : 549/549 passed
  (was 510+ at Phase 14 capstone; +39 net new v3 tests; 0 regressions).
- `schema_v2.test.ts` alone : 53/53 — v3 extension to `detectRegistryShape`
  did not break existing v2 detection cases.

## Next (after HUMAN_REVIEW)

Orchestrator reviews this file, confirms or amends the design above, manually
sets Story 1 status to `completed` in `prd.json`, and restarts the loop.
Stories 2-8 then proceed: Story 2 wires the schema into the build/deploy/CLI
plumbing; Story 3 wires the orchestrator URL through the resolver; Stories
4-7 land the consumer changes; Story 8 caps the phase with `verify_phase16.js`
+ docs/19.
