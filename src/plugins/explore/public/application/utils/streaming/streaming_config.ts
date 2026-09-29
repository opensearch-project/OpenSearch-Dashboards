/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { Capabilities } from '../../../../../../core/types';
import { STREAMING_RESULTS_SETTING } from '../../../../common';

interface StreamingEligibilityDeps {
  uiSettings: Pick<IUiSettingsClient, 'get'>;
  capabilities: Capabilities;
}

/**
 * Whether a query should run on the streaming path.
 *
 * Three conditions, all required:
 *
 * - Only PPL is supported: the asynchronous partial-results API is a PPL endpoint, and its
 *   restrictions (Calcite execution, JDBC response format) do not apply to the other languages.
 * - `queryEnhancements.pplStreaming` is the deployment flag, off by default and overridable at
 *   runtime through DynamicConfig. It decides whether streaming is available at all, and the stream
 *   routes enforce it again per request, so a runtime change also stops jobs already in flight.
 * - `explore:enableStreamingResults` is the per-user opt-in beneath that flag.
 *
 * Note this cannot predict whether a query will actually produce partial results — that depends on
 * the plan, which only the engine knows. A query that turns out to sort or aggregate still runs
 * correctly here, it just delivers everything in one final snapshot.
 */
export const isStreamingEligible = (
  { uiSettings, capabilities }: StreamingEligibilityDeps,
  language?: string
): boolean =>
  language === 'PPL' &&
  capabilities.queryEnhancements?.pplStreaming === true &&
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
