/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes, SavedObjectReference } from '../../../../core/types';
import { DEFAULT_DATA } from '../../../data/common';

/** The dataset type's config, as far as this module reads it (DatasetTypeConfig). */
export type GetDatasetTypeConfig = (
  type: string
) => { meta?: { noSavedObject?: boolean } } | undefined;

/**
 * The saved object's `extractReferences`: a search source on a dataset whose type says it never has
 * a saved object (DatasetTypeConfig `meta.noSavedObject`) keeps that dataset's id inline, in the
 * index and in the filters on it, instead of an `index-pattern` reference to it, which import
 * would reject as a missing index pattern. Loading resolves an inline id from `query.dataset`
 * (createSearchSource). Every other dataset, and any other reference, is left as it is.
 */
export const inlineDatasetReferences =
  (getDatasetTypeConfig: GetDatasetTypeConfig) =>
  ({
    attributes,
    references,
  }: {
    attributes: SavedObjectAttributes;
    references: SavedObjectReference[];
  }) => {
    const meta = attributes.kibanaSavedObjectMeta as { searchSourceJSON?: string } | undefined;
    if (!meta?.searchSourceJSON) return { attributes, references };
    let searchSource: Record<string, any>;
    try {
      searchSource = JSON.parse(meta.searchSourceJSON);
    } catch {
      return { attributes, references };
    }
    const dataset = searchSource.query?.dataset;
    if (
      !dataset?.id ||
      !dataset.type ||
      dataset.type === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN ||
      getDatasetTypeConfig(dataset.type)?.meta?.noSavedObject !== true
    ) {
      return { attributes, references };
    }

    // The references to the dataset: under the search source's index, and under its filters'.
    const toDataset = (refName: unknown) =>
      references.some(
        (ref) => ref.name === refName && ref.type === 'index-pattern' && ref.id === dataset.id
      );
    const inlined = new Set<string>();
    if (toDataset(searchSource.indexRefName)) {
      inlined.add(searchSource.indexRefName);
      searchSource.index = dataset.id;
      delete searchSource.indexRefName;
    }
    if (Array.isArray(searchSource.filter)) {
      searchSource.filter = searchSource.filter.map((filter: Record<string, any>) => {
        if (!filter?.meta || !toDataset(filter.meta.indexRefName)) return filter;
        inlined.add(filter.meta.indexRefName);
        const { indexRefName, ...rest } = filter.meta;
        return { ...filter, meta: { ...rest, index: dataset.id } };
      });
    }
    if (!inlined.size) return { attributes, references };

    return {
      attributes: {
        ...attributes,
        kibanaSavedObjectMeta: { ...meta, searchSourceJSON: JSON.stringify(searchSource) },
      },
      // Nothing reads these names any more, including an older reference a re-save also carries
      // under the same name (serializeSavedObject keeps the loaded search source's too).
      references: references.filter((ref) => !inlined.has(ref.name)),
    };
  };
