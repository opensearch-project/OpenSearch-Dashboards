/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataView } from '../../../../../data/common';

/**
 * Determines whether the breakdown selector should be shown.
 * Only shows breakdown selector if @timestamp is the DataView's time field.
 *
 * @param dataView - The current data view
 * @returns true if breakdown selector should be shown, false otherwise
 */
export const shouldShowBreakdownSelector = (dataView: DataView | undefined): boolean => {
  if (!dataView) {
    return false;
  }

  // Only show breakdown selector if @timestamp is the time field
  return dataView.timeFieldName === '@timestamp';
};
