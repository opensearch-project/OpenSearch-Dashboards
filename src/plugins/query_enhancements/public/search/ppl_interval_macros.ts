/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TimeRange, UI_SETTINGS, calculateBounds } from '../../../data/common';
import { search } from '../../../data/public';
import { IUiSettingsClient } from '../../../../core/public';

const INTERVAL_MACRO_PATTERN = /\$\{__interval\}|\$__interval\b/g;

export const hasPPLIntervalMacros = (query: string): boolean =>
  new RegExp(INTERVAL_MACRO_PATTERN.source).test(query);

/**
 * Replaces `$__interval` in a PPL query with a span expression such as `30m`,
 * for example:
 * input: `span(@timestamp, $__interval)`.
 * return `span(@timestamp, 30m)`.
 */
export const interpolatePPLIntervalMacros = (query: string, interval: string): string =>
  query.replace(INTERVAL_MACRO_PATTERN, () => interval);

/**
 * The interval Explore's histogram picks for "Auto" over the time range: TimeBuckets with the
 * `histogram:barTarget` and `histogram:maxBars` settings. Undefined when the range can't be read.
 */
export const resolveAutoPPLInterval = (
  timeRange: TimeRange | undefined,
  uiSettings: IUiSettingsClient
): string | undefined => {
  if (!timeRange) return undefined;
  const bounds = calculateBounds(timeRange);
  if (!bounds.min?.isValid() || !bounds.max?.isValid() || bounds.max.isBefore(bounds.min)) {
    return undefined;
  }
  const buckets = new search.aggs.TimeBuckets({
    'histogram:maxBars': uiSettings.get(UI_SETTINGS.HISTOGRAM_MAX_BARS),
    'histogram:barTarget': uiSettings.get(UI_SETTINGS.HISTOGRAM_BAR_TARGET),
    dateFormat: uiSettings.get(UI_SETTINGS.DATE_FORMAT),
    'dateFormat:scaled': uiSettings.get('dateFormat:scaled'),
  });

  buckets.setBounds(bounds);
  buckets.setInterval('auto');

  return buckets.getInterval().expression;
};
