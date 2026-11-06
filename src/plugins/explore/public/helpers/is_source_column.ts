/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Whether a table column is the row's `_source` view (each field as a `name: value` pair).
 *
 * An OpenSearch index pattern lists `_source` as a meta field of type `_source`, so its field
 * decides. A dataset whose rows come from a data frame (other query languages and sources) has
 * no such field, but each row is still a hit with the row in `_source`, so there the column named
 * `_source` is the row view too.
 */
export const isSourceColumn = (colName: string, fieldInfo?: { type?: string }): boolean =>
  fieldInfo ? fieldInfo.type === '_source' : colName === '_source';
