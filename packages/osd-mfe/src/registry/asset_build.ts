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
 * Build-side staging for the FOUR global asset categories.
 *
 * Pure library: given a source artifact on disk, content-address it
 * (`sha256[:12]` for the directory segment, `sha384` SRI for integrity), copy
 * it into a hash-versioned staging tree under `target/mfe-{core,bootstrap,
 * themes/<name>,shared-deps-css}/<hash>/`, and emit a sibling
 * `build-manifest.json` describing the staged shape. The deploy CLI (Story 2)
 * reads the staging dir + manifest and uploads to the CDN; the update CLI
 * (Story 2) reads the manifest and stamps the registry document. The harness CDN
 * (registry_server.js) serves the same staged paths so dev parity holds.
 *
 * NO runtime change — this is pure scaffolding. The staged paths are NEVER
 * referenced by the OSD boot (Stories 3-7 wire them in); the existing
 * `/bundles/...` server-hosted paths continue to serve verbatim.
 *
 * Key design choices (mirror the Phase-4 plugin-asset pipeline so global assets
 * use the same hash + SRI semantics):
 *  - `sha256(<primary-file>).slice(0, 12)` for the immutable path segment,
 *    identical to `deploy/plan.ts` per-plugin contentHash. Same input bytes
 *    yield the same directory; an unchanged build produces an idempotent stage.
 *  - `computeIntegrity(<primary-file>)` for the SRI integrity, sourced from
 *    `registry/generate.ts` (single source of truth: full-regen, per-plugin
 *    deploy, AND global asset staging all produce byte-identical SRI for the same
 *    input).
 *  - `version = <osdVersion>+<contentHash>`, matching how
 *    `generateRegistry`/`buildDeployPlan` version plugin remotes.
 *  - Build manifest is `<stagingDir>/build-manifest.json`. The downstream
 *    deploy and registry CLIs accept the staging dir OR an explicit
 *    `--manifest-path` and resolve the rest from the manifest.
 */

import { createHash } from 'crypto';
import Fs from 'fs';
import Path from 'path';

import { computeIntegrity } from './generate';
import { AssetDescriptor } from './schema';

/** Build-manifest schema version; bump on incompatible shape changes. */
export const ASSET_BUILD_MANIFEST_SCHEMA_VERSION = 1;

/** The four asset kinds Story 2 introduces. */
export type AssetKind = 'core' | 'orchestrator' | 'theme' | 'shared-deps-css';

/**
 * One staged file (mirrors `deploy/plan.PlannedFile` but rooted at the
 * staging dir). Stored as POSIX-style relative paths for cross-platform
 * stability; the harness server and deploy CLI translate to OS paths.
 */
export interface StagedFile {
  /** Absolute path to the file under the staging dir. */
  localPath: string;
  /** Path of the file relative to the staging dir (posix). */
  relativePath: string;
}

/** The build-manifest.json document shape. */
export interface AssetBuildManifest {
  schemaVersion: number;
  generatedAt: string;
  /** The asset category staged (see {@link AssetKind}). */
  assetKind: AssetKind;
  /** Theme name when `assetKind === 'theme'`; absent otherwise. */
  themeName?: string;
  /** First 12 hex chars of `sha256(<primary-file>)`. */
  contentHash: string;
  /** SRI integrity (`sha384-...`) over the UNCOMPRESSED primary file. */
  integrity: string;
  /** Version label `<osdVersion>+<contentHash>` (matches plugin remotes). */
  version: string;
  /** Absolute path to the staging directory containing the staged files. */
  stagingDir: string;
  /** The primary file's name inside the staging dir (e.g. `core.entry.js`). */
  primaryFile: string;
  /** All staged files under `stagingDir`, sorted by relativePath. */
  files: StagedFile[];
}

/** Options for {@link stageAsset}. */
export interface StageAssetOptions {
  /** Absolute path to the OSD repo root (drives default target dirs). */
  repoRoot: string;
  /** The asset category to stage. */
  assetKind: AssetKind;
  /** Required when `assetKind === 'theme'`; the theme name (`light`/`dark`/...). */
  themeName?: string;
  /**
   * Absolute path to the source artifact. Defaults vary by kind:
   *   - core: `<repoRoot>/src/core/target/public/core.entry.js`
   *   - orchestrator: `<repoRoot>/target/mfe-bootstrap/osd_bootstrap_mfe.js`
   *   - theme: `<repoRoot>/src/core/server/core_app/assets/legacy_<name>_theme.css`
   *   - shared-deps-css: `<repoRoot>/packages/osd-ui-shared-deps/target/osd-ui-shared-deps.css`
   */
  sourcePath?: string;
  /**
   * OSD version label used as the `version` prefix (defaults to the value in
   * `<repoRoot>/package.json`).
   */
  osdVersion?: string;
  /**
   * Override the target directory the staged files land under. Defaults to
   * `<repoRoot>/target/mfe-{core,bootstrap,themes/<name>,shared-deps-css}`.
   * (The `<hash>/` segment is appended inside.)
   */
  targetRoot?: string;
  /** Timestamp stamped onto the manifest (defaults to now). Injectable for tests. */
  now?: Date;
}

/**
 * Read `<repoRoot>/package.json` and return its `version`. Mirrors
 * `deploy/plan.ts:readOsdVersion` to keep the version label consistent.
 */
function readOsdVersion(repoRoot: string): string {
  const pkgPath = Path.join(repoRoot, 'package.json');
  const pkg = JSON.parse(Fs.readFileSync(pkgPath, 'utf8')) as { version?: unknown };
  if (typeof pkg.version !== 'string' || pkg.version.length === 0) {
    throw new Error(`Could not read a version string from ${pkgPath}`);
  }
  return pkg.version;
}

/**
 * Compute the default source path for an asset kind, relative to `repoRoot`.
 * Surface used by the CLI so an operator can build "everything in the tree"
 * without spelling out paths.
 */
export function defaultSourcePath(
  repoRoot: string,
  assetKind: AssetKind,
  themeName?: string
): string {
  switch (assetKind) {
    case 'core':
      return Path.join(repoRoot, 'src', 'core', 'target', 'public', 'core.entry.js');
    case 'orchestrator':
      return Path.join(repoRoot, 'target', 'mfe-bootstrap', 'osd_bootstrap_mfe.js');
    case 'theme': {
      if (!themeName || themeName.length === 0) {
        throw new Error('defaultSourcePath: themeName is required for assetKind="theme"');
      }
      return Path.join(
        repoRoot,
        'src',
        'core',
        'server',
        'core_app',
        'assets',
        `legacy_${themeName}_theme.css`
      );
    }
    case 'shared-deps-css':
      return Path.join(
        repoRoot,
        'packages',
        'osd-ui-shared-deps',
        'target',
        'osd-ui-shared-deps.css'
      );
    default: {
      // Exhaustiveness check: a new kind added without updating this switch is
      // a TypeScript error here.
      const exhaustive: never = assetKind;
      throw new Error(`defaultSourcePath: unknown assetKind ${JSON.stringify(exhaustive)}`);
    }
  }
}

/**
 * Compute the default `<repoRoot>/target/mfe-...` root for an asset kind.
 * The `<hash>/` immutable segment is appended below the returned path.
 */
export function defaultTargetRoot(
  repoRoot: string,
  assetKind: AssetKind,
  themeName?: string
): string {
  switch (assetKind) {
    case 'core':
      return Path.join(repoRoot, 'target', 'mfe-core');
    case 'orchestrator':
      // Use the same root the existing flat orchestrator bundle lands at
      // (packages/osd-mfe/dev/build_bootstrap.js) so callers see both the flat path
      // (`target/mfe-bootstrap/osd_bootstrap_mfe.js`) and the hash-versioned
      // path (`target/mfe-bootstrap/<hash>/osd_bootstrap_mfe.js`) side by side.
      return Path.join(repoRoot, 'target', 'mfe-bootstrap');
    case 'theme': {
      if (!themeName || themeName.length === 0) {
        throw new Error('defaultTargetRoot: themeName is required for assetKind="theme"');
      }
      return Path.join(repoRoot, 'target', 'mfe-themes', themeName);
    }
    case 'shared-deps-css':
      return Path.join(repoRoot, 'target', 'mfe-shared-deps-css');
    default: {
      const exhaustive: never = assetKind;
      throw new Error(`defaultTargetRoot: unknown assetKind ${JSON.stringify(exhaustive)}`);
    }
  }
}

/**
 * The default primary filename (the file that drives the content hash + SRI).
 * For each kind this matches the source artifact's name on disk.
 */
function defaultPrimaryFilename(assetKind: AssetKind, themeName?: string): string {
  switch (assetKind) {
    case 'core':
      return 'core.entry.js';
    case 'orchestrator':
      return 'osd_bootstrap_mfe.js';
    case 'theme': {
      if (!themeName || themeName.length === 0) {
        throw new Error('defaultPrimaryFilename: themeName is required for assetKind="theme"');
      }
      return `legacy_${themeName}_theme.css`;
    }
    case 'shared-deps-css':
      return 'osd-ui-shared-deps.css';
    default: {
      const exhaustive: never = assetKind;
      throw new Error(`defaultPrimaryFilename: unknown assetKind ${JSON.stringify(exhaustive)}`);
    }
  }
}

/**
 * Stage one global asset: content-address its primary file, copy it (and any
 * sibling files needed by the asset) into a hash-versioned tree, and emit
 * `<stagingDir>/build-manifest.json`. Returns the manifest in-memory so the
 * caller can pass it straight to the deploy/registry CLIs.
 *
 * Idempotent: re-staging the same source bytes yields the SAME hash and the
 * SAME staging tree (overwriting unchanged files), so an operator can run
 * `build_mfe --core` repeatedly without churn.
 *
 * NOT a Module Federation build — there is no compilation here, just a
 * content-addressed copy + manifest write. The plugin pipeline that DOES
 * compile (`buildAllMfe`) is unchanged.
 *
 * @throws Error when the source file is missing or unreadable
 */
export function stageAsset(options: StageAssetOptions): AssetBuildManifest {
  const {
    repoRoot,
    assetKind,
    themeName,
    sourcePath: explicitSource,
    osdVersion: explicitOsdVersion,
    targetRoot: explicitTargetRoot,
    now: explicitNow,
  } = options;

  if (assetKind === 'theme' && (!themeName || themeName.length === 0)) {
    throw new Error('stageAsset: themeName is required when assetKind="theme"');
  }

  const sourcePath = explicitSource ?? defaultSourcePath(repoRoot, assetKind, themeName);
  if (!Fs.existsSync(sourcePath)) {
    throw new Error(
      `stageAsset(${assetKind}${themeName ? `:${themeName}` : ''}): ` +
        `source artifact not found at ${sourcePath}. ` +
        `Build it first (see docs/19-PHASE16-RESULTS.md for the per-kind build commands).`
    );
  }

  const bytes = Fs.readFileSync(sourcePath);
  // sha256[:12] — identical to `deploy/plan.ts` and `registry/generate.ts`, so
  // the staged path is content-addressed and an unchanged build is a no-op.
  const contentHash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  // SRI over the SAME uncompressed bytes — single source of truth for plugin
  // remotes and global assets alike, so the registry's integrity field always
  // matches what the browser sees.
  const integrity = computeIntegrity(bytes);
  const osdVersion = explicitOsdVersion ?? readOsdVersion(repoRoot);
  const version = `${osdVersion}+${contentHash}`;
  const now = explicitNow ?? new Date();

  const targetRoot = explicitTargetRoot ?? defaultTargetRoot(repoRoot, assetKind, themeName);
  const stagingDir = Path.join(targetRoot, contentHash);
  Fs.mkdirSync(stagingDir, { recursive: true });

  const primaryFile = defaultPrimaryFilename(assetKind, themeName);
  const primaryStagedPath = Path.join(stagingDir, primaryFile);
  Fs.writeFileSync(primaryStagedPath, bytes);

  // Only one staged file per asset for now. The shape (StagedFile[]) is kept
  // plural for forward compatibility with Story 6's font/asset CSS-referenced
  // siblings, should they prove necessary — if Story 6 needs to ship a theme
  // CSS alongside font files, this is where they get added without changing
  // the manifest shape.
  const files: StagedFile[] = [
    {
      localPath: primaryStagedPath,
      relativePath: primaryFile,
    },
  ];

  const manifest: AssetBuildManifest = {
    schemaVersion: ASSET_BUILD_MANIFEST_SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    assetKind,
    ...(themeName !== undefined ? { themeName } : {}),
    contentHash,
    integrity,
    version,
    stagingDir,
    primaryFile,
    files,
  };

  const manifestPath = Path.join(stagingDir, 'build-manifest.json');
  Fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return manifest;
}

/**
 * Read + validate a {@link AssetBuildManifest} from disk. Throws with a
 * clear message on any shape violation so a bad manifest cannot poison the
 * deploy/registry CLIs that consume it.
 */
export function readAssetBuildManifest(manifestPath: string): AssetBuildManifest {
  const raw = Fs.readFileSync(manifestPath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new Error(
      `readAssetBuildManifest(${manifestPath}): malformed JSON: ${(cause as Error).message}`
    );
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`readAssetBuildManifest(${manifestPath}): not an object`);
  }
  const obj = parsed as Record<string, unknown>;
  const errors: string[] = [];
  if (obj.schemaVersion !== ASSET_BUILD_MANIFEST_SCHEMA_VERSION) {
    errors.push(
      `schemaVersion must equal ${ASSET_BUILD_MANIFEST_SCHEMA_VERSION} ` +
        `(got ${JSON.stringify(obj.schemaVersion)})`
    );
  }
  const kind = obj.assetKind;
  if (
    kind !== 'core' &&
    kind !== 'orchestrator' &&
    kind !== 'theme' &&
    kind !== 'shared-deps-css'
  ) {
    errors.push(
      `assetKind must be core|orchestrator|theme|shared-deps-css (got ${JSON.stringify(kind)})`
    );
  }
  if (kind === 'theme' && (typeof obj.themeName !== 'string' || obj.themeName.length === 0)) {
    errors.push('themeName must be a non-empty string when assetKind="theme"');
  }
  for (const field of ['contentHash', 'integrity', 'version', 'stagingDir', 'primaryFile']) {
    if (typeof obj[field] !== 'string' || (obj[field] as string).length === 0) {
      errors.push(`${field} must be a non-empty string`);
    }
  }
  if (typeof obj.integrity === 'string' && !obj.integrity.startsWith('sha384-')) {
    errors.push(`integrity must start with "sha384-" (got ${JSON.stringify(obj.integrity)})`);
  }
  if (!Array.isArray(obj.files) || obj.files.length === 0) {
    errors.push('files must be a non-empty array of { localPath, relativePath }');
  }
  if (errors.length > 0) {
    throw new Error(
      `readAssetBuildManifest(${manifestPath}): invalid manifest:\n  - ${errors.join('\n  - ')}`
    );
  }
  return parsed as AssetBuildManifest;
}

/**
 * Convert a {@link AssetBuildManifest} into the {@link AssetDescriptor}
 * that lands in the registry, given a base URL the asset is published under.
 *
 * The URL shape mirrors the harness routes (`/core/<hash>/...`,
 * `/orchestrator/<hash>/...`, `/themes/<name>/<hash>/...`,
 * `/shared-deps/css/<hash>/...`) so the same descriptor works against the
 * local mock CDN (`http://localhost:8080`) AND the production CDN
 * (`https://<cf>.cloudfront.net/<keyPrefix>`). The deploy CLI is the
 * authoritative source of the `baseUrl` it actually published to.
 */
export function manifestToAssetDescriptor(
  manifest: AssetBuildManifest,
  baseUrl: string
): AssetDescriptor {
  const normalized = baseUrl.replace(/\/+$/, '');
  let pathSegment: string;
  switch (manifest.assetKind) {
    case 'core':
      pathSegment = `core/${manifest.contentHash}/${manifest.primaryFile}`;
      break;
    case 'orchestrator':
      pathSegment = `orchestrator/${manifest.contentHash}/${manifest.primaryFile}`;
      break;
    case 'theme': {
      if (!manifest.themeName) {
        throw new Error('manifestToAssetDescriptor: themeName missing on theme manifest');
      }
      pathSegment = `themes/${manifest.themeName}/${manifest.contentHash}/${manifest.primaryFile}`;
      break;
    }
    case 'shared-deps-css':
      pathSegment = `shared-deps/css/${manifest.contentHash}/${manifest.primaryFile}`;
      break;
    default: {
      const exhaustive: never = manifest.assetKind;
      throw new Error(`manifestToAssetDescriptor: unknown assetKind ${JSON.stringify(exhaustive)}`);
    }
  }
  return {
    url: `${normalized}/${pathSegment}`,
    integrity: manifest.integrity,
    version: manifest.version,
  };
}
