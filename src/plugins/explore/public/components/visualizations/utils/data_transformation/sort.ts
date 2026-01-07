/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Sort data by time field
 * @param dateField - Optional field name containing date values
 * @returns Function that sorts data by the specified date field
 */
export const sortByTime = (dateField?: string) => (
  data: Array<Record<string, any>>
): Array<Record<string, any>> => {
  const sortedData = dateField
    ? [...data].sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime())
    : data;

  return sortedData;
};
