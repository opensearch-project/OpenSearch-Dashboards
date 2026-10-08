/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Span } from '../types';
import { resolveServiceNameFromSpan } from '../../ppl_resolve_helpers';
import { calculateSpanTimeRange, TraceTimeRange } from '../../../utils/span_timerange_utils';
import { round } from '../../../utils/helper_functions';

interface TimelineBarRange {
  timelineBarOffsetPercent: number;
  timelineBarWidthPercent: number;
  durationMs: number;
  relativeStart: number;
  relativeEnd: number;
  /** True when the span falls entirely outside the current visible window. */
  isOutsideWindow: boolean;
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
  paddingPercent: number = 0,
  // When provided, bar positions/widths are computed relative to this visible
  // window (timeline zoom) instead of the full trace range.
  visibleRange?: TraceTimeRange
): TimelineBarRange => {
  const {
    durationMs: spanDuration,
    startTimeMs: spanStartTime,
    endTimeMs: spanEndTime,
  } = useMemo(() => calculateSpanTimeRange(span), [span]);
  const { startTimeMs: traceStartTime } = traceTimeRange;

  return useMemo(() => {
    const range = visibleRange ?? traceTimeRange;
    const windowStart = range.startTimeMs;
    const windowEnd = range.endTimeMs;
    const windowDuration = range.durationMs || 1;

    const availableWidth = 100 - paddingPercent * 2;
    const rawOffsetPercent = ((spanStartTime - windowStart) / windowDuration) * 100;
    const rawWidthPercent = (spanDuration / windowDuration) * 100;

    return {
      // Clamp offset to >= 0 so spans starting before the window pin to the left edge.
      timelineBarOffsetPercent: Math.max(0, Math.round((rawOffsetPercent * availableWidth) / 100)),
      timelineBarWidthPercent: Math.max(Math.round((rawWidthPercent * availableWidth) / 100), 1),
      durationMs: spanDuration,
      // Tooltip start/end stay relative to the full trace start.
      relativeStart: round(spanStartTime - traceStartTime, 3),
      relativeEnd: round(spanEndTime - traceStartTime, 3),
      isOutsideWindow: spanEndTime < windowStart || spanStartTime > windowEnd,
    };
  }, [
    spanDuration,
    spanStartTime,
    spanEndTime,
    traceStartTime,
    paddingPercent,
    visibleRange,
    traceTimeRange,
  ]);
};
