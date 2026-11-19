/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from '../../../../../../../core/public';
import { toListTimePattern } from '../../../../../../explore/public';
import { FULL_TIMESTAMP_PATTERN, formatTimestamp, resolveTimezone } from './tree_utils';

export interface TimestampFormatters {
  /** Full precision in the user's `dateFormat`: rows, flyouts, detail views. */
  formatTs: (ts: string) => string;
  /** The same format to the second, for list Time columns (as in Explore's lists). */
  formatListTs: (ts: string) => string;
}

/** Timestamp formatters that follow the `dateFormat` and `dateFormat:tz` advanced settings. */
export const getTimestampFormatters = (uiSettings?: IUiSettingsClient): TimestampFormatters => {
  const timezone = resolveTimezone(uiSettings);
  const fullPattern =
    (uiSettings?.get('dateFormat') as string | undefined) || FULL_TIMESTAMP_PATTERN;
  const listPattern = toListTimePattern(fullPattern);
  return {
    formatTs: (ts: string) => formatTimestamp(ts, timezone, fullPattern),
    formatListTs: (ts: string) => formatTimestamp(ts, timezone, listPattern),
  };
};
