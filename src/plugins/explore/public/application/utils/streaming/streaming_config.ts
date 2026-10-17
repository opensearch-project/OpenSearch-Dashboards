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
 * Dataset types whose PPL queries run through the synchronous PPL strategy, which is what streaming
 * replaces.
 *
 * An allowlist on purpose: other types route elsewhere — S3 goes to `pplasync` and its own job API —
 * so a new dataset type must be added here consciously rather than start streaming by default.
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
 * Two gates, both required: `queryEnhancements.pplStreaming` is the deployment capability, which the
 * routes also enforce per request so a runtime change stops jobs already in flight, and
 * `explore:enableStreamingResults` is the per-user opt-in beneath it. An unknown engine is assumed
 * to serve the async API; being wrong costs one failed submit and falls back.
 *
 * This cannot predict whether a query will actually produce partial results — that depends on the
 * plan. A sorting or aggregating query runs correctly, it just arrives in one final snapshot.
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
 * The aggregation id the histogram chart reads from, so streamed buckets are attached where the
 * chart already looks. Undefined when the config has no date histogram.
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
