/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPattern } from '../../../opensearch_dashboards_services';

/**
 * Helper function to filter columns based on the fields of the index pattern.
 * This function is used when we switch between index patterns. We want to keep the columns that are
 * still available in the new index pattern and remove the ones that are not.
 * If the resulting array is empty, it provides a fallback to the default column.
 * @param columns Array of column names
 * @param indexPattern Index pattern object
 * @param defaultColumns Array of default columns
 */
export function filterColumns(
  columns: string[],
  indexPattern: IndexPattern | undefined,
  defaultColumns: string[]
) {
  const fieldsName = indexPattern?.fields.getAll().map((fld) => fld.name) || [];
  // combine columns and defaultColumns without duplicates
  const combinedColumns = [...new Set([...columns, ...defaultColumns])];
  const filteredColumns = combinedColumns.filter((column) => fieldsName.includes(column));
  return filteredColumns.length > 0 ? filteredColumns : ['_source'];
}
