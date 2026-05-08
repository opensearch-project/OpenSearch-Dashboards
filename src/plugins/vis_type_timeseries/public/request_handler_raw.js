/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getTimezone, validateInterval } from './application';
import { getUISettings, getDataStart, getCoreStart } from './services';
import { MAX_BUCKETS_SETTING } from '../common/constants';
import { evaluateMathExpressions } from './lib/process_math_series';

/**
 * Request handler for TSVB visualizations with client-side math evaluation.
 * This calls the /api/metrics/vis/data-raw endpoint which returns individual
 * metric values without math evaluation, then evaluates math expressions
 * client-side before rendering.
 *
 * @param {Object} params - Request parameters
 * @param {Object} params.uiState - UI state object
 * @param {Object} params.timeRange - Time range for the query
 * @param {Array} params.filters - Applied filters
 * @param {Object} params.query - Query object
 * @param {Object} params.visParams - Visualization parameters
 * @param {string} params.savedObjectId - ID of saved visualization
 * @returns {Promise<Object>} Processed visualization data
 */
export const metricsRequestHandlerRaw = async ({
  uiState,
  timeRange,
  filters,
  query,
  visParams,
  savedObjectId,
}) => {
  const config = getUISettings();
  const timezone = getTimezone(config);
  const uiStateObj = uiState.get(visParams.type, {});
  const parsedTimeRange = getDataStart().query.timefilter.timefilter.calculateBounds(timeRange);
  const scaledDataFormat = config.get('dateFormat:scaled');
  const dateFormat = config.get('dateFormat');

  if (visParams && visParams.id && !visParams.isModelInvalid) {
    try {
      const maxBuckets = config.get(MAX_BUCKETS_SETTING);

      validateInterval(parsedTimeRange, visParams, maxBuckets);

      // Call the NEW /api/metrics/vis/data-raw endpoint
      // This endpoint returns individual metric values without math evaluation
      const rawResp = await getCoreStart().http.post('/api/metrics/vis/data-raw', {
        body: JSON.stringify({
          timerange: {
            timezone,
            ...parsedTimeRange,
          },
          query,
          filters,
          panels: [visParams],
          state: uiStateObj,
          savedObjectId: savedObjectId || 'unsaved',
        }),
      });

      // Evaluate math expressions client-side
      const processedResp = evaluateMathExpressions(rawResp, visParams);

      return {
        dateFormat,
        scaledDataFormat,
        timezone,
        ...processedResp,
      };
    } catch (error) {
      return Promise.reject(error);
    }
  }

  return Promise.resolve({});
};
