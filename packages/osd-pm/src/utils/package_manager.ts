/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync } from 'fs';
import { basename, dirname, join, resolve } from 'path';

import { log } from './log';

export type PackageManagerName = 'yarn' | 'npm';

export const YARN_LOCKFILE = 'yarn.lock';
export const NPM_LOCKFILE = 'package-lock.json';

// Used when no lockfile is found anywhere up the tree. Stays `yarn` until the
// repository itself switches to npm, so this change is behavior-neutral.
const DEFAULT_PACKAGE_MANAGER: PackageManagerName = 'yarn';

export interface InstallOptions {
  /** yarn-style flags as passed by callers, translated per package manager */
  extraArgs?: string[];
}

export interface PackageManager {
  name: PackageManagerName;
  lockfileName: string;
  /** file in node_modules written by a successful install */
  integrityMarker: string;
  command(): { file: string; prefixArgs: string[] };
  installArgs(options?: InstallOptions): string[];
  addArgs(spec: string, dev: boolean): string[];
  runArgs(script: string, args: string[]): string[];
  /** args that re-sync the lockfile with package.json without touching node_modules */
  syncLockfileArgs(): string[] | undefined;
}

const execpath = () => process.env.npm_execpath || '';

const yarn: PackageManager = {
  name: 'yarn',
  lockfileName: YARN_LOCKFILE,
  integrityMarker: '.yarn-integrity',
  command() {
    // Reuse the yarn binary that invoked us so the pinned version is used.
    const current = execpath();
    return { file: /yarn/i.test(basename(current)) ? current : 'yarn', prefixArgs: [] };
  },
  installArgs({ extraArgs = [] } = {}) {
    return ['install', '--non-interactive', ...extraArgs];
  },
  addArgs(spec, dev) {
    return ['add', '--non-interactive', spec, ...(dev ? ['--dev'] : [])];
  },
  runArgs(script, args) {
    return ['run', script, ...args];
  },
  syncLockfileArgs() {
    return undefined;
  },
};

const NPM_FLAG_MAP: Record<string, string[]> = {
  '--frozen-lockfile': [],
  '--pure-lockfile': [],
  '--non-interactive': [],
  '--production': ['--omit=dev'],
  '--ignore-optional': ['--omit=optional'],
  '--prefer-offline': ['--prefer-offline'],
  '--no-bin-links': ['--no-bin-links'],
};

const npm: PackageManager = {
  name: 'npm',
  lockfileName: NPM_LOCKFILE,
  integrityMarker: '.package-lock.json',
  command() {
    // Run npm-cli.js with the current node so we don't depend on a shim on PATH
    // (and pick up the npm bundled with the node version OSD selected).
    const current = execpath();
    if (/npm-cli\.js$/.test(current)) return { file: process.execPath, prefixArgs: [current] };
    return { file: 'npm', prefixArgs: [] };
  },
  installArgs({ extraArgs = [] } = {}) {
    // yarn's lockfile-respecting install flags map onto `npm ci`.
    const frozen = extraArgs.includes('--frozen-lockfile') || extraArgs.includes('--pure-lockfile');
    const translated = extraArgs.flatMap((arg) => {
      if (arg in NPM_FLAG_MAP) return NPM_FLAG_MAP[arg];
      log.warning(`[npm] passing through unrecognized install flag: ${arg}`);
      return [arg];
    });
    return [frozen ? 'ci' : 'install', ...translated];
  },
  addArgs(spec, dev) {
    return ['install', spec, '--save-exact', ...(dev ? ['--save-dev'] : [])];
  },
  runArgs(script, args) {
    return args.length ? ['run', script, '--', ...args] : ['run', script];
  },
  syncLockfileArgs() {
    return ['install', '--package-lock-only', '--ignore-scripts'];
  },
};

export const packageManagers: Record<PackageManagerName, PackageManager> = { yarn, npm };

/**
 * Find the lockfile that owns `directory`: the nearest directory at or above it
 * holding one. Workspace packages therefore inherit the root's lockfile, and
 * external plugins with their own lockfile keep theirs.
 */
export function findLockfile(
  directory: string
): { packageManager: PackageManager; path: string } | undefined {
  let current = resolve(directory);
  while (true) {
    const npmPath = join(current, NPM_LOCKFILE);
    const yarnPath = join(current, YARN_LOCKFILE);
    const hasNpm = existsSync(npmPath);
    const hasYarn = existsSync(yarnPath);
    if (hasNpm && hasYarn) {
      throw new Error(
        `Both ${NPM_LOCKFILE} and ${YARN_LOCKFILE} exist in ${current}; remove the one that is not in use.`
      );
    }
    if (hasNpm) return { packageManager: npm, path: npmPath };
    if (hasYarn) return { packageManager: yarn, path: yarnPath };

    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

export function detectPackageManager(directory: string): PackageManager {
  return findLockfile(directory)?.packageManager ?? packageManagers[DEFAULT_PACKAGE_MANAGER];
}

/** `name/version` of the package manager running this process, e.g. `yarn/1.22.19` */
export function getRunningPackageManagerVersion(): string {
  const ua = process.env.npm_config_user_agent || '';
  const m = ua.match(/^(yarn|npm)\/(\S+)/);
  return m ? `${m[1]}/${m[2]}` : '';
}
