/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Span } from '../span_detail_table';
import { resolveServiceNameFromSpan } from '../ppl_resolve_helpers';
import { calculateSpanTimeRange, TraceTimeRange } from '../../utils/span_timerange_utils';
import { round } from '../../utils/helper_functions';

interface TimelineBarRange {
  timelineBarOffsetPercent: number;
  timelineBarWidthPercent: number;
  durationMs: number;
  relativeStart: number;
  relativeEnd: number;
}

export const useTimelineBarColor = (span: Span, colorMap?: Record<string, string>): string => {
  return useMemo(() => {
    const serviceName = resolveServiceNameFromSpan(span) || span.serviceName || 'unknown';
    return colorMap?.[serviceName] || '#ff7f00';
  }, [span, colorMap]);
};

export const useTimelineBarRange = (
  span: Span,
  traceTimeRange: TraceTimeRange,
  paddingPercent: number = 0
): TimelineBarRange => {
  const {
    durationMs: spanDuration,
    startTimeMs: spanStartTime,
    endTimeMs: spanEndTime,
  } = useMemo(() => calculateSpanTimeRange(span), [span]);
  const { durationMs: traceDuration, startTimeMs: traceStartTime } = traceTimeRange;

  return useMemo(() => {
    const availableWidth = 100 - paddingPercent * 2;
    const rawOffsetPercent = ((spanStartTime - traceStartTime) / traceDuration) * 100;
    const rawWidthPercent = (spanDuration / traceDuration) * 100;

    return {
      timelineBarOffsetPercent: Math.round((rawOffsetPercent * availableWidth) / 100),
      timelineBarWidthPercent: Math.max(Math.round((rawWidthPercent * availableWidth) / 100), 1),
      durationMs: spanDuration,
      relativeStart: round(spanStartTime - traceStartTime, 3),
      relativeEnd: round(spanEndTime - traceStartTime, 3),
    };
  }, [spanDuration, spanStartTime, spanEndTime, traceDuration, traceStartTime, paddingPercent]);
};
