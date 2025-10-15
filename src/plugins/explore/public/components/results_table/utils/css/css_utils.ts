/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const getColumnSizeVariableName = (columnId: string) =>
  `--exploreResultsTable-col-${columnId}-size`;

export const getColumnWidth = (columnId: string) =>
  `calc(var(${getColumnSizeVariableName(columnId)}) * 1px)`;
