/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Crypto from 'crypto';
import Fs from 'fs';
import Path from 'path';

import { OpenSearchDashboards } from './opensearch_dashboards';
import { getRunningPackageManagerVersion, NPM_LOCKFILE, YARN_LOCKFILE } from './package_manager';
import { ProjectMap } from './projects';

const FINGERPRINT_VERSION = 2;
const FINGERPRINT_FILENAME = '.osd-bootstrap-fingerprint';

export interface Fingerprint {
  version: number;
  rootLockfile: string;
  rootPackageJson: string;
  projectManifests: string;
  externalPluginLockfiles: string;
  osdPmDist: string;
  nodeVersion: string;
  packageManagerVersion: string;
}

const STRING_FIELDS: Array<keyof Fingerprint> = [
  'rootLockfile',
  'rootPackageJson',
  'projectManifests',
  'externalPluginLockfiles',
  'osdPmDist',
  'nodeVersion',
  'packageManagerVersion',
];

const sha1 = (buf: Buffer | string) => Crypto.createHash('sha1').update(buf).digest('hex');

// Normalize path separators so fingerprints computed on different platforms
// (e.g. Windows vs. POSIX) compare equal for the same logical project layout.
const normalizeRelativePath = (rel: string) => rel.replace(/\\/g, '/');

const readOrEmpty = (p: string): Buffer => {
  try {
    return Fs.readFileSync(p);
  } catch (e: any) {
    if (e?.code === 'ENOENT') return Buffer.alloc(0);
    throw e;
  }
};

// A directory is owned by at most one lockfile type, so hashing both keeps the
// fingerprint valid whichever package manager is in use.
const lockfilesDigest = (dir: string) =>
  sha1(
    Buffer.concat([
      readOrEmpty(Path.join(dir, YARN_LOCKFILE)),
      Buffer.from('\0'),
      readOrEmpty(Path.join(dir, NPM_LOCKFILE)),
    ])
  );

const hasOwnLockfile = (dir: string) =>
  Fs.existsSync(Path.join(dir, YARN_LOCKFILE)) || Fs.existsSync(Path.join(dir, NPM_LOCKFILE));

const fingerprintPath = (osd: OpenSearchDashboards) =>
  Path.join(osd.getAbsolute(), FINGERPRINT_FILENAME);

export function computeFingerprint(osd: OpenSearchDashboards, projects: ProjectMap): Fingerprint {
  const root = osd.getAbsolute();

  const sortedProjects = Array.from(projects.values()).sort((a, b) => a.path.localeCompare(b.path));

  const manifestParts: string[] = [];
  const lockParts: string[] = [];
  for (const project of sortedProjects) {
    const rel = normalizeRelativePath(osd.getRelative(project.path));
    manifestParts.push(`${rel}:${sha1(readOrEmpty(project.packageJsonLocation))}`);
    // External plugins (./plugins/*, ../opensearch-dashboards-extra/*) run
    // their own install against their own lockfile, so any change to that
    // lockfile must invalidate the fingerprint. Workspace projects share the
    // root lockfile and are already covered by rootLockfile, so they're
    // skipped here to avoid double-counting.
    // Newly cloned plugins are caught via projectManifests because their
    // package.json is a new entry in the sorted manifest list.
    if (!project.isWorkspaceProject && !project.isWorkspaceRoot) {
      if (hasOwnLockfile(project.path)) {
        lockParts.push(`${rel}:${lockfilesDigest(project.path)}`);
      }
    }
  }

  return {
    version: FINGERPRINT_VERSION,
    rootLockfile: lockfilesDigest(root),
    rootPackageJson: sha1(readOrEmpty(Path.join(root, 'package.json'))),
    projectManifests: sha1(manifestParts.join('\n')),
    externalPluginLockfiles: sha1(lockParts.join('\n')),
    osdPmDist: sha1(readOrEmpty(Path.join(root, 'packages/osd-pm/dist/index.js'))),
    nodeVersion: process.version,
    packageManagerVersion: getRunningPackageManagerVersion(),
  };
}

export function readFingerprint(osd: OpenSearchDashboards): Fingerprint | null {
  try {
    const raw = Fs.readFileSync(fingerprintPath(osd), 'utf8');
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.version !== FINGERPRINT_VERSION ||
      !STRING_FIELDS.every((k) => typeof parsed[k] === 'string')
    ) {
      return null;
    }
    return parsed as Fingerprint;
  } catch {
    return null;
  }
}

export function writeFingerprint(osd: OpenSearchDashboards, fp: Fingerprint): void {
  try {
    // Atomic write: rename is atomic on POSIX, so an interrupted bootstrap
    // can never leave a half-written fingerprint that readFingerprint would
    // happily parse as valid.
    const finalPath = fingerprintPath(osd);
    const tmpPath = `${finalPath}.tmp`;
    Fs.writeFileSync(tmpPath, JSON.stringify(fp, null, 2));
    Fs.renameSync(tmpPath, finalPath);
  } catch {
    // Non-fatal: fast-path just won't trigger next time.
  }
}

export function deleteFingerprint(osd: OpenSearchDashboards): void {
  try {
    Fs.unlinkSync(fingerprintPath(osd));
  } catch (e: any) {
    if (e?.code !== 'ENOENT') throw e;
  }
}

export function fingerprintsEqual(a: Fingerprint, b: Fingerprint): boolean {
  return (
    a.version === b.version &&
    a.rootLockfile === b.rootLockfile &&
    a.rootPackageJson === b.rootPackageJson &&
    a.projectManifests === b.projectManifests &&
    a.externalPluginLockfiles === b.externalPluginLockfiles &&
    a.osdPmDist === b.osdPmDist &&
    a.nodeVersion === b.nodeVersion &&
    a.packageManagerVersion === b.packageManagerVersion
  );
}
