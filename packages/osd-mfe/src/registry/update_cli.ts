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
 * `update_registry` CLI logic (Phase 2, Story 4).
 *
 * This wraps the pure {@link generateRegistry} library in a DATA-ONLY writer: it
 * either regenerates the whole registry from the built Module Federation remotes,
 * registers a CDN revision from a deploy manifest (`--from-manifest`), or patches
 * a single plugin's version/url, then validates and writes the registry JSON.
 * Versions stay DATA — the operator flips a version by editing data through this
 * tool, never by changing code. See docs/01-MFE-DESIGN.md §5–§6.
 *
 * The ONLY filesystem write this performs is the registry data file (resolved
 * from `--registry-path` or `MFE_REGISTRY_PATH`). It never touches OSD source,
 * the built artifacts, or the running server.
 *
 * The CLI logic lives here (TypeScript, unit-tested) so `scripts/update_registry.js`
 * can stay a thin, non-transpiled bootstrap, mirroring `scripts/build_mfe.js` ->
 * `cli.ts`.
 */

import Fs from 'fs';
import Path from 'path';

import { generateRegistry } from './generate';
import { computeCompatMetadata, CompatMetadata } from './compat';
import { assertValidRegistry, MfeEntry, Registry, SCHEMA_VERSION } from './schema';

const USAGE = `Usage: node scripts/update_registry [options]

Write/patch the external MFE registry DATA file. Versions are DATA: this tool is
the only sanctioned way to (re)generate or flip a version — no code change, no
rebuild, no restart.

Modes:
  (default)              Regenerate the whole registry from the built remotes
                         under target/mfe/<id>/remoteEntry.js (content-hash
                         versions). Use --base-url to point the remote URLs at a
                         specific origin (e.g. the local :8080 mock CDN). This is
                         also how you RESTORE the local origin after pointing at
                         the CDN: re-run with --base-url http://localhost:8080.
  --from-manifest        Register a CDN revision: read the deploy-manifest.json
                         emitted by \`scripts/deploy_mfe\` and point every
                         remoteEntry at its CONTENT-ADDRESSED CloudFront URL
                         (<baseUrl>/<prefix>/<id>/<hash>/remoteEntry.js) and
                         sharedDeps at the CDN shared-deps URL. Versions/scope/
                         module (and SRI, when the current registry still pins
                         the same content hash) are carried over — this only
                         repoints the URLs. Data-only: no upload, no AWS call.
  --from-manifest --merge
                         MERGE a (typically single-plugin) manifest into the
                         EXISTING registry: patch ONLY the entries present in the
                         manifest, leave every OTHER entry byte-identical, and
                         stamp FRESH compat per patched entry. Preserves the
                         existing sharedDeps when the manifest has none (a
                         single-plugin publish). The per-plugin registration path
                         (Phase 10): ship one plugin without re-registering 57.
  --plugin <id>          Patch a SINGLE existing entry in place. Requires at
                         least one of --version / --url. The entry's integrity
                         (SRI) is dropped because the recorded hash no longer
                         matches the manually supplied data.

Options:
  --base-url <url>       Origin the remotes are served from (full-regen mode).
                         Defaults to REGISTRY_BASE_URL env or http://localhost:8080.
  --from-manifest        Register the CDN revision from a deploy manifest (see above).
  --merge                With --from-manifest: patch only the manifest's entries
                         into the existing registry (others byte-identical) and
                         stamp fresh compat, instead of replacing the whole map.
  --manifest-path <p>    deploy-manifest.json to read (--from-manifest mode).
                         Defaults to deploy-manifest.json next to the registry file.
  --plugin <id>          Plugin id to patch (e.g. "inspector").
  --version <version>    New version string for the patched plugin.
  --url <url>            New remoteEntry URL for the patched plugin.
  --registry-path <p>    Registry data file to write. Defaults to the
                         MFE_REGISTRY_PATH env var.
  --help, -h             Show this message

Restore the local origin (undo --from-manifest):
  node scripts/update_registry --base-url http://localhost:8080
  (or set REGISTRY_BASE_URL). A snapshot is also kept at
  registry/registry.local.json — copy it over registry/registry.json to restore.`;

/** Minimal console surface, injectable so tests can assert/silence output. */
export interface UpdateCliConsole {
  log: (message: string) => void;
  error: (message: string) => void;
}

/**
 * Read a `--flag <value>` option from argv.
 *
 * @returns the value, or `undefined` when the flag is absent
 * @throws Error when the flag is present but its value is missing/another flag
 */
function readOption(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('-')) {
    throw new Error(`${flag} requires a value (e.g. "${flag} <value>")`);
  }
  return value;
}

/**
 * Resolve the registry data file path: `--registry-path` arg wins over the
 * `MFE_REGISTRY_PATH` env var (mirrors {@link FileRegistryProvider}). The package
 * never hardcodes the absolute workspace path.
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

/**
 * Patch a single existing entry's version and/or remoteEntry URL in place.
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
): Registry {
  if (version === undefined && url === undefined) {
    throw new Error(
      `--plugin "${pluginId}" requires at least one of --version <v> or --url <u> to patch.`
    );
  }

  const raw = Fs.readFileSync(registryPath, 'utf8');
  const registry = assertValidRegistry(JSON.parse(raw));

  const existing = registry.mfes[pluginId];
  if (existing === undefined) {
    const known = Object.keys(registry.mfes).sort().join(', ');
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

  registry.mfes[pluginId] = patched;
  registry.generatedAt = now.toISOString();
  return registry;
}

/**
 * The subset of the `deploy-manifest.json` document (emitted by
 * `scripts/deploy_mfe`, see {@link import('../deploy').DeployManifest}) that the
 * registry writer consumes. Declared independently here — and validated at
 * runtime by {@link assertValidManifest} — because the manifest is EXTERNAL data
 * read from disk, not a trusted in-process value.
 */
interface ManifestMfeEntry {
  /** Content-addressed version `<osdVersion>+<contentHash>` (matches the registry). */
  version: string;
  /** First 12 hex chars of `sha256(remoteEntry.js)` — the immutable path segment. */
  contentHash: string;
  /** Public CloudFront URL of the plugin's `remoteEntry.js`. */
  cdnUrl: string;
}

/** The `deploy-manifest.json` fields consumed when registering a CDN revision. */
interface DeployManifestData {
  /** Manifest schema version; must equal {@link DEPLOY_MANIFEST_SCHEMA_VERSION}. */
  schemaVersion: number;
  /** CDN coordinates the artifacts were published to (recorded for traceability). */
  cdn: { baseUrl: string };
  /**
   * Shared-deps singletons published location. OPTIONAL: a single-plugin publish
   * (Phase 10 Story 1, `deploy_mfe --plugin <id>`) skips shared-deps, so its
   * manifest carries NO `sharedDeps` key. When absent, a full REPLACE
   * (`--from-manifest`) is rejected (it would drop the registry's sharedDeps),
   * while a `--merge` preserves the existing registry's `sharedDeps` untouched.
   */
  sharedDeps?: { version: string; cdnUrl: string };
  /** Map of plugin id -> its published CDN descriptor. */
  mfes: Record<string, ManifestMfeEntry>;
}

/**
 * The deploy-manifest schema version this writer understands. Kept in sync with
 * `deploy/deploy_cli.ts` (`DEPLOY_MANIFEST_SCHEMA_VERSION`); a newer manifest is
 * rejected with a clear error rather than silently mis-read.
 */
const DEPLOY_MANIFEST_SCHEMA_VERSION = 1;

/** Type guard: a plain (non-null, non-array) object. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** True when `value` is a non-empty string. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validate a parsed deploy manifest against the fields the registry writer needs
 * and narrow it to {@link DeployManifestData}. The manifest is external data, so
 * this throws a precise, operator-actionable error rather than trusting it.
 *
 * @throws Error listing every missing/invalid field
 */
function assertValidManifest(value: unknown, manifestPath: string): DeployManifestData {
  const errors: string[] = [];

  if (!isObject(value)) {
    throw new Error(`Deploy manifest ${manifestPath} is not a JSON object.`);
  }
  if (value.schemaVersion !== DEPLOY_MANIFEST_SCHEMA_VERSION) {
    errors.push(
      `schemaVersion must equal ${DEPLOY_MANIFEST_SCHEMA_VERSION} ` +
        `(got ${JSON.stringify(value.schemaVersion)}) — regenerate with this tool's deploy_mfe`
    );
  }
  if (!isObject(value.cdn) || !isNonEmptyString(value.cdn.baseUrl)) {
    errors.push('cdn.baseUrl must be a non-empty string');
  }
  if (value.sharedDeps !== undefined) {
    // Optional: a single-plugin publish omits it. Validate only when present.
    if (!isObject(value.sharedDeps)) {
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
  if (!isObject(value.mfes)) {
    errors.push('mfes must be an object keyed by plugin id');
  } else {
    const ids = Object.keys(value.mfes);
    if (ids.length === 0) {
      errors.push('mfes must contain at least one entry');
    }
    for (const id of ids) {
      const entry = value.mfes[id];
      if (!isObject(entry)) {
        errors.push(`mfes.${id} must be an object`);
        continue;
      }
      if (!isNonEmptyString(entry.cdnUrl)) {
        errors.push(`mfes.${id}.cdnUrl must be a non-empty string`);
      }
      if (!isNonEmptyString(entry.version)) {
        errors.push(`mfes.${id}.version must be a non-empty string`);
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
 * together and describe the same revision). Mirrors `deploy_cli.ts`.
 */
function resolveManifestPath(argv: string[], registryPath: string): string {
  const fromArg = readOption(argv, '--manifest-path');
  return fromArg ?? Path.join(Path.dirname(registryPath), 'deploy-manifest.json');
}

/**
 * Best-effort read of the CURRENT registry's `mfes` map, used to carry forward
 * `scope`/`module`/`integrity` when registering a CDN revision. Returns `{}` when
 * the file is missing or invalid — registering the CDN revision must not depend
 * on a pre-existing (or valid) registry; it just means SRI is omitted.
 */
function readExistingMfes(registryPath: string): Record<string, MfeEntry> {
  try {
    const raw = Fs.readFileSync(registryPath, 'utf8');
    return assertValidRegistry(JSON.parse(raw)).mfes;
  } catch {
    return {};
  }
}

/**
 * Build a {@link Registry} from a deploy manifest, pointing each remoteEntry at
 * its content-addressed CloudFront URL and `sharedDeps` at the CDN shared-deps
 * URL. This ONLY repoints URLs — `version`, `scope` and `module` are preserved
 * from `priorMfes` when present, else derived to the canonical values produced
 * by {@link generateRegistry} (`scope = osdMfe_<id>`, `module = ./public`).
 *
 * `integrity` (SRI) is carried over from the current registry entry ONLY when it
 * still pins the SAME content (its `version`, i.e. `<osdVersion>+<contentHash>`,
 * equals the manifest's). Because the CDN object is byte-identical to the build
 * that produced that hash, the recorded SRI hash remains valid against the CDN
 * bytes. When the versions differ (or there is no prior entry), `integrity` is
 * omitted — it is optional in the schema (recommended in prod).
 *
 * @param manifest validated deploy manifest data
 * @param now timestamp to stamp into `generatedAt`
 * @param priorMfes the current registry's `mfes` map (pass `{}` when none)
 * @param compatMeta Phase 9 compatibility metadata to stamp onto every entry
 *   (`builtAgainst`/`compat`). Optional: when omitted, entries carry no compat
 *   data (treated as UNKNOWN by the classifier). It is generation-time DATA
 *   computed from the repo, identical for every entry built from one tree.
 * @returns an in-memory registry (validate + write it separately)
 */
export function buildRegistryFromManifest(
  manifest: DeployManifestData,
  now: Date,
  priorMfes: Record<string, MfeEntry> = {},
  compatMeta?: CompatMetadata
): Registry {
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
    schemaVersion: SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    sharedDeps: {
      url: manifest.sharedDeps.cdnUrl,
      version: manifest.sharedDeps.version,
    },
    mfes,
  };
}

/**
 * Build a single {@link MfeEntry} from one manifest entry. Shared by the full
 * REPLACE ({@link buildRegistryFromManifest}) and single-entry MERGE
 * ({@link mergeRegistryFromManifest}) paths so both repoint URLs, derive
 * scope/module, carry SRI (only when the content hash is unchanged), and stamp
 * compat identically.
 *
 * `integrity` (SRI) is carried over from `prior` ONLY when it still pins the
 * SAME content (its `version` equals the manifest's): the CDN object is then
 * byte-identical to the build that produced that hash, so the recorded SRI hash
 * remains valid. Otherwise it is omitted (optional in the schema).
 *
 * Compat is stamped FRESH from `compatMeta` when provided (Phase 10 merge stamps
 * newly-computed metadata); when omitted it carries forward whatever `prior`
 * recorded so re-registering never silently drops the contract data.
 */
function buildMfeEntry(
  id: string,
  entry: ManifestMfeEntry,
  prior: MfeEntry | undefined,
  compatMeta?: CompatMetadata
): MfeEntry {
  const carryIntegrity =
    prior !== undefined && prior.version === entry.version && prior.integrity !== undefined;

  return {
    version: entry.version,
    remoteEntry: entry.cdnUrl,
    scope: prior?.scope ?? `osdMfe_${id}`,
    module: prior?.module ?? './public',
    ...(carryIntegrity ? { integrity: prior!.integrity } : {}),
    // Phase 9: stamp freshly-computed compat metadata when provided, else carry
    // forward whatever the prior registry recorded (so re-registering a CDN
    // revision never silently drops the contract data).
    ...(compatMeta?.builtAgainst ?? prior?.builtAgainst
      ? { builtAgainst: compatMeta?.builtAgainst ?? prior!.builtAgainst }
      : {}),
    ...(compatMeta?.compat ?? prior?.compat ? { compat: compatMeta?.compat ?? prior!.compat } : {}),
  };
}

/**
 * MERGE a deploy manifest into an EXISTING registry (Phase 10 Story 2): patch
 * ONLY the entries present in `manifest.mfes` into `existing.mfes`, leaving every
 * other entry BYTE-IDENTICAL, and stamp FRESH compat (`compatMeta`) onto each
 * patched entry. This is what lets a single plugin be re-registered on its own
 * cadence without disturbing the other 57.
 *
 * Unlike {@link buildRegistryFromManifest} (which REPLACES the whole `mfes` map),
 * this preserves untouched entries object-for-object (so they re-serialize
 * identically) and preserves the existing `sharedDeps` when the manifest has
 * none (a single-plugin publish). When the manifest DOES carry `sharedDeps`
 * (a full publish), it is repointed at the manifest's CDN location.
 *
 * @param existing the current, already-validated registry to patch into
 * @param manifest validated deploy manifest data
 * @param now timestamp to stamp into `generatedAt`
 * @param compatMeta freshly-computed Phase 9 compat metadata stamped onto each
 *   merged entry (omitted only when the repo can't be read; then prior compat is
 *   carried forward)
 * @returns a NEW in-memory registry (validate + write it separately)
 */
export function mergeRegistryFromManifest(
  existing: Registry,
  manifest: DeployManifestData,
  now: Date,
  compatMeta?: CompatMetadata
): Registry {
  // Shallow-copy preserves key order and keeps untouched entries as the SAME
  // object references, so they re-serialize byte-identically.
  const mfes: Record<string, MfeEntry> = { ...existing.mfes };
  for (const id of Object.keys(manifest.mfes)) {
    mfes[id] = buildMfeEntry(id, manifest.mfes[id], existing.mfes[id], compatMeta);
  }

  return {
    schemaVersion: existing.schemaVersion,
    generatedAt: now.toISOString(),
    // Preserve the existing sharedDeps when the (single-plugin) manifest omits
    // it; repoint it only when the manifest carries one (a full publish).
    sharedDeps:
      manifest.sharedDeps !== undefined
        ? { url: manifest.sharedDeps.cdnUrl, version: manifest.sharedDeps.version }
        : existing.sharedDeps,
    mfes,
  };
}

/**
 * Best-effort {@link computeCompatMetadata}: returns `undefined` when the repo
 * cannot be read (e.g. a test stub repoRoot with no `package.json`). Registering
 * a CDN revision must not depend on a readable repo — when metadata can't be
 * computed, {@link buildRegistryFromManifest} carries forward whatever the prior
 * registry recorded. Mirrors the best-effort {@link readExistingMfes}.
 */
function tryComputeCompatMetadata(repoRoot: string): CompatMetadata | undefined {
  try {
    return computeCompatMetadata(repoRoot);
  } catch {
    return undefined;
  }
}

/** Write the registry as pretty JSON (trailing newline) to `registryPath`. */
function writeRegistry(registryPath: string, registry: Registry): void {
  Fs.mkdirSync(Path.dirname(registryPath), { recursive: true });
  Fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

/**
 * Entry point for the `update_registry` CLI. Data-only: validates then writes
 * the registry file and nothing else.
 *
 * @param argv CLI arguments (typically `process.argv.slice(2)`)
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 * @param env environment to read MFE_REGISTRY_PATH / REGISTRY_BASE_URL from
 * @param out console surface (injectable for tests)
 * @param now timestamp for `generatedAt` on patch (injectable for tests)
 * @returns the process exit code (0 = success, non-zero = error)
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

  try {
    const registryPath = resolveRegistryPath(argv, env);
    const pluginId = readOption(argv, '--plugin');
    const fromManifest = argv.includes('--from-manifest');
    const merge = argv.includes('--merge');

    if (merge && !fromManifest) {
      throw new Error('--merge only applies to --from-manifest (it patches manifest entries).');
    }

    let registry: Registry;
    let summary: string;
    if (pluginId !== undefined) {
      const version = readOption(argv, '--version');
      const url = readOption(argv, '--url');
      registry = patchEntry(registryPath, pluginId, version, url, now);
      summary = `Patched "${pluginId}" -> version=${registry.mfes[pluginId].version}, remoteEntry=${registry.mfes[pluginId].remoteEntry}`;
    } else if (fromManifest) {
      const manifestPath = resolveManifestPath(argv, registryPath);
      const manifest = assertValidManifest(
        JSON.parse(Fs.readFileSync(manifestPath, 'utf8')),
        manifestPath
      );
      if (merge) {
        // MERGE: patch only the manifest's entries into the existing registry,
        // stamping FRESH compat. The other entries stay byte-identical. Requires
        // an existing, valid registry to patch into.
        let existing: Registry;
        try {
          existing = assertValidRegistry(JSON.parse(Fs.readFileSync(registryPath, 'utf8')));
        } catch (cause) {
          throw new Error(
            `--merge requires an existing, valid registry at ${registryPath} to patch into ` +
              `(${cause instanceof Error ? cause.message : String(cause)}).`
          );
        }
        registry = mergeRegistryFromManifest(
          existing,
          manifest,
          now,
          tryComputeCompatMetadata(repoRoot)
        );
        summary =
          `Merged CDN revision from ${manifestPath} ` +
          `(${Object.keys(manifest.mfes).length} entrie(s) patched, ` +
          `${Object.keys(registry.mfes).length} total @ ${manifest.cdn.baseUrl})`;
      } else {
        registry = buildRegistryFromManifest(
          manifest,
          now,
          readExistingMfes(registryPath),
          tryComputeCompatMetadata(repoRoot)
        );
        summary =
          `Registered CDN revision from ${manifestPath} ` +
          `(${Object.keys(registry.mfes).length} entrie(s) @ ${manifest.cdn.baseUrl})`;
      }
    } else {
      const baseUrl = readOption(argv, '--base-url');
      registry = generateRegistry({
        repoRoot,
        baseUrl: baseUrl ?? env.REGISTRY_BASE_URL,
      });
      summary = `Regenerated registry with ${Object.keys(registry.mfes).length} entrie(s)`;
    }

    // Defensive re-validate before writing (patchEntry already validates input;
    // this guards generate output and the patched result equally).
    assertValidRegistry(registry);
    writeRegistry(registryPath, registry);

    out.log(`${summary} -> ${registryPath}`);
    return 0;
  } catch (error) {
    out.error(error instanceof Error ? error.message : String(error));
    out.error('');
    out.error(USAGE);
    return 1;
  }
}
