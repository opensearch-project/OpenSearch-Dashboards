/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataView } from '../../../../../data/common';
import { ENABLE_EXPERIMENTAL_SETTING } from '../../../../common';

/**
 * Determines whether the breakdown selector should be shown.
 *
 * @param dataView - The current data view
 * @param services - Services object containing uiSettings
 * @returns true if breakdown selector should be shown, false otherwise
 */
export const shouldShowBreakdownSelector = (
  dataView: DataView | undefined,
  services?: any
): boolean => {
  if (!dataView) {
    return false;
  }

  // Check if experimental features are enabled
  const isExperimentalEnabled = services?.uiSettings?.get(ENABLE_EXPERIMENTAL_SETTING, false);
  if (!isExperimentalEnabled) {
    return false;
  }

  return true;
};
