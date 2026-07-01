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
 * Registry generation: scan the built Module Federation artifacts under
 * `target/mfe/<id>/remoteEntry.js` and build a {@link Registry} whose versions
 * are DATA derived from the artifacts (`<osdVersion>+<contentHash>`), never
 * hardcoded. See `packages/osd-mfe/README.md` for the dynamic-registry design.
 *
 * This is a pure library function (no CLI, no process.exit). The CLI wrapper
 * `scripts/update_registry.js` invokes it to produce/refresh the seed
 * `registry/registry.json`. It only READS the built artifacts and RETURNS data —
 * it does not touch the registry file or any OSD source.
 */

import { createHash } from 'crypto';
import Fs from 'fs';
import Path from 'path';

import { MfeEntry, Registry, SCHEMA_VERSION } from './schema';
import { computeCompatMetadata } from './compat';

/** Module Federation exposes the plugin public entry under this module key. */
const EXPOSED_MODULE = './public';

/**
 * Compute the Subresource Integrity hash (`sha384-<base64>`) of an artifact's
 * UNCOMPRESSED bytes.
 *
 * The browser verifies SRI against the DECODED response body, so the hash MUST
 * be computed over the ORIGINAL (pre-gzip) artifact bytes — never the gzipped
 * transit temp the deploy uploads. This is the single source of truth for SRI
 * computation, shared by the full-regen generator ({@link buildEntry}) and the
 * publish-time deploy plan (`deploy/plan.ts`) so both produce IDENTICAL
 * integrity for the same bytes — the canonical registry then carries a correct
 * integrity for every entry, including per-plugin (`--plugin`/`--merge`) deploys.
 *
 * @param bytes the uncompressed artifact bytes (e.g. `remoteEntry.js`)
 * @returns the SRI string `sha384-<base64-digest>`
 */
export function computeIntegrity(bytes: Buffer): string {
  return `sha384-${createHash('sha384').update(bytes).digest('base64')}`;
}

/** Default base URL for the local mock registry/CDN origin (see harness/env.sh). */
const DEFAULT_BASE_URL = 'http://localhost:8080';

/** Options for {@link generateRegistry}. */
export interface GenerateRegistryOptions {
  /** Absolute path to the OpenSearch Dashboards repo root. */
  repoRoot: string;
  /**
   * Base URL the remotes are served from. Defaults to `REGISTRY_BASE_URL` env or
   * {@link DEFAULT_BASE_URL}. Each remoteEntry URL is `<baseUrl>/mfe/<id>/remoteEntry.js`.
   */
  baseUrl?: string;
  /**
   * OSD version prefix for the content-hash version. Defaults to the `version`
   * field of `<repoRoot>/package.json`.
   */
  osdVersion?: string;
  /**
   * Directory holding the built remotes. Defaults to `<repoRoot>/target/mfe`.
   */
  targetMfeDir?: string;
  /** Timestamp to stamp into `generatedAt` (defaults to now). Injectable for tests. */
  now?: Date;
}

/** Read `<repoRoot>/package.json` and return its `version` (the OSD version). */
function readOsdVersion(repoRoot: string): string {
  const pkgPath = Path.join(repoRoot, 'package.json');
  const pkg = JSON.parse(Fs.readFileSync(pkgPath, 'utf8')) as { version?: unknown };
  if (typeof pkg.version !== 'string' || pkg.version.length === 0) {
    throw new Error(`Could not read a version string from ${pkgPath}`);
  }
  return pkg.version;
}

/**
 * List plugin ids that have a built `remoteEntry.js` under `targetMfeDir`,
 * sorted for deterministic output.
 */
function discoverBuiltRemotes(targetMfeDir: string): string[] {
  if (!Fs.existsSync(targetMfeDir)) {
    return [];
  }
  return Fs.readdirSync(targetMfeDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter((id) => Fs.existsSync(Path.join(targetMfeDir, id, 'remoteEntry.js')))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Build the MFE entry for one plugin from its `remoteEntry.js` bytes.
 *
 * The version is `<osdVersion>+<sha256[0:12]>` and the integrity is the SRI
 * `sha384-<base64>` of the same bytes, so flipping a rebuilt artifact naturally
 * changes the version (content addressing) — this is DATA, not a hardcoded value.
 */
function buildEntry(
  id: string,
  remoteEntryPath: string,
  baseUrl: string,
  osdVersion: string
): MfeEntry {
  const bytes = Fs.readFileSync(remoteEntryPath);
  const contentHash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const integrity = computeIntegrity(bytes);

  return {
    version: `${osdVersion}+${contentHash}`,
    remoteEntry: `${baseUrl.replace(/\/+$/, '')}/mfe/${id}/remoteEntry.js`,
    // The Module Federation container's global variable name. It is namespaced
    // with `osdMfe_` (see mfe_rspack_config.ts) so a plugin id (e.g. `console`)
    // can never collide with a browser global on `window`. The browser MFE
    // bootstrap reads `window[scope]` to obtain the container.
    scope: `osdMfe_${id}`,
    module: EXPOSED_MODULE,
    integrity,
  };
}

/**
 * Generate a {@link Registry} from the built Module Federation remotes.
 *
 * @param options see {@link GenerateRegistryOptions}
 * @returns an in-memory registry (validate + write it separately)
 * @throws Error if no built remotes are found under `targetMfeDir`
 */
export function generateRegistry(options: GenerateRegistryOptions): Registry {
  const { repoRoot } = options;
  const baseUrl = options.baseUrl ?? process.env.REGISTRY_BASE_URL ?? DEFAULT_BASE_URL;
  const osdVersion = options.osdVersion ?? readOsdVersion(repoRoot);
  const targetMfeDir = options.targetMfeDir ?? Path.join(repoRoot, 'target', 'mfe');
  const now = options.now ?? new Date();

  const ids = discoverBuiltRemotes(targetMfeDir);
  if (ids.length === 0) {
    throw new Error(
      `No built Module Federation remotes found under ${targetMfeDir} ` +
        `(expected <id>/remoteEntry.js). Run \`node scripts/build_mfe --all\` first.`
    );
  }

  // Compat contract: every remote is built from one tree, so the
  // builtAgainst/compat metadata is identical for every entry — compute it once
  // (reusing the already-resolved osdVersion) and stamp it onto each entry.
  const { builtAgainst, compat } = computeCompatMetadata(repoRoot, osdVersion);

  const mfes: Record<string, MfeEntry> = {};
  for (const id of ids) {
    mfes[id] = {
      ...buildEntry(id, Path.join(targetMfeDir, id, 'remoteEntry.js'), baseUrl, osdVersion),
      builtAgainst,
      compat,
    };
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    sharedDeps: {
      // Shared singletons (`@osd/ui-shared-deps`) are served from the same origin
      // and versioned by the OSD version. This is data and can be repointed later.
      url: `${baseUrl.replace(/\/+$/, '')}/shared-deps/`,
      version: osdVersion,
    },
    mfes,
  };
}
