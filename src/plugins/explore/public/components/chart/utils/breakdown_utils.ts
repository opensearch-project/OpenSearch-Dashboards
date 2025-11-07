/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import semver from 'semver';
import { DataView } from '../../../../../data/common';
import { ENABLE_EXPERIMENTAL_SETTING } from '../../../../common';

/**
 * Determines whether the breakdown selector should be shown.
 *
 * @param dataset - The current data view
 * @param services - Services object containing uiSettings
 * @returns true if breakdown selector should be shown, false otherwise
 */
export const shouldShowBreakdownSelector = (
  dataset: DataView | undefined,
  services?: any
): boolean => {
  if (!dataset) {
    return false;
  }

  // Check if experimental features are enabled
  const isExperimentalEnabled = services?.uiSettings?.get(ENABLE_EXPERIMENTAL_SETTING, false);
  if (!isExperimentalEnabled) {
    return false;
  }

  // Check for dataSourceRef - if it doesn't exist, default to true (show)
  const dataSourceRef = (dataset as any).dataSourceRef;
  if (!dataSourceRef) {
    return true;
  }

  // If type or version is missing, default to true (show)
  if (!dataSourceRef.type || !dataSourceRef.version) {
    return true;
  }

  // Check if it's OpenSearch and version is 3.3 or greater
  const isOpenSearch = dataSourceRef.type === 'OpenSearch';
  const isCompatibleVersion = semver.gte(semver.coerce(dataSourceRef.version) || '0.0.0', '3.3.0');

  // Show breakdown selector only if it's OpenSearch 3.3+
  return isOpenSearch && isCompatibleVersion;
};
