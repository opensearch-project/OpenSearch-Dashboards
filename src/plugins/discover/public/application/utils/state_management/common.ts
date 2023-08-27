/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const addColumn = (columns: string[], action: { column: string; index?: number }) => {
  const { column, index } = action;
  const newColumns = [...(columns || [])];
  if (index !== undefined) newColumns.splice(index, 0, column);
  else newColumns.push(column);
  return newColumns;
};

export const removeColumn = (columns: string[], actionColumn: string) => {
  return (columns || []).filter((column) => column !== actionColumn);
};

export const reorderColumn = (columns: string[], source: number, destination: number) => {
  const newColumns = [...(columns || [])];
  const [removed] = newColumns.splice(source, 1);
  newColumns.splice(destination, 0, removed);
  return newColumns;
};
