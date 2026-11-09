/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SavedObjectAttributes, SavedObjectReference } from '../../../../core/public';

// Only index patterns are saved objects; other dataset types (indexes, Prometheus) are not.
const INDEX_PATTERN_DATASET_TYPE = 'INDEX_PATTERN';
const INDEX_PATTERN_REFERENCE_TYPE = 'index-pattern';

interface SavedRowDataset {
  id?: string;
  type?: string;
  datasetRefName?: string;
}

interface SavedRow {
  refId: string;
  query: { dataset?: SavedRowDataset };
  isHidden?: boolean;
}

// The `queries` attribute is a list of { refId, query } rows.
const parseRows = (raw: unknown): SavedRow[] => {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as SavedRow[]).filter((row) => typeof row?.refId === 'string')
      : [];
  } catch {
    return [];
  }
};

const datasetRefName = (refId: string) => `queries_${refId}_dataset`;

/**
 * Moves each row's index pattern into the saved object's references, so export / import (which
 * remaps references, not ids inside JSON) keeps every row pointing at its index pattern. The id
 * stays in the JSON too, so a row still loads if its reference is missing.
 */
export const extractReferences = ({
  attributes,
  references = [],
}: {
  attributes: SavedObjectAttributes;
  references: SavedObjectReference[];
}) => {
  const savedRows = parseRows(attributes.queries);
  if (savedRows.length === 0) return { attributes, references };

  const added: SavedObjectReference[] = [];
  const rows = savedRows.map((row): SavedRow => {
    const { refId, query } = row;
    const dataset = query?.dataset;
    if (dataset?.type !== INDEX_PATTERN_DATASET_TYPE || !dataset.id) return row;
    const name = datasetRefName(refId);
    added.push({ name, type: INDEX_PATTERN_REFERENCE_TYPE, id: dataset.id });
    // Spread the row so its other fields (isHidden) survive.
    return { ...row, query: { ...query, dataset: { ...dataset, datasetRefName: name } } };
  });

  return {
    attributes: { ...attributes, queries: JSON.stringify(rows) },
    references: [...references.filter((ref) => !ref.name.startsWith('queries_')), ...added],
  };
};

/** Restores each row's index pattern id from the references (after an import remapped them). */
export const injectReferences = (
  savedObject: { queries?: string },
  references: SavedObjectReference[]
) => {
  const savedRows = parseRows(savedObject.queries);
  if (savedRows.length === 0) return;

  const rows = savedRows.map((row): SavedRow => {
    const { query } = row;
    const dataset = query?.dataset;
    if (!dataset?.datasetRefName) return row;
    const { datasetRefName: name, ...rest } = dataset;
    const reference = references.find((ref) => ref.name === name);
    return {
      ...row,
      query: { ...query, dataset: reference ? { ...rest, id: reference.id } : rest },
    };
  });
  savedObject.queries = JSON.stringify(rows);
};
