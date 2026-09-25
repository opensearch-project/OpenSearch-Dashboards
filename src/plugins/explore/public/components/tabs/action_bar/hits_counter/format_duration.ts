/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

const MS_PER_SECOND = 1000;
const SECONDS_FRACTION_DIGITS = 3;

/**
 * Formats a query duration: milliseconds below one second (`847 ms`), otherwise seconds to the
 * millisecond (`42.282 s`). Returns an empty string when there is no duration to show.
 */
export const formatDuration = (elapsedMs?: number): string => {
  if (typeof elapsedMs !== 'number' || !Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return '';
  }
  const roundedMs = Math.round(elapsedMs);
  if (roundedMs < MS_PER_SECOND) {
    return i18n.translate('explore.discover.hitsCounter.durationMs', {
      defaultMessage: '{value} ms',
      values: { value: roundedMs.toLocaleString() },
    });
  }
  return i18n.translate('explore.discover.hitsCounter.durationSeconds', {
    defaultMessage: '{value} s',
    values: {
      value: (roundedMs / MS_PER_SECOND).toLocaleString(undefined, {
        minimumFractionDigits: SECONDS_FRACTION_DIGITS,
        maximumFractionDigits: SECONDS_FRACTION_DIGITS,
      }),
    },
  });
};
