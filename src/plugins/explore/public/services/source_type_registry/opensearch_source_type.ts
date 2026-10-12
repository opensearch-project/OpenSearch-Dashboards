/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { CORE_SIGNAL_TYPES, Dataset, DEFAULT_DATA } from '../../../../data/common';
import { ExploreFlavor, EXPLORE_DEFAULT_LANGUAGE } from '../../../common';
import { getServices } from '../services';
import type { SourceTypeDefinition } from './source_type_registry_service';

export const OPENSEARCH_SOURCE_TYPE_ID = 'opensearch';

/**
 * Whether a dataset belongs on a flavor's page, by signal type: Traces and Metrics need their own
 * signal type; Logs takes anything that is neither (the same rule Explore applies on page load).
 */
export const datasetFitsFlavor = (dataset: Dataset, flavor?: ExploreFlavor | null): boolean => {
  if (flavor === ExploreFlavor.Traces) return dataset.signalType === CORE_SIGNAL_TYPES.TRACES;
  if (flavor === ExploreFlavor.Metrics) return dataset.signalType === CORE_SIGNAL_TYPES.METRICS;
  return (
    dataset.signalType !== CORE_SIGNAL_TYPES.TRACES &&
    dataset.signalType !== CORE_SIGNAL_TYPES.METRICS
  );
};

/** The first dataset that fits the flavor, found the way Explore picks one on page load. */
const findFirstDatasetForFlavor = async (flavor?: ExploreFlavor | null) => {
  const requiredSignalType =
    flavor === ExploreFlavor.Traces
      ? CORE_SIGNAL_TYPES.TRACES
      : flavor === ExploreFlavor.Metrics
        ? CORE_SIGNAL_TYPES.METRICS
        : undefined;
  try {
    const { fetchFirstAvailableDataset } =
      await import('../../application/utils/state_management/utils/redux_persistence');
    return await fetchFirstAvailableDataset(getServices(), flavor ?? null, requiredSignalType);
  } catch {
    return undefined;
  }
};

/** The built-in OpenSearch source: index patterns and indexes, and any unclaimed dataset type. */
export const openSearchSourceType: SourceTypeDefinition = {
  id: OPENSEARCH_SOURCE_TYPE_ID,
  label: i18n.translate('explore.sourceType.openSearchLabel', {
    defaultMessage: 'OpenSearch',
  }),
  icon: 'logoOpenSearch',
  datasetTypes: [DEFAULT_DATA.SET_TYPES.INDEX, DEFAULT_DATA.SET_TYPES.INDEX_PATTERN],
  flavors: [ExploreFlavor.Logs, ExploreFlavor.Traces, ExploreFlavor.Metrics],
  order: 0,
  // The workspace default if it fits the flavor, else the first dataset that does. The default
  // alone can be a traces pattern, which on the Logs page leaves the picker on "Select dataset"
  // while PPL runs against spans.
  resolveDefaultDataset: async ({ data, flavor }) => {
    const defaultDataset = data.query.queryString.getDatasetService().getDefault();
    const dataset =
      (defaultDataset && datasetFitsFlavor(defaultDataset, flavor) && defaultDataset) ||
      (await findFirstDatasetForFlavor(flavor));
    // Index-pattern datasets carry no language, so the query manager would keep the current
    // one; coming from another source that language is unsupported here and would be coerced
    // to the index-pattern type's first language (kuery), which Explore cannot run.
    return dataset ? { ...dataset, language: EXPLORE_DEFAULT_LANGUAGE } : undefined;
  },
};
