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

import { OptimizerConfig } from '@osd/optimizer';

/**
 * A UI plugin discovered via OpenSearch Dashboards' optimizer plugin enumeration.
 *
 * These map 1:1 to the UI plugins the existing `@osd/optimizer` build produces
 * bundles for, and will become Module Federation remotes in later stories.
 */
export interface DiscoveredUiPlugin {
  /** Unique plugin id (e.g. "inspector"). */
  id: string;
  /** Absolute path to the plugin's source directory. */
  directory: string;
  /**
   * Absolute path where the existing optimizer writes this plugin's bundle
   * (`<plugin_dir>/target/public`). The MF build deliberately does NOT write
   * here; it uses `target/mfe/<id>/` instead (later stories).
   */
  outputDir: string;
}

/**
 * Enumerate every UI plugin OpenSearch Dashboards would build, by reusing the
 * existing optimizer discovery chain:
 *
 *   OptimizerConfig.create() -> findOpenSearchDashboardsPlatformPlugins() -> getPluginBundles()
 *
 * This is read-only: constructing the config scans the plugin directories but
 * does not trigger any compilation or write any files.
 *
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 * @returns the discovered UI plugins, sorted by id
 */
export function discoverUiPlugins(repoRoot: string): DiscoveredUiPlugin[] {
  // `OptimizerConfig.parseOptions` throws unless `repoRoot` is absolute, and it
  // internally runs `findOpenSearchDashboardsPlatformPlugins` + `getPluginBundles`.
  const config = OptimizerConfig.create({ repoRoot });

  // `config.bundles` already contains only UI plugins (getPluginBundles filters
  // on `isUiPlugin`). The `type === 'plugin'` guard simply excludes the optional
  // core entry bundle, which is not requested here.
  return config.bundles
    .filter((bundle) => bundle.type === 'plugin')
    .map((bundle) => ({
      id: bundle.id,
      directory: bundle.contextDir,
      outputDir: bundle.outputDir,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}
