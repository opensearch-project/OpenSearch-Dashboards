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
 * Phase 9 compatibility CONTRACT — generation-time DATA (Story 1).
 *
 * Computes the `builtAgainst` + `compat` metadata stamped into every registry
 * entry, deterministically and from the SAME sources the build itself uses, so
 * the recorded data faithfully describes the artifact:
 *  - `builtAgainst.osdVersion`  — the OSD core version from the repo `package.json`.
 *  - `builtAgainst.sharedDeps`  — the shared-singleton `requiredVersion` ranges
 *    derived from `@osd/ui-shared-deps` (via {@link getMfeSharedConfig}). Only
 *    roots with an expressible semver range are recorded; roots whose MF runtime
 *    check is disabled (`requiredVersion === false`: `npm:` aliases / unknown
 *    root versions) are omitted because there is no range to satisfy.
 *  - `compat`                   — the host-compatibility declaration, defaulting
 *    to "same OSD major.minor" (`minCoreVersion = <major>.<minor>.0`,
 *    `compatibleCoreRange = <major>.<minor>.x`), the locked OSD-core axis.
 *
 * This module is PURE/deterministic given a repo root: it only READS files and
 * RETURNS data. No enforcement happens here — Story 2 (classifier) and Story 3
 * (bootstrap policy) consume this data; Story 1 just produces it.
 */

import Fs from 'fs';
import Path from 'path';

import { BuiltAgainst, CompatDeclaration } from './schema';
import { getMfeSharedConfig } from '../mfe_shared_deps';

/** Read `<repoRoot>/package.json` `version` (the OSD core version). */
function readOsdVersion(repoRoot: string): string {
  const pkgPath = Path.join(repoRoot, 'package.json');
  const pkg = JSON.parse(Fs.readFileSync(pkgPath, 'utf8')) as { version?: unknown };
  if (typeof pkg.version !== 'string' || pkg.version.length === 0) {
    throw new Error(`Could not read a version string from ${pkgPath}`);
  }
  return pkg.version;
}

/**
 * The shared-singleton `requiredVersion` ranges the remotes are built against,
 * derived from `@osd/ui-shared-deps`. Only roots with an expressible semver
 * range (a `string` `requiredVersion`) are included — roots whose MF check is
 * disabled (`false`) are omitted (no range to satisfy). Deterministic; keys are
 * already sorted by {@link getMfeSharedConfig}.
 *
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 */
export function computeBuiltAgainstSharedDeps(repoRoot: string): Record<string, string> {
  const shared = getMfeSharedConfig(repoRoot);
  const result: Record<string, string> = {};
  for (const root of Object.keys(shared)) {
    const { requiredVersion } = shared[root];
    if (typeof requiredVersion === 'string' && requiredVersion.length > 0) {
      result[root] = requiredVersion;
    }
  }
  return result;
}

/**
 * Parse `"<major>.<minor>.<...>"` into its numeric major/minor segments.
 *
 * @throws Error when `version` does not start with `<major>.<minor>`
 */
function majorMinorOf(version: string): { major: number; minor: number } {
  const match = /^(\d+)\.(\d+)\b/.exec(version);
  if (!match) {
    throw new Error(`Cannot derive major.minor from version "${version}"`);
  }
  return { major: Number(match[1]), minor: Number(match[2]) };
}

/**
 * The DEFAULT host-compatibility declaration for a remote built against
 * `osdVersion`: "same OSD major.minor" — the locked OSD-core compatibility axis.
 *
 * - `minCoreVersion`       = `"<major>.<minor>.0"` (inclusive floor)
 * - `compatibleCoreRange`  = `"<major>.<minor>.x"` (any patch within that minor)
 *
 * @param osdVersion the built-against OSD core version (e.g. `"3.5.0"`)
 */
export function defaultCompat(osdVersion: string): CompatDeclaration {
  const { major, minor } = majorMinorOf(osdVersion);
  return {
    minCoreVersion: `${major}.${minor}.0`,
    compatibleCoreRange: `${major}.${minor}.x`,
  };
}

/** The fully-computed compatibility metadata for one generation run. */
export interface CompatMetadata {
  builtAgainst: BuiltAgainst;
  compat: CompatDeclaration;
}

/**
 * Compute the `{ builtAgainst, compat }` metadata for the current repo. Because
 * every remote is built from one tree, this metadata is identical for every
 * entry in a single generation run, so callers compute it once and stamp it onto
 * each entry.
 *
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 * @param osdVersionOverride optional explicit OSD version (defaults to repo `package.json`)
 */
export function computeCompatMetadata(
  repoRoot: string,
  osdVersionOverride?: string
): CompatMetadata {
  const osdVersion = osdVersionOverride ?? readOsdVersion(repoRoot);
  return {
    builtAgainst: {
      osdVersion,
      sharedDeps: computeBuiltAgainstSharedDeps(repoRoot),
    },
    compat: defaultCompat(osdVersion),
  };
}
