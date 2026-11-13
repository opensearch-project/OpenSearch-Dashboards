/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { YarnLock } from './yarn_lock';

interface NpmLockEntry {
  name?: string;
  version?: string;
  resolved?: string;
  integrity?: string;
  link?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

interface NpmLockfile {
  lockfileVersion?: number;
  packages?: Record<string, NpmLockEntry>;
}

const NODE_MODULES = 'node_modules/';

/** Resolve `name` from the package at `fromPath` the way Node walks node_modules. */
function resolveFrom(packages: Record<string, NpmLockEntry>, fromPath: string, name: string) {
  let base = fromPath;
  while (true) {
    const candidate = base ? `${base}/${NODE_MODULES}${name}` : `${NODE_MODULES}${name}`;
    if (packages[candidate]) return { path: candidate, entry: packages[candidate] };
    if (!base) return undefined;

    // Drop the innermost `node_modules/<pkg>`; a top-level package or a
    // workspace folder falls back to the root node_modules.
    const idx = base.lastIndexOf(`/${NODE_MODULES}`);
    base = idx >= 0 ? base.slice(0, idx) : '';
  }
}

/**
 * Convert an npm v2/v3 lockfile into the `name@range` keyed shape osd-pm
 * already uses for yarn.lock. Each dependency edge in the lock becomes a key
 * pointing at the version that edge resolves to. When the same `name@range`
 * resolves differently in two subtrees the first one wins, which only affects
 * the bootstrap cache checksum and the lodash/single-version diagnostics.
 */
export function npmLockToYarnLock(contents: string): YarnLock {
  const lock: NpmLockfile = JSON.parse(contents);
  if (!lock.packages || (lock.lockfileVersion ?? 0) < 2) {
    throw new Error('package-lock.json must be lockfileVersion 2 or newer');
  }

  const packages = lock.packages;
  const result: YarnLock = {};

  for (const [fromPath, entry] of Object.entries(packages)) {
    if (entry.link) continue;
    const edges = {
      ...entry.devDependencies,
      ...entry.optionalDependencies,
      ...entry.dependencies,
    };

    for (const [name, range] of Object.entries(edges)) {
      const key = `${name}@${range}`;
      if (result[key]) continue;

      const target = resolveFrom(packages, fromPath, name);
      if (!target) continue; // optional dependency not installed for this platform
      const dep = target.entry;
      // Links are workspace projects, which osd-pm resolves itself.
      if (dep.link || !dep.version) continue;

      result[key] = {
        version: dep.version,
        resolved: dep.resolved || '',
        integrity: dep.integrity || '',
        ...(dep.dependencies ? { dependencies: dep.dependencies } : {}),
        ...(dep.optionalDependencies ? { optionalDependencies: dep.optionalDependencies } : {}),
      };
    }
  }

  return result;
}
