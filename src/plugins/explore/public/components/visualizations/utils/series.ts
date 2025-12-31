/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisColumn } from '../types';

export const getSeriesDisplayName = (seriesField: string, columns: VisColumn[]) => {
  const found = columns.find((col) => col.column === seriesField);
  if (found) {
    return found.name;
  }
  return seriesField;
};
