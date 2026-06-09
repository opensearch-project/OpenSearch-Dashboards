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
 * Build the IMMUTABLE, versioned deploy plan for the publish-only CDN deploy
 * (Phase 4, Story 1).
 *
 * This is a PURE library function: it reads the built artifacts under
 * `target/mfe/<id>/` and `packages/osd-ui-shared-deps/target/`, content-addresses
 * each remote, and returns the exact set of S3 keys + CloudFront URLs that the
 * deploy WOULD publish. It performs no uploads, no AWS calls, and no writes — the
 * CLI layer (`deploy_cli.ts`) consumes this plan to either preview (`--dry-run`)
 * or execute the uploads.
 *
 * Versioning matches the registry generator EXACTLY (see `registry/generate.ts`):
 * `contentHash = sha256(remoteEntry.js)[:12]` and `version = <osdVersion>+<hash>`,
 * so the key a remote is published under is content-addressed and a registry
 * entry can point straight at it. Artifacts therefore land at immutable paths
 * `<prefix>/<id>/<contentHash>/...` and are never overwritten in place; shared
 * deps land at `<prefix>/shared-deps/<osdVersion>/...`. See docs/01-MFE-DESIGN.md §6.
 */

import { createHash } from 'crypto';
import Fs from 'fs';
import Path from 'path';

import { ResolvedCdnConfig } from './cdn_config';

/** Module Federation exposes the plugin public entry under this module key. */
const REMOTE_ENTRY_FILE = 'remoteEntry.js';

/** A single artifact file mapped to its absolute S3 key (including the prefix). */
export interface PlannedFile {
  /** Absolute path to the local source file. */
  localPath: string;
  /** Path of the file relative to its artifact root (posix, for display). */
  relativePath: string;
  /** Full S3 object key (prefix + versioned dir + relative path), no leading slash. */
  key: string;
}

/** Publish plan for one plugin's Module Federation remote. */
export interface RemotePlan {
  /** Plugin id (e.g. `inspector`). */
  id: string;
  /** Content-addressed version `<osdVersion>+<contentHash>` (matches the registry). */
  version: string;
  /** First 12 hex chars of `sha256(remoteEntry.js)` — the immutable path segment. */
  contentHash: string;
  /** Absolute path to the local `target/mfe/<id>` directory. */
  localDir: string;
  /** S3 key prefix the whole directory is published under: `<prefix>/<id>/<hash>`. */
  keyPrefix: string;
  /** Convenience: full key of the remoteEntry.js (`<keyPrefix>/remoteEntry.js`). */
  remoteEntryKey: string;
  /** Public CloudFront URL of the remoteEntry.js. */
  cdnUrl: string;
  /** Every file under `localDir`, mapped to its S3 key. */
  files: PlannedFile[];
}

/** Publish plan for the shared-deps singletons bundle. */
export interface SharedDepsPlan {
  /** Shared-deps version label (the OSD version; matches the registry). */
  version: string;
  /** Absolute path to the local `packages/osd-ui-shared-deps/target` directory. */
  localDir: string;
  /** S3 key prefix the whole directory is published under: `<prefix>/shared-deps/<ver>`. */
  keyPrefix: string;
  /** Public CloudFront base URL of the shared-deps directory (trailing slash). */
  cdnUrl: string;
  /** Every file under `localDir`, mapped to its S3 key. */
  files: PlannedFile[];
}

/** The full set of artifacts the deploy would publish. */
export interface DeployPlan {
  /** OSD version prefix used for all versions. */
  osdVersion: string;
  /** Resolved (provisioned) CDN coordinates the plan targets. */
  cdn: ResolvedCdnConfig;
  /** One entry per built plugin remote, sorted by id. */
  remotes: RemotePlan[];
  /** The shared-deps publish plan. */
  sharedDeps: SharedDepsPlan;
}

/** Options for {@link buildDeployPlan}. */
export interface BuildDeployPlanOptions {
  /** Absolute path to the OpenSearch Dashboards repo root. */
  repoRoot: string;
  /** Resolved provisioned CDN coordinates. */
  cdn: ResolvedCdnConfig;
  /** OSD version prefix; defaults to `<repoRoot>/package.json` `version`. */
  osdVersion?: string;
  /** Built remotes directory; defaults to `<repoRoot>/target/mfe`. */
  targetMfeDir?: string;
  /** Built shared-deps directory; defaults to `<repoRoot>/packages/osd-ui-shared-deps/target`. */
  sharedDepsDir?: string;
}

/** Read `<repoRoot>/package.json` and return its `version` (mirrors generate.ts). */
function readOsdVersion(repoRoot: string): string {
  const pkgPath = Path.join(repoRoot, 'package.json');
  const pkg = JSON.parse(Fs.readFileSync(pkgPath, 'utf8')) as { version?: unknown };
  if (typeof pkg.version !== 'string' || pkg.version.length === 0) {
    throw new Error(`Could not read a version string from ${pkgPath}`);
  }
  return pkg.version;
}

/**
 * Join non-empty segments into an S3 key (posix `/`, no leading/trailing slash).
 * An empty {@link ResolvedCdnConfig.keyPrefix} is tolerated (segments skipped).
 */
function joinKey(...segments: string[]): string {
  return segments
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.replace(/^\/+/, '').replace(/\/+$/, ''))
    .filter((segment) => segment.length > 0)
    .join('/');
}

/** Join a base URL and key segments into a full URL (single slashes). */
function joinUrl(baseUrl: string, ...segments: string[]): string {
  const key = joinKey(...segments);
  return key.length > 0 ? `${baseUrl.replace(/\/+$/, '')}/${key}` : baseUrl.replace(/\/+$/, '');
}

/**
 * List every file under `dir` recursively, returning posix relative paths sorted
 * for deterministic output. Symlinks are followed via `statSync` on entries.
 */
function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  const walk = (current: string, prefix: string): void => {
    const entries = Fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const rel = prefix.length > 0 ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(Path.join(current, entry.name), rel);
      } else if (entry.isFile()) {
        out.push(rel);
      }
    }
  };
  walk(dir, '');
  return out.sort((a, b) => a.localeCompare(b));
}

/**
 * Discover plugin ids that have a built `remoteEntry.js`, sorted (mirrors the
 * registry generator's `discoverBuiltRemotes`).
 */
function discoverBuiltRemotes(targetMfeDir: string): string[] {
  if (!Fs.existsSync(targetMfeDir)) {
    return [];
  }
  return Fs.readdirSync(targetMfeDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter((id) => Fs.existsSync(Path.join(targetMfeDir, id, REMOTE_ENTRY_FILE)))
    .sort((a, b) => a.localeCompare(b));
}

/** Map every file under `localDir` to a {@link PlannedFile} under `keyPrefix`. */
function planFiles(localDir: string, keyPrefix: string): PlannedFile[] {
  return listFilesRecursive(localDir).map((relativePath) => ({
    localPath: Path.join(localDir, relativePath),
    relativePath,
    key: joinKey(keyPrefix, relativePath),
  }));
}

/**
 * Build the immutable, versioned {@link DeployPlan} from the built artifacts.
 *
 * @param options see {@link BuildDeployPlanOptions}
 * @returns the plan describing every S3 key + CloudFront URL to publish
 * @throws Error when no built remotes or no shared-deps artifacts are found
 */
export function buildDeployPlan(options: BuildDeployPlanOptions): DeployPlan {
  const { repoRoot, cdn } = options;
  const osdVersion = options.osdVersion ?? readOsdVersion(repoRoot);
  const targetMfeDir = options.targetMfeDir ?? Path.join(repoRoot, 'target', 'mfe');
  const sharedDepsDir =
    options.sharedDepsDir ?? Path.join(repoRoot, 'packages', 'osd-ui-shared-deps', 'target');

  const ids = discoverBuiltRemotes(targetMfeDir);
  if (ids.length === 0) {
    throw new Error(
      `No built Module Federation remotes found under ${targetMfeDir} ` +
        `(expected <id>/${REMOTE_ENTRY_FILE}). Run \`node scripts/build_mfe --all\` first.`
    );
  }

  const remotes: RemotePlan[] = ids.map((id) => {
    const localDir = Path.join(targetMfeDir, id);
    const remoteEntryPath = Path.join(localDir, REMOTE_ENTRY_FILE);
    const bytes = Fs.readFileSync(remoteEntryPath);
    // sha256[:12] — identical to registry/generate.ts so the published path is
    // content-addressed and the registry entry can point straight at it.
    const contentHash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
    const keyPrefix = joinKey(cdn.keyPrefix, id, contentHash);
    const remoteEntryKey = joinKey(keyPrefix, REMOTE_ENTRY_FILE);

    return {
      id,
      version: `${osdVersion}+${contentHash}`,
      contentHash,
      localDir,
      keyPrefix,
      remoteEntryKey,
      cdnUrl: joinUrl(cdn.baseUrl, remoteEntryKey),
      files: planFiles(localDir, keyPrefix),
    };
  });

  if (!Fs.existsSync(sharedDepsDir)) {
    throw new Error(
      `No built shared-deps found under ${sharedDepsDir}. Build @osd/ui-shared-deps first.`
    );
  }
  const sharedKeyPrefix = joinKey(cdn.keyPrefix, 'shared-deps', osdVersion);
  const sharedFiles = planFiles(sharedDepsDir, sharedKeyPrefix);
  if (sharedFiles.length === 0) {
    throw new Error(`Shared-deps directory ${sharedDepsDir} is empty; nothing to publish.`);
  }
  const sharedDeps: SharedDepsPlan = {
    version: osdVersion,
    localDir: sharedDepsDir,
    keyPrefix: sharedKeyPrefix,
    cdnUrl: `${joinUrl(cdn.baseUrl, sharedKeyPrefix)}/`,
    files: sharedFiles,
  };

  return { osdVersion, cdn, remotes, sharedDeps };
}
