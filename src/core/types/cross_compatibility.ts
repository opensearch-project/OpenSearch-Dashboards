/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/** @public */
export interface CrossCompatibilityResult {
  /** The OpenSearch Plugin name. */
  pluginName: string;

  /** Whether the current OpenSearch Plugin version is compatible with the dashboards plugin. */
  isCompatible: boolean;

  /**
   * The reason the OpenSearch Plugin version is not compatible with the plugin.
   * This will be `undefined` if the OpenSearch Plugin version is compatible.
   */
  incompatibilityReason?: string;

  /**
   * The array of versions of dependency OpenSearch Plugin if any present on the cluster.
   * This will be empty if the OpenSearch Plugin is not present.
   */
  installedVersions: string[];
}
