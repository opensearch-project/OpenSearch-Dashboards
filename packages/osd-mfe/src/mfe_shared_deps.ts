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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import Path from 'path';
import Fs from 'fs';
import * as UiSharedDeps from '@osd/ui-shared-deps';

/**
 * Module Federation `shared` entry for a single dependency.
 *
 * We always consume these from the host's share scope (`import: false`) so the
 * remote never bundles its own fallback copy of React/EUI/etc. — this is what
 * guarantees a single (singleton) instance is used across the host and every
 * remote. `requiredVersion` is informational for the runtime version check;
 * `false` disables the check (used when the root version is an `npm:` alias we
 * cannot express as a semver range).
 */
export interface MfeSharedConfig {
  /** Enforce exactly one instance of this module across host + remotes. */
  singleton: boolean;
  /**
   * Do not provide a local copy — the remote only *consumes* the module from
   * the share scope the host populates. This is what keeps React/EUI out of the
   * remote's own chunks.
   */
  import: false;
  /** Semver range the remote expects, or `false` to skip the runtime check. */
  requiredVersion: string | false;
}

/**
 * The map passed to `ModuleFederationPlugin({ shared })`: module specifier ->
 * shared configuration.
 */
export type MfeSharedMap = Record<string, MfeSharedConfig>;

/**
 * Resolve the package "root" specifier for a module request.
 *
 * - `react`                          -> `react`
 * - `react-dom/server`               -> `react-dom`
 * - `@osd/i18n`                      -> `@osd/i18n`
 * - `@elastic/eui/lib/services`      -> `@elastic/eui`
 */
function packageRootOf(specifier: string): string {
  if (specifier.startsWith('@')) {
    // Scoped package: keep the first two segments (`@scope/name`).
    return specifier.split('/').slice(0, 2).join('/');
  }
  return specifier.split('/')[0];
}

/**
 * A specifier is a "shareable root" when it is exactly a package name (no
 * sub-path import). Sub-paths and JSON imports (e.g. `react-dom/server`,
 * `@elastic/eui/lib/services`, `@elastic/eui/dist/eui_theme_light.json`,
 * `@osd/ui-shared-deps/theme`, `monaco-editor/esm/.../editor.api`) cannot be
 * keyed cleanly as Module Federation shared packages, so they remain plain
 * `externals` that reference the `__osdSharedDeps__` globals.
 */
function isShareableRoot(specifier: string): boolean {
  return packageRootOf(specifier) === specifier;
}

/**
 * The set of `@osd/ui-shared-deps` external specifiers that map 1:1 to Module
 * Federation shared singletons (top-level package names only), derived
 * programmatically from `UiSharedDeps.externals` rather than hardcoded.
 */
export function getSharedPackageRoots(): string[] {
  return Object.keys(UiSharedDeps.externals)
    .filter(isShareableRoot)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * The `@osd/ui-shared-deps` externals map with the shareable package roots
 * removed. Those roots are handled by Module Federation `shared` instead; the
 * remaining sub-path/JSON specifiers keep referencing the `__osdSharedDeps__`
 * globals via webpack/Rspack externals (Module Federation cannot key them).
 *
 * Removing the roots here avoids declaring the same specifier as *both* an
 * external and a shared module (which would be ambiguous).
 */
export function getMfeExternals(): Record<string, string> {
  const sharedRoots = new Set(getSharedPackageRoots());
  const residual: Record<string, string> = {};
  for (const [specifier, target] of Object.entries(UiSharedDeps.externals)) {
    if (!sharedRoots.has(specifier)) {
      residual[specifier] = target;
    }
  }
  return residual;
}

/**
 * Read `dependencies`/`devDependencies` from the OSD root `package.json` so the
 * shared `requiredVersion` values come from the repo root (per the design).
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
 * Map a raw `package.json` version value to a Module Federation
 * `requiredVersion`. Plain semver ranges (`^16.14.0`, `1.0.0`, `31.1.0`) pass
 * through; `npm:`-aliased entries (e.g. `@elastic/eui` ->
 * `npm:@opensearch-project/oui@1.22.1`) cannot be expressed as a range, so the
 * runtime version check is disabled (`false`).
 */
function toRequiredVersion(rawVersion: string | undefined): string | false {
  if (!rawVersion) {
    return false;
  }
  // `npm:` aliases (and any other non-range value) contain a `:` — skip the check.
  return rawVersion.includes(':') ? false : rawVersion;
}

/**
 * Build the Module Federation `shared` map for a remote, derived from
 * `@osd/ui-shared-deps`. Every entry is a consume-only singleton
 * (`singleton: true`, `import: false`) so the remote uses the host-provided
 * React/EUI/etc. instance and never bundles its own copy.
 *
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root, used to
 *   read `requiredVersion` values from the root `package.json`.
 */
export function getMfeSharedConfig(repoRoot: string): MfeSharedMap {
  const versions = readRootDependencyVersions(repoRoot);
  const shared: MfeSharedMap = {};
  for (const root of getSharedPackageRoots()) {
    shared[root] = {
      singleton: true,
      import: false,
      requiredVersion: toRequiredVersion(versions[root]),
    };
  }
  return shared;
}
