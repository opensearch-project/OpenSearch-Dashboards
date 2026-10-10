/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { DEFAULT_DATA, getDataSourceEngineCapabilities } from '../../../../../data/common';
import { Capabilities } from '../../../../../../core/types';
import { STREAMING_RESULTS_SETTING } from '../../../../common';

interface StreamingEligibilityDeps {
  uiSettings: Pick<IUiSettingsClient, 'get'>;
  capabilities: Capabilities;
}

/**
 * Dataset types whose PPL queries run against OpenSearch indices through the synchronous PPL
 * strategy, which is what the streaming path replaces.
 *
 * Deliberately an allowlist. Other types route elsewhere — an S3 dataset goes to the `pplasync`
 * strategy and its own job API — so streaming them would send the query to the wrong place. A new
 * dataset type is more likely to be another external source than a plain index, so it must be added
 * here consciously rather than start streaming by default.
 */
const STREAMABLE_DATASET_TYPES: ReadonlySet<string> = new Set([
  DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
  DEFAULT_DATA.SET_TYPES.INDEX,
]);

/** What is known about the query at the point the streaming decision is made. */
export interface StreamingQueryDescriptor {
  language?: string;
  /** `dataset.dataSource.engineType ?? dataset.dataSource.type`. */
  engineType?: string;
  /** `dataset.type`. */
  datasetType?: string;
}

/**
 * Whether a query should run on the streaming path.
 *
 * All of the following are required:
 *
 * - Only PPL is supported: the asynchronous partial-results API is a PPL endpoint, and its
 *   restrictions (Calcite execution, JDBC response format) do not apply to the other languages.
 * - `queryEnhancements.pplStreaming` is the deployment flag, off by default and overridable at
 *   runtime through DynamicConfig. It decides whether streaming is available at all, and the stream
 *   routes enforce it again per request, so a runtime change also stops jobs already in flight.
 * - `explore:enableStreamingResults` is the per-user opt-in beneath that flag.
 * - The dataset must be index-backed, so the query is one the streaming path can actually replace.
 * - The engine must serve the async PPL API. Open Distro and legacy Elasticsearch do not, and
 *   unknown engines are assumed to (matching the rest of the engine capability table); a wrong
 *   assumption costs one failed submit, which falls back to the non-streaming path.
 *
 * Note this cannot predict whether a query will actually produce partial results — that depends on
 * the plan, which only the engine knows. A query that turns out to sort or aggregate still runs
 * correctly here, it just delivers everything in one final snapshot.
 */
export const isStreamingEligible = (
  { uiSettings, capabilities }: StreamingEligibilityDeps,
  { language, engineType, datasetType }: StreamingQueryDescriptor
): boolean =>
  language === 'PPL' &&
  capabilities.queryEnhancements?.pplStreaming === true &&
  STREAMABLE_DATASET_TYPES.has(datasetType ?? '') &&
  getDataSourceEngineCapabilities(engineType).supportsAsyncPplStreaming &&
  Boolean(uiSettings.get(STREAMING_RESULTS_SETTING, false));

/**
 * Finds the aggregation id the histogram chart reads from, so a client-derived histogram can be
 * attached where the chart already looks. Returns undefined when the config has no date histogram.
 */
export const findDateHistogramAggId = (
  aggs: Record<string, unknown> | undefined
): string | undefined => {
  if (!aggs) return undefined;
  const entry = Object.entries(aggs).find(
    ([, value]) => (value as { date_histogram?: unknown } | undefined)?.date_histogram
  );
  return entry?.[0];
};
