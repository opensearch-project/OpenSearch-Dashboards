/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * Authoring CLI for the MFE registry (`schemaVersion: 1`).
 *
 * This is the SINGLE entrypoint for every registry write — full regen,
 * deploy-manifest registration, single-plugin patch, layered authoring
 * (default / rollouts / tenant overrides / rollback), and global-asset
 * descriptor updates (core / orchestrator / sharedDepsCss / themes). It
 * targets the unified registry document shape defined in {@link ./schema}
 * (the post-schema-collapse, schemaVersion 1, layered + global-asset shape)
 * and is the only sanctioned way to mutate the registry data file.
 *
 * Modes (one per invocation):
 *
 *   bulk writers — produce a fresh layered document from build artifacts
 *   or a deploy manifest, OR patch a single existing entry in place. These
 *   modes do NOT append to the audit log: they are bulk writers, not edits:
 *     - (default)               Full regen from `target/mfe/<id>/remoteEntry.js`
 *     - `--from-manifest`       REPLACE the doc from a deploy-manifest.json
 *     - `--from-manifest --merge`
 *                                MERGE manifest entries into the existing doc
 *     - `--plugin <id>`          Patch a single existing `default.mfes[id]`
 *                                in place; drops integrity (operator-supplied
 *                                data no longer matches the recorded SRI).
 *
 *   Layered authoring — single-edit mutations that DO append to the audit log
 *   sidecar (`<registry>.history.json`) atomically (doc + log written together
 *   via temp-file + rename; if either fails the doc is rolled back):
 *     - `--default-entry id=… version=… url=…`
 *     - `--add-rollout ruleId=… match=… override=…`
 *     - `--remove-rollout ruleId=…`
 *     - `--tenant-override customerId=… mfeId=… version=… url=…`
 *     - `--remove-tenant-override customerId=… mfeId=…`
 *     - `--rollback id=…`            (undoes the most recent default-entry/rollback)
 *     - `--check-deps`               (gate that runs before the audit log write)
 *
 *   Global-asset writers — read a asset-build manifest (see
 *   {@link ./asset_build}) and stamp the resulting descriptor onto the
 *   document's top-level `core` / `orchestrator` / `sharedDepsCss` /
 *   `themes[<name>]` field. Each emits a `set-<field>` audit entry:
 *     - `--update-core <build-manifest>`
 *     - `--update-orchestrator <build-manifest>`
 *     - `--update-shared-deps-css <build-manifest>`
 *     - `--update-theme <name> <build-manifest>`
 *
 *   When `MFE_REGISTRY_SIGNING_KEY` is set (and optionally
 *   `MFE_REGISTRY_KEY_ID`), each global-asset write is re-signed by the
 *   {@link signRegistry} primitive so a signed registry stays signed after
 *   every op. Layered authoring ops do NOT re-sign — the existing Phase 12
 *   posture is that signatures travel via the publish pipeline (full regen +
 *   sign), not via per-edit re-signing. The CLI follows that established
 *   division.
 *
 *   `--check-deps` builds the inter-plugin dependency graph from the
 *   BUILD-TIME externals data (the actual `__osdBundles__.get(…)` value-edges
 *   emitted by `build_mfe`), NOT from the manifest's `requiredPlugins` (which
 *   over-states coupling — type-only imports are erased — per the Phase-15
 *   spike). The CLI consumes the externals as a sidecar directory.
 *
 *   The CLI runs on an operator/orchestrator host, mutates the document on
 *   disk, and appends to the sidecar audit log. A future production registry
 *   service will expose the SAME operations via an HTTP API.
 */

import Fs from 'fs';
import Path from 'path';

import { generateRegistry } from './generate';
import { computeCompatMetadata, CompatMetadata } from './compat';
import {
  AssetDescriptor,
  MfeEntry,
  RegistryDocument,
  Rollout,
  RolloutMatch,
  SCHEMA_VERSION,
  assertValidRegistryDocument,
} from './schema';
import { resolveBootManifest } from './resolve';
import {
  AssetBuildManifest,
  manifestToAssetDescriptor,
  readAssetBuildManifest,
} from './asset_build';
import { RegistrySigningKey, signRegistry } from './signing';
import { REGISTRY_SIGNATURE_ALGORITHM } from './signing_common';

/* ------------------------------------------------------------------------- *
 * Usage
 * ------------------------------------------------------------------------- */

const USAGE = `Usage: node scripts/update_registry [options]

Write/patch the external MFE registry DATA file (schemaVersion: 1). The single
sanctioned way to (re)generate, flip a version, or stamp a global asset.

bulk writers (no audit log — bulk writers, not edits):
  (default)              Regenerate the whole registry from the built remotes
                         under target/mfe/<id>/remoteEntry.js (content-hash
                         versions). Use --base-url to point the remote URLs at
                         a specific origin (e.g. the local :8080 mock CDN).
  --from-manifest        REPLACE the registry from a deploy-manifest.json:
                         every remoteEntry repoints at its content-addressed
                         CDN URL, sharedDeps at the CDN shared-deps URL.
                         Versions/scope/module are carried over, SRI integrity
                         is taken from the manifest. Data-only: no upload, no
                         AWS call.
  --from-manifest --merge
                         MERGE a (typically single-plugin) manifest into the
                         existing registry: patch ONLY the entries present in
                         the manifest, leave every other entry byte-identical,
                         stamp fresh compat per patched entry. Preserves the
                         existing sharedDeps when the manifest has none.
  --plugin <id>          Patch a SINGLE existing entry's version/url in the
                         default layer in place. Requires --version and/or
                         --url. Integrity is dropped because the recorded SRI
                         no longer matches the manually supplied data.

Layered authoring (atomic — appends one audit entry per op):
  --default-entry id=<id> version=<v> url=<u> [scope=<s>] [module=<m>] [integrity=<i>]
  --add-rollout ruleId=<r> match=<json> override=<json>
  --remove-rollout ruleId=<r>
  --tenant-override customerId=<c> mfeId=<id> version=<v> url=<u> [scope=<s>] [module=<m>] [integrity=<i>]
  --remove-tenant-override customerId=<c> mfeId=<id>
  --rollback id=<mfe-id>
  --check-deps [--externals-dir <p>]  Run the dep-graph gate before writing.

Global-asset writers (atomic — appends one set-<field> audit entry per op):
  --update-core <build-manifest>           Stamp the global \`core\` field.
  --update-orchestrator <build-manifest>   Stamp the global \`orchestrator\` field.
  --update-shared-deps-css <build-manifest>
                                           Stamp the global \`sharedDepsCss\` field.
  --update-theme <name> <build-manifest>   Stamp \`themes[<name>]\`.

  When \`MFE_REGISTRY_SIGNING_KEY\` is set, each global-asset write is
  re-signed (envelope keyId from \`MFE_REGISTRY_KEY_ID\`, default \`default\`).
  --cdn-base-url <u> overrides the URL prefix the descriptor is stamped with
  (defaults to REGISTRY_BASE_URL or http://localhost:8080).

Options:
  --base-url <url>       Origin the remotes are served from (full-regen mode).
                         Defaults to REGISTRY_BASE_URL env or http://localhost:8080.
  --manifest-path <p>    deploy-manifest.json to read (--from-manifest mode).
                         Defaults to deploy-manifest.json next to the registry file.
  --version <version>    New version string for --plugin <id>.
  --url <url>            New remoteEntry URL for --plugin <id>.
  --registry-path <p>    Registry data file to write. Defaults to MFE_REGISTRY_PATH.
  --reason "<text>"      Optional human-readable reason; recorded in the audit log.
  --externals-dir <p>    Directory of <id>.externals.json files (--check-deps).
                         Defaults to a sibling \`externals\` directory.
  --contract-version <v> contractVersion peers must match (default: OSD major.minor).
  --cdn-base-url <u>     URL prefix for global-asset descriptors (default: REGISTRY_BASE_URL).
  --help, -h             Show this message

Restore the local origin (undo --from-manifest):
  node scripts/update_registry --base-url http://localhost:8080
  (or set REGISTRY_BASE_URL).`;

/** Minimal console surface, injectable so tests can assert/silence output. */
export interface UpdateCliConsole {
  log: (message: string) => void;
  error: (message: string) => void;
}

/** Audit-log entry kinds (one per supported single-edit op). */
export type AuditOp =
  | 'set-default-entry'
  | 'add-rollout'
  | 'remove-rollout'
  | 'set-tenant-override'
  | 'remove-tenant-override'
  | 'rollback'
  | 'set-core'
  | 'set-orchestrator'
  | 'set-shared-deps-css'
  | 'set-theme';

/**
 * One audit-log entry. Appended to the sidecar `<registry>.history.json` on
 * every successful authoring op. Exposed for tests + a future inspector UI.
 */
export interface AuditEntry {
  timestamp: string;
  op: AuditOp;
  /** Identifier of the affected target (mfe id, rule id, "customerId|mfeId", "themes.<name>", …). */
  target: string;
  /** Snapshot of the value before the op (`null` when adding a new value). */
  before: unknown;
  /** Snapshot of the value after the op (`null` when removing). */
  after: unknown;
  /** Optional human-readable reason supplied via `--reason`. */
  reason?: string;
}

/**
 * The audit log is just a JSON array of {@link AuditEntry}s. We DELIBERATELY
 * do NOT use a JSONL stream here — the file is small (one entry per authoring
 * op, not per request), atomic write-then-rename is straightforward on JSON,
 * and tooling (jq, the inspector) can query it as a single document.
 */
export type AuditLog = AuditEntry[];

/* ------------------------------------------------------------------------- *
 * Argument parsing
 * ------------------------------------------------------------------------- */

/**
 * Parse a sequence of `key=value` argv tokens following `--<flag>` until the
 * next `--<…>` token (or end of argv). Supports values with `=` in them
 * (split on the FIRST `=`). Returns a map of key -> value plus the index AFTER
 * the last consumed token.
 *
 * Example: argv = `[..., '--default-entry', 'id=inspector', 'version=3.5.0-rc1', 'url=https://...', '--reason', 'r']`
 * => { id: 'inspector', version: '3.5.0-rc1', url: 'https://...' }, nextIndex pointing
 * at `--reason`.
 */
export function parseKeyValuePairs(
  argv: string[],
  startIndex: number
): { pairs: Record<string, string>; nextIndex: number } {
  const pairs: Record<string, string> = {};
  let i = startIndex;
  while (i < argv.length) {
    const tok = argv[i];
    if (tok.startsWith('--')) break;
    const eq = tok.indexOf('=');
    if (eq <= 0) {
      throw new Error(`Expected key=value pair, got "${tok}"`);
    }
    const k = tok.slice(0, eq);
    const v = tok.slice(eq + 1);
    pairs[k] = v;
    i++;
  }
  return { pairs, nextIndex: i };
}

/**
 * Read a `--flag <value>` option from argv (single positional value).
 *
 * @returns the value, or `undefined` when the flag is absent
 * @throws Error when the flag is present but its value is missing/another flag
 */
function readOption(argv: string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  if (idx === -1) return undefined;
  const v = argv[idx + 1];
  if (v === undefined || v.startsWith('-')) {
    throw new Error(`${flag} requires a value (e.g. "${flag} <value>")`);
  }
  return v;
}

/**
 * Read `--update-theme <name> <build-manifest>` (two positional values).
 *
 * @returns the parsed pair, or `null` when the flag is absent
 * @throws Error when the flag is present but either positional is missing
 */
function readUpdateThemeArgs(argv: string[]): { themeName: string; manifestPath: string } | null {
  const idx = argv.indexOf('--update-theme');
  if (idx === -1) return null;
  const name = argv[idx + 1];
  const manifestPath = argv[idx + 2];
  if (name === undefined || name.startsWith('--')) {
    throw new Error('--update-theme requires <name> <build-manifest>');
  }
  if (manifestPath === undefined || manifestPath.startsWith('--')) {
    throw new Error(`--update-theme ${name} requires a build-manifest path`);
  }
  return { themeName: name, manifestPath };
}

/**
 * Resolve the registry data file path: `--registry-path` arg wins over the
 * `MFE_REGISTRY_PATH` env var. The package never hardcodes a workspace path.
 *
 * @throws Error when neither source provides a path
 */
export function resolveRegistryPath(argv: string[], env: NodeJS.ProcessEnv): string {
  const fromArg = readOption(argv, '--registry-path');
  const fromEnv = env.MFE_REGISTRY_PATH;
  const path = fromArg ?? (typeof fromEnv === 'string' && fromEnv.length > 0 ? fromEnv : undefined);
  if (path === undefined) {
    throw new Error(
      'No registry path: pass --registry-path <p> or set the MFE_REGISTRY_PATH env var.'
    );
  }
  return path;
}

/* ------------------------------------------------------------------------- *
 * Mode dispatch
 * ------------------------------------------------------------------------- */

/** Flags that route to the layered-authoring branch. */
const LAYERED_FLAGS = [
  '--default-entry',
  '--add-rollout',
  '--remove-rollout',
  '--tenant-override',
  '--remove-tenant-override',
  '--rollback',
] as const;

/** Flags that route to the global-asset branch. */
const GLOBAL_ASSET_FLAGS = [
  '--update-core',
  '--update-orchestrator',
  '--update-shared-deps-css',
  '--update-theme',
] as const;

/** Flags that route to the bulk-writer branch (no audit log). */
const V1_STYLE_FLAGS = ['--from-manifest', '--plugin'] as const;

function hasAny(argv: string[], flags: ReadonlyArray<string>): boolean {
  return flags.some((f) => argv.includes(f));
}

/* ------------------------------------------------------------------------- *
 * bulk-writer mode: full regen, --from-manifest, --plugin patch
 * ------------------------------------------------------------------------- */

/**
 * Lift a flat (legacy in-memory) registry (produced by {@link generateRegistry}) into
 * the unified layered shape (`schemaVersion: 1`): plugins move under
 * `default.mfes`, sharedDeps under `default.sharedDeps`, and the doc gets
 * empty `rollouts`/`tenantOverrides` arrays.
 *
 * Used by the full-regen path (`generateRegistry` still produces the flat
 * shape — it predates the schema collapse and was not rewritten for Story 5
 * since the lift is trivial and keeps that module's contract narrow).
 */
function liftFlatRegistryToDocument(
  flat: ReturnType<typeof generateRegistry>,
  now: Date
): RegistryDocument {
  return {
    schemaVersion: SCHEMA_VERSION as 1,
    generatedAt: now.toISOString(),
    default: {
      sharedDeps: flat.sharedDeps,
      mfes: flat.mfes,
    },
    rollouts: [],
    tenantOverrides: {},
  };
}

/**
 * Patch `default.mfes[pluginId]`'s version and/or remoteEntry URL in place.
 *
 * The recorded `integrity` is intentionally DROPPED: it is the SRI hash of the
 * previously built bytes, which no longer correspond to the operator-supplied
 * version/url. Keeping a stale hash would make the browser reject the bundle.
 * (A subsequent full regen recomputes integrity from the real artifact bytes.)
 *
 * @throws Error when neither --version nor --url is supplied, or the id is unknown
 */
function patchEntry(
  registryPath: string,
  pluginId: string,
  version: string | undefined,
  url: string | undefined,
  now: Date
): RegistryDocument {
  if (version === undefined && url === undefined) {
    throw new Error(
      `--plugin "${pluginId}" requires at least one of --version <v> or --url <u> to patch.`
    );
  }

  const raw = Fs.readFileSync(registryPath, 'utf8');
  const doc = assertValidRegistryDocument(JSON.parse(raw));

  const existing = doc.default.mfes[pluginId];
  if (existing === undefined) {
    const known = Object.keys(doc.default.mfes).sort().join(', ');
    throw new Error(
      `No registry entry for plugin "${pluginId}" in ${registryPath}. Known ids: ${known}`
    );
  }

  const patched: MfeEntry = {
    version: version ?? existing.version,
    remoteEntry: url ?? existing.remoteEntry,
    scope: existing.scope,
    module: existing.module,
    // `integrity` deliberately omitted — see the docstring above.
    // Carry forward the Phase 9 compatibility metadata: it describes what the
    // remote was built against and does not change when an operator repoints a
    // URL or relabels a version.
    ...(existing.builtAgainst !== undefined ? { builtAgainst: existing.builtAgainst } : {}),
    ...(existing.compat !== undefined ? { compat: existing.compat } : {}),
  };

  doc.default.mfes[pluginId] = patched;
  doc.generatedAt = now.toISOString();
  return doc;
}

/**
 * The subset of the `deploy-manifest.json` document the registry writer
 * consumes. Declared independently here — and validated at runtime by
 * {@link assertValidManifest} — because the manifest is EXTERNAL data read
 * from disk, not a trusted in-process value.
 */
interface ManifestMfeEntry {
  /** Content-addressed version `<osdVersion>+<contentHash>` (matches the registry). */
  version: string;
  /** First 12 hex chars of `sha256(remoteEntry.js)` — the immutable path segment. */
  contentHash: string;
  /** Public CloudFront URL of the plugin's `remoteEntry.js`. */
  cdnUrl: string;
  /**
   * SRI hash (`sha384-<base64>`) of the UNCOMPRESSED `remoteEntry.js` bytes the
   * deploy published. Authoritative: computed at publish time over the exact
   * bytes served, so the registry writer stamps it onto the canonical entry
   * verbatim. OPTIONAL because a manifest from an older `deploy_mfe` carries
   * none — then the writer falls back to carrying the prior entry's integrity
   * only when the content hash is unchanged.
   */
  integrity?: string;
}

/** The `deploy-manifest.json` fields consumed when registering a CDN revision. */
interface DeployManifestData {
  /** Manifest schema version; must equal {@link DEPLOY_MANIFEST_SCHEMA_VERSION}. */
  schemaVersion: number;
  /** CDN coordinates the artifacts were published to (recorded for traceability). */
  cdn: { baseUrl: string };
  /**
   * Shared-deps singletons published location. OPTIONAL: a single-plugin
   * publish skips shared-deps, so its manifest carries NO `sharedDeps` key.
   * When absent, a full REPLACE (`--from-manifest`) is rejected (it would
   * drop the registry's sharedDeps), while a `--merge` preserves the
   * existing registry's `sharedDeps` untouched.
   */
  sharedDeps?: { version: string; cdnUrl: string };
  /** Map of plugin id -> its published CDN descriptor. */
  mfes: Record<string, ManifestMfeEntry>;
}

/**
 * The deploy-manifest schema version this writer understands. Kept in sync
 * with `deploy/deploy_cli.ts` (`DEPLOY_MANIFEST_SCHEMA_VERSION`); a newer
 * manifest is rejected with a clear error rather than silently mis-read.
 */
const DEPLOY_MANIFEST_SCHEMA_VERSION = 1;

/** Type guard: a plain (non-null, non-array) object. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** True when `value` is a non-empty string. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validate a parsed deploy manifest against the fields the registry writer
 * needs and narrow it to {@link DeployManifestData}. The manifest is external
 * data, so this throws a precise, operator-actionable error rather than
 * trusting it.
 *
 * @throws Error listing every missing/invalid field
 */
function assertValidManifest(value: unknown, manifestPath: string): DeployManifestData {
  const errors: string[] = [];

  if (!isPlainObject(value)) {
    throw new Error(`Deploy manifest ${manifestPath} is not a JSON object.`);
  }
  if (value.schemaVersion !== DEPLOY_MANIFEST_SCHEMA_VERSION) {
    errors.push(
      `schemaVersion must equal ${DEPLOY_MANIFEST_SCHEMA_VERSION} ` +
        `(got ${JSON.stringify(value.schemaVersion)}) — regenerate with this tool's deploy_mfe`
    );
  }
  if (!isPlainObject(value.cdn) || !isNonEmptyString(value.cdn.baseUrl)) {
    errors.push('cdn.baseUrl must be a non-empty string');
  }
  if (value.sharedDeps !== undefined) {
    if (!isPlainObject(value.sharedDeps)) {
      errors.push('sharedDeps, when present, must be an object with { version, cdnUrl }');
    } else {
      if (!isNonEmptyString(value.sharedDeps.cdnUrl)) {
        errors.push('sharedDeps.cdnUrl must be a non-empty string');
      }
      if (!isNonEmptyString(value.sharedDeps.version)) {
        errors.push('sharedDeps.version must be a non-empty string');
      }
    }
  }
  if (!isPlainObject(value.mfes)) {
    errors.push('mfes must be an object keyed by plugin id');
  } else {
    const ids = Object.keys(value.mfes);
    if (ids.length === 0) {
      errors.push('mfes must contain at least one entry');
    }
    for (const id of ids) {
      const entry = value.mfes[id];
      if (!isPlainObject(entry)) {
        errors.push(`mfes.${id} must be an object`);
        continue;
      }
      if (!isNonEmptyString(entry.cdnUrl)) {
        errors.push(`mfes.${id}.cdnUrl must be a non-empty string`);
      }
      if (!isNonEmptyString(entry.version)) {
        errors.push(`mfes.${id}.version must be a non-empty string`);
      }
      if (entry.integrity !== undefined && !isNonEmptyString(entry.integrity)) {
        errors.push(`mfes.${id}.integrity, when present, must be a non-empty string`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid deploy manifest ${manifestPath}:\n  - ${errors.join('\n  - ')}\n` +
        'Run `node scripts/deploy_mfe` to (re)generate it.'
    );
  }
  return (value as unknown) as DeployManifestData;
}

/**
 * Resolve the deploy-manifest.json path for `--from-manifest`: `--manifest-path`
 * wins, else `deploy-manifest.json` next to the registry file (they live
 * together and describe the same revision).
 */
function resolveManifestPath(argv: string[], registryPath: string): string {
  const fromArg = readOption(argv, '--manifest-path');
  return fromArg ?? Path.join(Path.dirname(registryPath), 'deploy-manifest.json');
}

/**
 * Best-effort read of the CURRENT registry's `default.mfes` map, used to
 * carry forward `scope`/`module`/`integrity` when registering a CDN revision.
 * Returns `{}` when the file is missing or invalid — registering the CDN
 * revision must not depend on a pre-existing (or valid) registry; it just
 * means SRI is omitted.
 */
function readExistingDefaultMfes(registryPath: string): Record<string, MfeEntry> {
  try {
    const raw = Fs.readFileSync(registryPath, 'utf8');
    return assertValidRegistryDocument(JSON.parse(raw)).default.mfes;
  } catch {
    return {};
  }
}

/**
 * Build a {@link RegistryDocument} from a deploy manifest, pointing each
 * remoteEntry at its content-addressed CloudFront URL and `default.sharedDeps`
 * at the CDN shared-deps URL. This ONLY repoints URLs — `version`, `scope`
 * and `module` are preserved from `priorMfes` when present, else derived to
 * the canonical values produced by {@link generateRegistry}
 * (`scope = osdMfe_<id>`, `module = ./public`).
 *
 * `integrity` (SRI) is taken from the MANIFEST when present (authoritative —
 * computed at publish time over the exact uncompressed bytes); otherwise it
 * is carried over from the current registry entry ONLY when it still pins the
 * SAME content (its `version` equals the manifest's). When neither is
 * available, `integrity` is omitted — it is optional in the schema
 * (recommended in prod).
 *
 * Empty `rollouts` / `tenantOverrides` / no global-asset fields: a REPLACE
 * from a deploy manifest produces a steady-state plugin-only document. Asset
 * fields and tenant/rollout layers are added separately via the layered or
 * global-asset modes.
 *
 * @param manifest validated deploy manifest data
 * @param now timestamp to stamp into `generatedAt`
 * @param priorMfes the current registry's `default.mfes` (pass `{}` when none)
 * @param compatMeta Phase 9 compatibility metadata to stamp onto every entry.
 *   Optional: when omitted, entries carry no compat data (treated as UNKNOWN
 *   by the classifier).
 * @returns an in-memory registry document (validate + write it separately)
 */
export function buildRegistryFromManifest(
  manifest: DeployManifestData,
  now: Date,
  priorMfes: Record<string, MfeEntry> = {},
  compatMeta?: CompatMetadata
): RegistryDocument {
  if (manifest.sharedDeps === undefined) {
    // A full REPLACE cannot synthesize a sharedDeps descriptor out of nothing —
    // the registry schema requires one. A single-plugin manifest (no sharedDeps)
    // must be applied with `--merge`, which preserves the existing sharedDeps.
    throw new Error(
      'Cannot REPLACE the registry from a manifest with no sharedDeps (single-plugin ' +
        'publish). Re-run update_registry with --merge to patch just the manifest entries ' +
        'into the existing registry (its sharedDeps is preserved).'
    );
  }

  const mfes: Record<string, MfeEntry> = {};
  for (const id of Object.keys(manifest.mfes).sort((a, b) => a.localeCompare(b))) {
    mfes[id] = buildMfeEntry(id, manifest.mfes[id], priorMfes[id], compatMeta);
  }

  return {
    schemaVersion: SCHEMA_VERSION as 1,
    generatedAt: now.toISOString(),
    default: {
      sharedDeps: {
        url: manifest.sharedDeps.cdnUrl,
        version: manifest.sharedDeps.version,
      },
      mfes,
    },
    rollouts: [],
    tenantOverrides: {},
  };
}

/**
 * Build a single {@link MfeEntry} from one manifest entry. Shared by the full
 * REPLACE ({@link buildRegistryFromManifest}) and single-entry MERGE
 * ({@link mergeRegistryFromManifest}) paths so both repoint URLs, derive
 * scope/module, carry SRI (only when the content hash is unchanged), and
 * stamp compat identically.
 */
function buildMfeEntry(
  id: string,
  entry: ManifestMfeEntry,
  prior: MfeEntry | undefined,
  compatMeta?: CompatMetadata
): MfeEntry {
  // Prefer the manifest's publish-time integrity (authoritative for the exact
  // CDN bytes). Fall back to the prior entry's integrity only when it still
  // pins the SAME content (version match) — for an older manifest that
  // carries none.
  const integrity =
    entry.integrity ??
    (prior !== undefined && prior.version === entry.version ? prior.integrity : undefined);

  return {
    version: entry.version,
    remoteEntry: entry.cdnUrl,
    scope: prior?.scope ?? `osdMfe_${id}`,
    module: prior?.module ?? './public',
    ...(integrity !== undefined ? { integrity } : {}),
    ...(compatMeta?.builtAgainst ?? prior?.builtAgainst
      ? { builtAgainst: compatMeta?.builtAgainst ?? prior!.builtAgainst }
      : {}),
    ...(compatMeta?.compat ?? prior?.compat ? { compat: compatMeta?.compat ?? prior!.compat } : {}),
  };
}

/**
 * MERGE a deploy manifest into an EXISTING registry: patch ONLY the entries
 * present in `manifest.mfes` into `existing.default.mfes`, leaving every other
 * entry BYTE-IDENTICAL, and stamp FRESH compat (`compatMeta`) onto each
 * patched entry. Preserves the existing `default.sharedDeps` when the
 * manifest has none (a single-plugin publish), or repoints it at the
 * manifest's CDN location when one is present.
 *
 * Rollouts, tenant overrides, and global-asset roots are NOT touched: a merge
 * is plugin-data-only.
 *
 * @returns a NEW in-memory registry document (validate + write it separately)
 */
export function mergeRegistryFromManifest(
  existing: RegistryDocument,
  manifest: DeployManifestData,
  now: Date,
  compatMeta?: CompatMetadata
): RegistryDocument {
  // Shallow-copy preserves key order and keeps untouched entries as the SAME
  // object references, so they re-serialize byte-identically.
  const mfes: Record<string, MfeEntry> = { ...existing.default.mfes };
  for (const id of Object.keys(manifest.mfes)) {
    mfes[id] = buildMfeEntry(id, manifest.mfes[id], existing.default.mfes[id], compatMeta);
  }

  return {
    ...existing,
    generatedAt: now.toISOString(),
    default: {
      sharedDeps:
        manifest.sharedDeps !== undefined
          ? { url: manifest.sharedDeps.cdnUrl, version: manifest.sharedDeps.version }
          : existing.default.sharedDeps,
      mfes,
    },
  };
}

/**
 * Best-effort {@link computeCompatMetadata}: returns `undefined` when the
 * repo cannot be read (e.g. a test stub repoRoot with no `package.json`).
 * Registering a CDN revision must not depend on a readable repo — when
 * metadata can't be computed, {@link buildRegistryFromManifest} carries
 * forward whatever the prior registry recorded.
 */
function tryComputeCompatMetadata(repoRoot: string): CompatMetadata | undefined {
  try {
    return computeCompatMetadata(repoRoot);
  } catch {
    return undefined;
  }
}

/** Write the registry document as pretty JSON (trailing newline) to `registryPath`. */
function writeRegistry(registryPath: string, doc: RegistryDocument): void {
  Fs.mkdirSync(Path.dirname(registryPath), { recursive: true });
  Fs.writeFileSync(registryPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
}

/**
 * bulk-writer branch: full regen, --from-manifest (REPLACE or MERGE),
 * --plugin <id>. None of these append to the audit log — they are bulk
 * writers, not edits.
 */
function runV1StyleBranch(
  argv: string[],
  repoRoot: string,
  env: NodeJS.ProcessEnv,
  out: UpdateCliConsole,
  now: Date
): number {
  try {
    const registryPath = resolveRegistryPath(argv, env);
    const pluginId = readOption(argv, '--plugin');
    const fromManifest = argv.includes('--from-manifest');
    const merge = argv.includes('--merge');

    if (merge && !fromManifest) {
      throw new Error('--merge only applies to --from-manifest (it patches manifest entries).');
    }

    let doc: RegistryDocument;
    let summary: string;
    if (pluginId !== undefined) {
      const version = readOption(argv, '--version');
      const url = readOption(argv, '--url');
      doc = patchEntry(registryPath, pluginId, version, url, now);
      const patched = doc.default.mfes[pluginId];
      summary = `Patched "${pluginId}" -> version=${patched.version}, remoteEntry=${patched.remoteEntry}`;
    } else if (fromManifest) {
      const manifestPath = resolveManifestPath(argv, registryPath);
      const manifest = assertValidManifest(
        JSON.parse(Fs.readFileSync(manifestPath, 'utf8')),
        manifestPath
      );
      if (merge) {
        let existing: RegistryDocument;
        try {
          existing = assertValidRegistryDocument(JSON.parse(Fs.readFileSync(registryPath, 'utf8')));
        } catch (cause) {
          throw new Error(
            `--merge requires an existing, valid registry at ${registryPath} to patch into ` +
              `(${cause instanceof Error ? cause.message : String(cause)}).`
          );
        }
        doc = mergeRegistryFromManifest(
          existing,
          manifest,
          now,
          tryComputeCompatMetadata(repoRoot)
        );
        summary =
          `Merged CDN revision from ${manifestPath} ` +
          `(${Object.keys(manifest.mfes).length} entrie(s) patched, ` +
          `${Object.keys(doc.default.mfes).length} total @ ${manifest.cdn.baseUrl})`;
      } else {
        doc = buildRegistryFromManifest(
          manifest,
          now,
          readExistingDefaultMfes(registryPath),
          tryComputeCompatMetadata(repoRoot)
        );
        summary =
          `Registered CDN revision from ${manifestPath} ` +
          `(${Object.keys(doc.default.mfes).length} entrie(s) @ ${manifest.cdn.baseUrl})`;
      }
    } else {
      const baseUrl = readOption(argv, '--base-url');
      const flat = generateRegistry({
        repoRoot,
        baseUrl: baseUrl ?? env.REGISTRY_BASE_URL,
        now,
      });
      doc = liftFlatRegistryToDocument(flat, now);
      summary = `Regenerated registry with ${Object.keys(doc.default.mfes).length} entrie(s)`;
    }

    // Defensive re-validate before writing — patchEntry/merge already validate
    // their inputs; this guards generate output and the patched result equally.
    assertValidRegistryDocument(doc);
    writeRegistry(registryPath, doc);

    out.log(`${summary} -> ${registryPath}`);
    return 0;
  } catch (error) {
    out.error(error instanceof Error ? error.message : String(error));
    out.error('');
    out.error(USAGE);
    return 1;
  }
}

/* ------------------------------------------------------------------------- *
 * Layered authoring — pure mutation helpers
 * ------------------------------------------------------------------------- */

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function mfeEntryFromPairs(pairs: Record<string, string>, prefix: string): MfeEntry {
  const required = ['id', 'version', 'url'];
  const missing = required.filter((k) => !pairs[k]);
  if (missing.length > 0 && prefix === '--default-entry') {
    throw new Error(`--default-entry missing required key(s): ${missing.join(', ')}`);
  }
  const entry: MfeEntry = {
    version: pairs.version,
    remoteEntry: pairs.url,
    scope: pairs.scope ?? pairs.id,
    module: pairs.module ?? './public',
  };
  if (pairs.integrity !== undefined && pairs.integrity.length > 0) {
    entry.integrity = pairs.integrity;
  }
  return entry;
}

export function applySetDefaultEntry(
  doc: RegistryDocument,
  pairs: Record<string, string>
): { next: RegistryDocument; before: MfeEntry | null; after: MfeEntry; target: string } {
  if (!pairs.id) throw new Error('--default-entry requires id=<id>');
  const next = deepClone(doc);
  const before = next.default.mfes[pairs.id] ? deepClone(next.default.mfes[pairs.id]) : null;
  const after = mfeEntryFromPairs(pairs, '--default-entry');
  next.default.mfes[pairs.id] = after;
  return { next, before, after, target: pairs.id };
}

export function applyAddRollout(
  doc: RegistryDocument,
  pairs: Record<string, string>
): { next: RegistryDocument; before: Rollout | null; after: Rollout; target: string } {
  if (!pairs.ruleId) throw new Error('--add-rollout requires ruleId=<r>');
  if (!pairs.match) throw new Error('--add-rollout requires match=<json>');
  if (!pairs.override) throw new Error('--add-rollout requires override=<json>');
  let match: RolloutMatch;
  let override: Rollout['override'];
  try {
    match = JSON.parse(pairs.match);
  } catch (cause) {
    throw new Error(`--add-rollout match is not valid JSON: ${(cause as Error).message}`);
  }
  try {
    override = JSON.parse(pairs.override);
  } catch (cause) {
    throw new Error(`--add-rollout override is not valid JSON: ${(cause as Error).message}`);
  }
  if (!override || typeof override !== 'object' || !override.mfes) {
    throw new Error('--add-rollout override must be { mfes: { id: entry } }');
  }
  const next = deepClone(doc);
  const idx = next.rollouts.findIndex((r) => r.id === pairs.ruleId);
  const before = idx >= 0 ? deepClone(next.rollouts[idx]) : null;
  const newRule: Rollout = { id: pairs.ruleId, match, override };
  if (idx >= 0) {
    next.rollouts[idx] = newRule;
  } else {
    next.rollouts.push(newRule);
  }
  return { next, before, after: newRule, target: pairs.ruleId };
}

export function applyRemoveRollout(
  doc: RegistryDocument,
  pairs: Record<string, string>
): { next: RegistryDocument; before: Rollout | null; after: null; target: string } {
  if (!pairs.ruleId) throw new Error('--remove-rollout requires ruleId=<r>');
  const next = deepClone(doc);
  const idx = next.rollouts.findIndex((r) => r.id === pairs.ruleId);
  if (idx < 0) {
    throw new Error(`--remove-rollout: no rollout with ruleId="${pairs.ruleId}"`);
  }
  const before = deepClone(next.rollouts[idx]);
  next.rollouts.splice(idx, 1);
  return { next, before, after: null, target: pairs.ruleId };
}

export function applyTenantOverride(
  doc: RegistryDocument,
  pairs: Record<string, string>
): { next: RegistryDocument; before: MfeEntry | null; after: MfeEntry; target: string } {
  if (!pairs.customerId) throw new Error('--tenant-override requires customerId=<c>');
  if (!pairs.mfeId) throw new Error('--tenant-override requires mfeId=<id>');
  if (!pairs.version) throw new Error('--tenant-override requires version=<v>');
  if (!pairs.url) throw new Error('--tenant-override requires url=<u>');
  const next = deepClone(doc);
  if (!next.tenantOverrides[pairs.customerId]) {
    next.tenantOverrides[pairs.customerId] = { mfes: {} };
  }
  const layer = next.tenantOverrides[pairs.customerId];
  const before = layer.mfes[pairs.mfeId] ? deepClone(layer.mfes[pairs.mfeId]) : null;
  const after = mfeEntryFromPairs(
    {
      id: pairs.mfeId,
      version: pairs.version,
      url: pairs.url,
      scope: pairs.scope,
      module: pairs.module,
      integrity: pairs.integrity,
    },
    '--tenant-override'
  );
  layer.mfes[pairs.mfeId] = after;
  return { next, before, after, target: `${pairs.customerId}|${pairs.mfeId}` };
}

export function applyRemoveTenantOverride(
  doc: RegistryDocument,
  pairs: Record<string, string>
): { next: RegistryDocument; before: MfeEntry | null; after: null; target: string } {
  if (!pairs.customerId) throw new Error('--remove-tenant-override requires customerId=<c>');
  if (!pairs.mfeId) throw new Error('--remove-tenant-override requires mfeId=<id>');
  const next = deepClone(doc);
  const layer = next.tenantOverrides[pairs.customerId];
  if (!layer || !layer.mfes[pairs.mfeId]) {
    throw new Error(`--remove-tenant-override: no override for ${pairs.customerId}|${pairs.mfeId}`);
  }
  const before = deepClone(layer.mfes[pairs.mfeId]);
  delete layer.mfes[pairs.mfeId];
  // If the layer is now empty, drop it so the doc validates (a tenant layer
  // with empty `mfes` is a structural error per the registry validator).
  if (Object.keys(layer.mfes).length === 0) {
    delete next.tenantOverrides[pairs.customerId];
  }
  return { next, before, after: null, target: `${pairs.customerId}|${pairs.mfeId}` };
}

/**
 * Roll back `default.mfes[id]` to the value it had BEFORE the most recent
 * change recorded in the audit log.
 *
 * The model is "undo the most recent change": find the most recent audit
 * entry whose `target === id` and whose op is `set-default-entry` OR
 * `rollback`, and set the state to that entry's `before` value. The rollback
 * itself appends a new audit entry whose `before` is the current state and
 * `after` is the restored state, so a subsequent rollback undoes THIS
 * rollback (a rollback stack).
 *
 * `before === null` means "the entry did not exist before that change", which
 * we model on rollback by deleting the entry — keeps the registry shape
 * strict (no entry vs. an entry with sentinel values).
 */
export function applyRollback(
  doc: RegistryDocument,
  log: AuditLog,
  id: string
): { next: RegistryDocument; before: MfeEntry | null; after: MfeEntry | null; target: string } {
  if (!id) throw new Error('--rollback requires id=<mfe-id>');
  const current = doc.default.mfes[id] ?? null;
  let mostRecent: AuditEntry | undefined;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e.target !== id) continue;
    if (e.op === 'set-default-entry' || e.op === 'rollback') {
      mostRecent = e;
      break;
    }
  }
  if (!mostRecent) {
    throw new Error(`--rollback id=${id}: no audit history for "${id}" to roll back to.`);
  }
  const target = (mostRecent.before as MfeEntry | null) ?? null;
  const next = deepClone(doc);
  if (target === null) {
    // Restore "did not exist": delete the entry.
    delete next.default.mfes[id];
  } else {
    next.default.mfes[id] = target;
  }
  return { next, before: current, after: target, target: id };
}

/* ------------------------------------------------------------------------- *
 * Global-asset apply helpers (set core/orchestrator/sharedDepsCss/themes)
 * ------------------------------------------------------------------------- */

/**
 * Apply `core` to a registry document, capturing the prior value (or null)
 * for the audit log. Inlined here (rather than imported from a sibling
 * module) so the schema-collapse leaves the unified CLI free-standing.
 */
function applySetCore(
  doc: RegistryDocument,
  asset: AssetDescriptor
): {
  next: RegistryDocument;
  before: AssetDescriptor | null;
  after: AssetDescriptor;
  target: string;
} {
  const before = doc.core ? { ...doc.core } : null;
  const after: AssetDescriptor = { ...asset };
  const next: RegistryDocument = { ...doc, core: after };
  return { next, before, after, target: 'core' };
}

/** Apply `orchestrator` (mirror of {@link applySetCore}). */
function applySetOrchestrator(
  doc: RegistryDocument,
  asset: AssetDescriptor
): {
  next: RegistryDocument;
  before: AssetDescriptor | null;
  after: AssetDescriptor;
  target: string;
} {
  const before = doc.orchestrator ? { ...doc.orchestrator } : null;
  const after: AssetDescriptor = { ...asset };
  const next: RegistryDocument = { ...doc, orchestrator: after };
  return { next, before, after, target: 'orchestrator' };
}

/** Apply `sharedDepsCss` (mirror of {@link applySetCore}). */
function applySetSharedDepsCss(
  doc: RegistryDocument,
  asset: AssetDescriptor
): {
  next: RegistryDocument;
  before: AssetDescriptor | null;
  after: AssetDescriptor;
  target: string;
} {
  const before = doc.sharedDepsCss ? { ...doc.sharedDepsCss } : null;
  const after: AssetDescriptor = { ...asset };
  const next: RegistryDocument = { ...doc, sharedDepsCss: after };
  return { next, before, after, target: 'sharedDepsCss' };
}

/**
 * Apply a single theme entry. Themes are a MAP keyed by theme name; setting
 * a theme creates the map if absent and either inserts or replaces the named
 * entry. The audit `target` is the full key path (`themes.<name>`) so the
 * operator can grep history for one theme without scanning all themes.
 */
function applySetTheme(
  doc: RegistryDocument,
  themeName: string,
  asset: AssetDescriptor
): {
  next: RegistryDocument;
  before: AssetDescriptor | null;
  after: AssetDescriptor;
  target: string;
} {
  if (typeof themeName !== 'string' || themeName.length === 0) {
    throw new Error('applySetTheme: themeName must be a non-empty string');
  }
  const themes = doc.themes ?? {};
  const before = themes[themeName] ? { ...themes[themeName] } : null;
  const after: AssetDescriptor = { ...asset };
  const nextThemes: Record<string, AssetDescriptor> = { ...themes, [themeName]: after };
  const next: RegistryDocument = { ...doc, themes: nextThemes };
  return { next, before, after, target: `themes.${themeName}` };
}

/* ------------------------------------------------------------------------- *
 * --check-deps: build-time externals graph
 * ------------------------------------------------------------------------- */

/**
 * Per-plugin externals manifest — the value-edges emitted by `build_mfe` for
 * one plugin. The CLI reads `${externalsDir}/${id}.externals.json`. Format is
 * a JSON object with a `requires` array of peer ids. A missing file means
 * "no edges" (defensive — first deploy may not have it).
 */
export interface ExternalsFile {
  /** Plugin ids this plugin imports at build time (peer-plugin value-edges). */
  requires: string[];
  /** Optional contractVersion this plugin was built against (defaults: OSD major.minor). */
  contractVersion?: string;
}

export interface CheckDepsResult {
  ok: boolean;
  /**
   * One offender per unsatisfiable edge. `from` is the plugin with the edge,
   * `to` the missing/incompatible peer, `reason` an actionable message.
   */
  offenders: Array<{ from: string; to: string; reason: string }>;
}

function readExternals(externalsDir: string, id: string): ExternalsFile | null {
  const path = Path.join(externalsDir, `${id}.externals.json`);
  if (!Fs.existsSync(path)) return null;
  try {
    const parsed = JSON.parse(Fs.readFileSync(path, 'utf8'));
    if (!parsed || !Array.isArray(parsed.requires)) {
      throw new Error('externals file must be { requires: string[] }');
    }
    return parsed as ExternalsFile;
  } catch (cause) {
    throw new Error(`Failed to read externals at ${path}: ${(cause as Error).message}`);
  }
}

/**
 * Validate the would-be RESOLVED registry's inter-plugin dependency graph
 * against the build-time externals manifests. Resolves the doc with default
 * dimensions (`customerId: "default", userBucket: 0`) so the check applies to
 * the steady-state shape; tenant/rollout-only ids are added to the resolved
 * set so an override never silently breaks a peer.
 *
 * `expectedContractVersion` defaults to the running OSD major.minor (caller
 * passes it explicitly to keep this function pure and testable).
 */
export function checkDependencyGraph(
  doc: RegistryDocument,
  externalsDir: string,
  expectedContractVersion: string
): CheckDepsResult {
  // Resolved set under default dimensions.
  const resolved = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
  const resolvedIds = new Set(resolved.mfes.map((m) => m.id));

  // Also include any id that ONLY appears in a rollout/tenant layer — an
  // override that introduces a new plugin still needs its peers present.
  for (const rule of doc.rollouts) {
    for (const id of Object.keys(rule.override.mfes)) resolvedIds.add(id);
  }
  for (const customerId of Object.keys(doc.tenantOverrides)) {
    for (const id of Object.keys(doc.tenantOverrides[customerId].mfes)) resolvedIds.add(id);
  }

  const offenders: CheckDepsResult['offenders'] = [];
  for (const id of resolvedIds) {
    const ext = readExternals(externalsDir, id);
    if (!ext) continue; // No edges declared = trivially satisfiable.
    if (ext.contractVersion !== undefined && ext.contractVersion !== expectedContractVersion) {
      offenders.push({
        from: id,
        to: id,
        reason: `built against contractVersion "${ext.contractVersion}", expected "${expectedContractVersion}"`,
      });
    }
    for (const peer of ext.requires) {
      if (!resolvedIds.has(peer)) {
        offenders.push({
          from: id,
          to: peer,
          reason: `peer "${peer}" not present in resolved registry (default dimensions)`,
        });
      }
    }
  }

  return { ok: offenders.length === 0, offenders };
}

/* ------------------------------------------------------------------------- *
 * Audit-log reader + atomic write
 * ------------------------------------------------------------------------- */

function historyPathFor(registryPath: string): string {
  // Adjacent file: `<registry>.history.json`. Keeps the audit log next to the
  // doc it audits without polluting the registry shape.
  return `${registryPath}.history.json`;
}

function readAuditLog(historyPath: string): AuditLog {
  if (!Fs.existsSync(historyPath)) return [];
  try {
    const raw = Fs.readFileSync(historyPath, 'utf8');
    if (raw.trim().length === 0) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`audit log at ${historyPath} is not a JSON array`);
    }
    return parsed as AuditLog;
  } catch (cause) {
    throw new Error(`Failed to read audit log at ${historyPath}: ${(cause as Error).message}`);
  }
}

/**
 * Write `content` to `targetPath` atomically: write to a sibling temp file
 * first, then rename over the target. Same-volume renames are atomic on
 * POSIX, so a process crash mid-write leaves either the old content or the
 * new — never a half-written file.
 */
function writeAtomic(targetPath: string, content: string): void {
  const tmp = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  Fs.writeFileSync(tmp, content);
  Fs.renameSync(tmp, targetPath);
}

/**
 * Commit a successful op: write the new doc + the new audit log atomically.
 * If the doc write succeeds but the history write fails, the doc is rolled
 * back to its pre-op content so the contract holds (atomicity: both or
 * neither).
 */
function commitOp(
  registryPath: string,
  prevDocBytes: string,
  newDoc: RegistryDocument,
  newLog: AuditLog
): void {
  const historyPath = historyPathFor(registryPath);
  const newDocBytes = JSON.stringify(newDoc, null, 2) + '\n';
  const newLogBytes = JSON.stringify(newLog, null, 2) + '\n';

  writeAtomic(registryPath, newDocBytes);
  try {
    writeAtomic(historyPath, newLogBytes);
  } catch (cause) {
    // Roll back the doc write so neither file reflects the partial op.
    try {
      writeAtomic(registryPath, prevDocBytes);
    } catch {
      // If the rollback ALSO fails the operator has bigger problems; surface
      // the original cause so they can recover from backup.
    }
    throw cause;
  }
}

/* ------------------------------------------------------------------------- *
 * Layered authoring + global-asset branch
 * ------------------------------------------------------------------------- */

function deriveDefaultContractVersion(osdVersion: string): string {
  // Major.minor only, e.g. `3.5.0` -> `3.5`. A non-semver input falls back to
  // the input itself so the caller still gets a deterministic value.
  const m = /^(\d+)\.(\d+)/.exec(osdVersion);
  return m ? `${m[1]}.${m[2]}` : osdVersion;
}

/** Default URL prefix the asset descriptor's URL is stamped against. */
const DEFAULT_ASSET_BASE_URL = 'http://localhost:8080';

/**
 * Re-sign a registry document when the operator has set
 * `MFE_REGISTRY_SIGNING_KEY` (and optionally `MFE_REGISTRY_KEY_ID` for the
 * envelope). Phase 12's `signRegistry` canonicalises by stripping `signature`
 * and serializing with sorted keys; the canonicalisation is shape-agnostic,
 * so signing works against the layered + global-asset shape verbatim. Returns
 * the doc unchanged when signing is not enabled.
 */
function maybeReSign(doc: RegistryDocument, env: NodeJS.ProcessEnv): RegistryDocument {
  const secret = env.MFE_REGISTRY_SIGNING_KEY;
  if (typeof secret !== 'string' || secret.length === 0) {
    return doc;
  }
  const keyId =
    typeof env.MFE_REGISTRY_KEY_ID === 'string' && env.MFE_REGISTRY_KEY_ID.length > 0
      ? env.MFE_REGISTRY_KEY_ID
      : 'default';
  const key: RegistrySigningKey = {
    keyId,
    secret,
    algorithm: REGISTRY_SIGNATURE_ALGORITHM,
  };
  // signRegistry is typed `Registry -> Registry` but only manipulates the
  // `signature` field via canonicalRegistryString (which accepts any object).
  // Cast through unknown so the call type-checks; the runtime behaviour is
  // shape-agnostic.
  const signed = signRegistry((doc as unknown) as Parameters<typeof signRegistry>[0], key);
  return (signed as unknown) as RegistryDocument;
}

/**
 * Apply a build manifest to a registry document, returning the apply result
 * (next/before/after/target + the audit op kind). Centralised so the dispatch
 * branch is a single switch.
 */
function applyGlobalAssetFromManifest(
  doc: RegistryDocument,
  manifest: AssetBuildManifest,
  baseUrl: string
): { next: RegistryDocument; before: unknown; after: unknown; target: string; op: AuditOp } {
  const descriptor: AssetDescriptor = manifestToAssetDescriptor(manifest, baseUrl);
  switch (manifest.assetKind) {
    case 'core': {
      const r = applySetCore(doc, descriptor);
      return { ...r, op: 'set-core' };
    }
    case 'orchestrator': {
      const r = applySetOrchestrator(doc, descriptor);
      return { ...r, op: 'set-orchestrator' };
    }
    case 'shared-deps-css': {
      const r = applySetSharedDepsCss(doc, descriptor);
      return { ...r, op: 'set-shared-deps-css' };
    }
    case 'theme': {
      if (!manifest.themeName) {
        throw new Error('applyGlobalAssetFromManifest: theme manifest is missing themeName');
      }
      const r = applySetTheme(doc, manifest.themeName, descriptor);
      return { ...r, op: 'set-theme' };
    }
    default: {
      const exhaustive: never = manifest.assetKind;
      throw new Error(
        `applyGlobalAssetFromManifest: unknown assetKind ${JSON.stringify(exhaustive)}`
      );
    }
  }
}

/** Stable string for the flag actually invoked (for diagnostic messages). */
function flagToString(
  corePath: string | undefined,
  orchestratorPath: string | undefined,
  sharedDepsCssPath: string | undefined,
  themeArgs: { themeName: string; manifestPath: string } | null
): string {
  if (corePath !== undefined) return '--update-core';
  if (orchestratorPath !== undefined) return '--update-orchestrator';
  if (sharedDepsCssPath !== undefined) return '--update-shared-deps-css';
  if (themeArgs !== null) return `--update-theme ${themeArgs.themeName}`;
  return '(unknown)';
}

/**
 * Global-asset branch: --update-core / --update-orchestrator /
 * --update-shared-deps-css / --update-theme. Reads a build-manifest, stamps
 * the resulting descriptor onto the document, re-signs when configured, and
 * commits doc + audit log atomically.
 */
function runGlobalAssetBranch(
  argv: string[],
  env: NodeJS.ProcessEnv,
  out: UpdateCliConsole,
  now: Date
): number {
  try {
    const registryPath = resolveRegistryPath(argv, env);
    const reason = readOption(argv, '--reason');
    const baseUrl =
      readOption(argv, '--cdn-base-url') ?? env.REGISTRY_BASE_URL ?? DEFAULT_ASSET_BASE_URL;

    const prevDocBytes = Fs.readFileSync(registryPath, 'utf8');
    const doc = assertValidRegistryDocument(JSON.parse(prevDocBytes));
    const log = readAuditLog(historyPathFor(registryPath));

    // Resolve the manifest path + which set-* op based on the flag set.
    const corePath = readOption(argv, '--update-core');
    const orchestratorPath = readOption(argv, '--update-orchestrator');
    const sharedDepsCssPath = readOption(argv, '--update-shared-deps-css');
    const themeArgs = readUpdateThemeArgs(argv);
    const flagsSet = [corePath, orchestratorPath, sharedDepsCssPath, themeArgs].filter(
      (v) => v !== undefined && v !== null
    ).length;
    if (flagsSet === 0) {
      throw new Error('No global-asset op specified. Try --help.');
    }
    if (flagsSet > 1) {
      throw new Error(
        'Only one --update-* flag is allowed per invocation ' +
          '(pass them as separate calls so each gets its own audit entry).'
      );
    }

    let manifestPath: string;
    let expectedKind: AssetBuildManifest['assetKind'];
    let expectedThemeName: string | undefined;
    if (corePath !== undefined) {
      manifestPath = corePath;
      expectedKind = 'core';
    } else if (orchestratorPath !== undefined) {
      manifestPath = orchestratorPath;
      expectedKind = 'orchestrator';
    } else if (sharedDepsCssPath !== undefined) {
      manifestPath = sharedDepsCssPath;
      expectedKind = 'shared-deps-css';
    } else {
      // themeArgs is non-null by the flagsSet>=1 check.
      manifestPath = themeArgs!.manifestPath;
      expectedKind = 'theme';
      expectedThemeName = themeArgs!.themeName;
    }

    const manifest = readAssetBuildManifest(manifestPath);
    // Guard against an operator passing the wrong manifest to a flag (e.g.
    // `--update-core <theme manifest>`). A mismatch here is always a CLI bug,
    // never a registry issue.
    if (manifest.assetKind !== expectedKind) {
      throw new Error(
        `${flagToString(corePath, orchestratorPath, sharedDepsCssPath, themeArgs)}: ` +
          `manifest at ${manifestPath} has assetKind="${manifest.assetKind}", expected "${expectedKind}"`
      );
    }
    if (expectedKind === 'theme' && manifest.themeName !== expectedThemeName) {
      throw new Error(
        `--update-theme ${expectedThemeName}: ` +
          `manifest at ${manifestPath} has themeName="${manifest.themeName}", expected "${expectedThemeName}"`
      );
    }

    // Apply the change in memory.
    const applied = applyGlobalAssetFromManifest(doc, manifest, baseUrl);

    // Validate strictly before any write — a malformed mutation must NEVER
    // corrupt the on-disk doc.
    assertValidRegistryDocument(applied.next);

    // Re-sign when MFE_REGISTRY_SIGNING_KEY is set (matches Phase 12's signing
    // posture: if the registry is signed today, it stays signed after every op).
    const signedDoc = maybeReSign(applied.next, env);

    const entry: AuditEntry = {
      timestamp: now.toISOString(),
      op: applied.op,
      target: applied.target,
      before: applied.before,
      after: applied.after,
      ...(reason !== undefined ? { reason } : {}),
    };
    const newLog = [...log, entry];
    commitOp(registryPath, prevDocBytes, signedDoc, newLog);

    out.log(`${applied.op} target=${applied.target} -> ${registryPath} (history appended)`);
    return 0;
  } catch (error) {
    out.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

/**
 * Layered-authoring branch: --default-entry / --add-rollout /
 * --remove-rollout / --tenant-override / --remove-tenant-override /
 * --rollback. Atomic: applies in-memory, validates strictly, optionally runs
 * --check-deps, then commits doc + audit log together.
 */
function runLayeredBranch(
  argv: string[],
  repoRoot: string,
  env: NodeJS.ProcessEnv,
  out: UpdateCliConsole,
  now: Date
): number {
  try {
    const registryPath = resolveRegistryPath(argv, env);
    const reason = readOption(argv, '--reason');

    const prevDocBytes = Fs.readFileSync(registryPath, 'utf8');
    const doc = assertValidRegistryDocument(JSON.parse(prevDocBytes));
    const log = readAuditLog(historyPathFor(registryPath));

    let result: {
      next: RegistryDocument;
      before: unknown;
      after: unknown;
      target: string;
      op: AuditOp;
    };

    if (argv.includes('--default-entry')) {
      const idx = argv.indexOf('--default-entry');
      const { pairs } = parseKeyValuePairs(argv, idx + 1);
      const r = applySetDefaultEntry(doc, pairs);
      result = { ...r, op: 'set-default-entry' };
    } else if (argv.includes('--add-rollout')) {
      const idx = argv.indexOf('--add-rollout');
      const { pairs } = parseKeyValuePairs(argv, idx + 1);
      const r = applyAddRollout(doc, pairs);
      result = { ...r, op: 'add-rollout' };
    } else if (argv.includes('--remove-rollout')) {
      const idx = argv.indexOf('--remove-rollout');
      const { pairs } = parseKeyValuePairs(argv, idx + 1);
      const r = applyRemoveRollout(doc, pairs);
      result = { ...r, op: 'remove-rollout' };
    } else if (argv.includes('--tenant-override')) {
      const idx = argv.indexOf('--tenant-override');
      const { pairs } = parseKeyValuePairs(argv, idx + 1);
      const r = applyTenantOverride(doc, pairs);
      result = { ...r, op: 'set-tenant-override' };
    } else if (argv.includes('--remove-tenant-override')) {
      const idx = argv.indexOf('--remove-tenant-override');
      const { pairs } = parseKeyValuePairs(argv, idx + 1);
      const r = applyRemoveTenantOverride(doc, pairs);
      result = { ...r, op: 'remove-tenant-override' };
    } else if (argv.includes('--rollback')) {
      const idx = argv.indexOf('--rollback');
      const { pairs } = parseKeyValuePairs(argv, idx + 1);
      const id = pairs.id;
      const r = applyRollback(doc, log, id);
      result = { ...r, op: 'rollback' };
    } else {
      throw new Error('No layered op specified. Try --help.');
    }

    // Validate the would-be doc strictly before writing — a malformed mutation
    // is a CLI bug + must NOT corrupt the on-disk doc.
    assertValidRegistryDocument(result.next);

    // --check-deps gate (optional; rejects with non-zero exit + no write).
    if (argv.includes('--check-deps')) {
      const externalsDir =
        readOption(argv, '--externals-dir') ?? Path.join(Path.dirname(registryPath), 'externals');
      const expectedContractVersion =
        readOption(argv, '--contract-version') ??
        deriveDefaultContractVersion(readOsdVersion(repoRoot));
      const check = checkDependencyGraph(result.next, externalsDir, expectedContractVersion);
      if (!check.ok) {
        out.error(
          `--check-deps: dependency graph unsatisfiable (${check.offenders.length} offender(s)):`
        );
        for (const o of check.offenders) {
          out.error(`  ${o.from} -> ${o.to}: ${o.reason}`);
        }
        return 2;
      }
    }

    const entry: AuditEntry = {
      timestamp: now.toISOString(),
      op: result.op,
      target: result.target,
      before: result.before,
      after: result.after,
      ...(reason !== undefined ? { reason } : {}),
    };
    const newLog = [...log, entry];
    commitOp(registryPath, prevDocBytes, result.next, newLog);

    out.log(`${result.op} target=${result.target} -> ${registryPath} (history appended)`);
    return 0;
  } catch (error) {
    out.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

/**
 * Read `<repoRoot>/package.json` and return its `version`. Falls back to
 * `'0.0.0'` when the file cannot be read so `--check-deps` still produces a
 * deterministic contractVersion derivation when called against a test stub.
 */
function readOsdVersion(repoRoot: string): string {
  try {
    const pkg = JSON.parse(Fs.readFileSync(Path.join(repoRoot, 'package.json'), 'utf8')) as {
      version?: unknown;
    };
    if (typeof pkg.version === 'string' && pkg.version.length > 0) {
      return pkg.version;
    }
  } catch {
    /* ignore */
  }
  return '0.0.0';
}

/* ------------------------------------------------------------------------- *
 * Entry point
 * ------------------------------------------------------------------------- */

/**
 * Entry point for the unified `update_registry` CLI. Dispatches to one of the
 * three branches based on argv. Returns the process exit code.
 *
 * `--help` / `-h` prints usage and returns 0.
 *
 * The signature mirrors the prior unified `runUpdateCli` so that
 * `scripts/update_registry.js` (and any other thin bootstrap script) can call
 * this directly without a dispatcher.
 *
 * @param argv CLI arguments (typically `process.argv.slice(2)`)
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 * @param env environment to read MFE_REGISTRY_PATH / REGISTRY_BASE_URL /
 *   MFE_REGISTRY_SIGNING_KEY / MFE_REGISTRY_KEY_ID from
 * @param out console surface (injectable for tests)
 * @param now timestamp for `generatedAt` / audit-entry timestamps (injectable for tests)
 * @returns 0 (success), 1 (validation/IO error), 2 (--check-deps reject)
 */
export function runUpdateCli(
  argv: string[],
  repoRoot: string,
  env: NodeJS.ProcessEnv = process.env,
  out: UpdateCliConsole = console,
  now: Date = new Date()
): number {
  if (argv.includes('--help') || argv.includes('-h')) {
    out.log(USAGE);
    return 0;
  }

  // Global-asset branch wins over layered when both flag families are
  // (mistakenly) mixed: this matches the prior unified-CLI dispatch
  // order. Mixing them is a CLI bug; each branch independently rejects the
  // foreign flags via "No <kind> op specified" so the operator gets a clear
  // error. The bulk-writer branch is the default catch-all (full regen,
  // --from-manifest, --plugin); the unused V1_STYLE_FLAGS constant
  // documents what those flag names are without participating in dispatch.
  void V1_STYLE_FLAGS;
  if (hasAny(argv, GLOBAL_ASSET_FLAGS)) {
    return runGlobalAssetBranch(argv, env, out, now);
  }
  if (hasAny(argv, LAYERED_FLAGS)) {
    return runLayeredBranch(argv, repoRoot, env, out, now);
  }
  return runV1StyleBranch(argv, repoRoot, env, out, now);
}
