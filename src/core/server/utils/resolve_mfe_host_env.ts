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
 * Resolve the running HOST environment for the version-compatibility contract:
 * the OSD core version + the shared-singleton semver ranges the host provides.
 * The server injects this into the MFE bootstrap page
 * (`window.__osdMfe__.host`) so the browser classifier can compare each remote's
 * recorded `builtAgainst`/`compat` metadata against the host.
 *
 * This is the core-side producer of the host side of the contract, derived from
 * the SAME sources the registry generator used to compute each remote's
 * `builtAgainst` (`packages/osd-mfe/src/registry/compat.ts` ->
 * `getMfeSharedConfig`): the OSD core version from the package, and the
 * shared-singleton `requiredVersion` ranges from the repo root `package.json`
 * filtered to the `@osd/ui-shared-deps` shareable package roots. The server
 * cannot import `@osd/mfe` (it is not a dependency of `src/`), so — exactly like
 * `resolve_compat_policy.ts` mirrors the browser policy resolver — this mirrors
 * the small slice of `@osd/mfe`'s shared-deps derivation needed here.
 *
 * Because the host ranges are derived identically to the remotes' `builtAgainst`
 * ranges, in the happy path (every remote built from one tree) the host SATISFIES
 * every remote and all classify COMPATIBLE; incremental deploys and skew
 * simulation scenarios make them diverge and the classifier detects it.
 */

import Path from 'path';
import Fs from 'fs';
import * as UiSharedDeps from '@osd/ui-shared-deps';

/**
 * The running host environment a remote is classified against: the OSD core
 * version + the shared-singleton versions/ranges the host provides. Matches the
 * browser-side `HostEnvironment` shape in `@osd/mfe`'s compat classifier.
 */
export interface MfeHostEnv {
  /** The running OSD core version (semver string, e.g. `"3.5.0"`). */
  osdVersion: string;
  /** Shared-singleton root -> the semver range the host provides (e.g. `react` -> `^16.14.0`). */
  sharedDeps: Record<string, string>;
}

/**
 * Resolve the package "root" specifier for a module request (mirrors
 * `@osd/mfe`'s `mfe_shared_deps.packageRootOf`).
 */
function packageRootOf(specifier: string): string {
  if (specifier.startsWith('@')) {
    return specifier.split('/').slice(0, 2).join('/');
  }
  return specifier.split('/')[0];
}

/**
 * A specifier is a "shareable root" when it is exactly a package name (no
 * sub-path import) — the set Module Federation shares as singletons (mirrors
 * `@osd/mfe`'s `isShareableRoot`).
 */
function isShareableRoot(specifier: string): boolean {
  return packageRootOf(specifier) === specifier;
}

/**
 * The `@osd/ui-shared-deps` external specifiers that map 1:1 to MF shared
 * singletons (top-level package names only), derived from `UiSharedDeps.externals`
 * (mirrors `@osd/mfe`'s `getSharedPackageRoots`).
 */
function getSharedPackageRoots(): string[] {
  return Object.keys(UiSharedDeps.externals)
    .filter(isShareableRoot)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Map a raw `package.json` version value to a Module Federation `requiredVersion`
 * range, or `false` when it cannot be expressed as a range (e.g. an `npm:` alias).
 * Mirrors `@osd/mfe`'s `toRequiredVersion`.
 */
function toRequiredVersion(rawVersion: string | undefined): string | false {
  if (!rawVersion) {
    return false;
  }
  return rawVersion.includes(':') ? false : rawVersion;
}

/**
 * Read the merged `dependencies`/`devDependencies` from the OSD root
 * `package.json` (mirrors `@osd/mfe`'s `readRootDependencyVersions`).
 */
function readRootDependencyVersions(repoRoot: string): Record<string, string> {
  const pkgPath = Path.resolve(repoRoot, 'package.json');
  const pkg = JSON.parse(Fs.readFileSync(pkgPath, 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  return { ...(pkg.devDependencies ?? {}), ...(pkg.dependencies ?? {}) };
}

/**
 * Compute the host's shared-singleton ranges, keyed by package root. Only roots
 * with an expressible semver range are included (roots whose `requiredVersion`
 * is `false` are omitted — there is no range to compare), matching the remotes'
 * `builtAgainst.sharedDeps`.
 *
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 */
export function computeHostSharedDeps(repoRoot: string): Record<string, string> {
  const versions = readRootDependencyVersions(repoRoot);
  const sharedDeps: Record<string, string> = {};
  for (const root of getSharedPackageRoots()) {
    const range = toRequiredVersion(versions[root]);
    if (typeof range === 'string' && range.length > 0) {
      sharedDeps[root] = range;
    }
  }
  return sharedDeps;
}

/**
 * Resolve the running host environment to inject into the MFE bootstrap page.
 *
 * @param osdVersion the running OSD core version (`env.packageInfo.version`)
 * @param repoRoot absolute path to the OSD repo root (`env.homeDir`)
 * @returns the {@link MfeHostEnv} (osdVersion + shared-singleton ranges)
 */
export function resolveMfeHostEnv(osdVersion: string, repoRoot: string): MfeHostEnv {
  return {
    osdVersion,
    sharedDeps: computeHostSharedDeps(repoRoot),
  };
}
