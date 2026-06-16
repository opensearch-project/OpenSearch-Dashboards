/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Post-math processing for the TSVB raw flow.
 *
 * timeShift and dropLastBucket must run AFTER math (evaluated in the browser by
 * process_math_series.js), so they are applied here once the math is computed. This
 * keeps `params._all` / `params._timestamp` derived from the full, un-shifted bucket
 * set: dropping the last bucket or shifting timestamps before math would change them.
 */

import moment from 'moment';
import { TIME_RANGE_DATA_MODES, TIME_RANGE_MODE_KEY } from '../../common/timerange_data_modes';
import { PANEL_TYPES } from '../../common/panel_types';

const OFFSET_TIME_RE = /^([+-]?[\d]+)([shmdwMy]|ms)$/;
const OVERRIDE_INDEX_PATTERN_KEY = 'override_index_pattern';

const hasOverriddenIndexPattern = (series) => Boolean(series[OVERRIDE_INDEX_PATTERN_KEY]);

/**
 * Timeseries panels are never "entire time range" (so they ARE last-value mode and
 * drop the trailing, potentially-incomplete bucket by default). Other panel types
 * decide via the panel/series time range mode: "entire time range" => no drop.
 */
const isEntireTimeRangeMode = (panel, series = {}) => {
  if (panel.type === PANEL_TYPES.TIMESERIES) {
    return false;
  }

  const timeRangeMode = hasOverriddenIndexPattern(series)
    ? series[TIME_RANGE_MODE_KEY]
    : panel[TIME_RANGE_MODE_KEY];

  return timeRangeMode === TIME_RANGE_DATA_MODES.ENTIRE_TIME_RANGE;
};

const isLastValueTimerangeMode = (panel, series) => !isEntireTimeRangeMode(panel, series);

/**
 * Applies each series' `offset_time` to its result rows. Preserves any extra values
 * per row (e.g. band series carry [time, y1, y0]).
 *
 * @param {Object} response - The processed panel response ({ [panelId]: { series } })
 * @param {Object} panel - The panel configuration
 * @returns {Object} The same response with timestamps shifted in place
 */
export function applyTimeShift(response, panel) {
  const panelData = response[panel.id];
  if (!panelData || !panelData.series) {
    return response;
  }

  panel.series.forEach((series) => {
    if (!series.offset_time || !OFFSET_TIME_RE.test(series.offset_time)) {
      return;
    }

    const matches = series.offset_time.match(OFFSET_TIME_RE);
    const offset = moment.duration(Number(matches[1]), matches[2]).valueOf();

    panelData.series.forEach((item) => {
      if (item.id && item.id.startsWith(series.id) && Array.isArray(item.data)) {
        item.data = item.data.map(([time, ...rest]) => [time + offset, ...rest]);
      }
    });
  });

  return response;
}

/**
 * Drops the trailing bucket for series in "last value" time range mode. Runs after
 * math so the math context sees the full bucket set.
 *
 * @param {Object} response - The processed panel response ({ [panelId]: { series } })
 * @param {Object} panel - The panel configuration
 * @returns {Object} The same response with trailing buckets dropped in place
 */
export function applyDropLastBucket(response, panel) {
  const panelData = response[panel.id];
  if (!panelData || !panelData.series) {
    return response;
  }

  panel.series.forEach((series) => {
    if (!isLastValueTimerangeMode(panel, series)) {
      return;
    }

    // panel.drop_last_bucket overrides the per-series override_drop_last_bucket;
    // both default to 1 (drop) when undefined.
    const seriesDropLastBucket =
      series.override_drop_last_bucket != null ? series.override_drop_last_bucket : 1;
    const dropLastBucket =
      panel.drop_last_bucket != null ? panel.drop_last_bucket : seriesDropLastBucket;

    if (!dropLastBucket) {
      return;
    }

    panelData.series.forEach((item) => {
      if (item.id && item.id.startsWith(series.id) && Array.isArray(item.data)) {
        item.data = item.data.slice(0, item.data.length - 1);
      }
    });
  });

  return response;
}
