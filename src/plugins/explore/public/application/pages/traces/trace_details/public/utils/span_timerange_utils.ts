/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { Span } from '../traces/span_detail_table';
import { hasNanosecondPrecision } from '../traces/ppl_resolve_helpers';
import { extractSpanDuration } from './span_data_utils';
import { nanoToMilliSec, round } from './helper_functions';

export interface SpanTimeRange {
  durationMs: number;
  startTimeMs: number;
  endTimeMs: number;
}

export type TraceTimeRange = SpanTimeRange;

export const calculateSpanTimeRange = (span: Span): SpanTimeRange => {
  const startTimeMs = round(parseHighPrecisionTimestamp(span.startTime), 3);
  const endTimeMs = round(parseHighPrecisionTimestamp(span.endTime), 3);

  let durationMs = 0;
  // If both timestamps have nanosecond precision, use duration calculated from start and end
  if (hasNanosecondPrecision(startTimeMs) && hasNanosecondPrecision(endTimeMs)) {
    durationMs = round(endTimeMs - startTimeMs, 3);
  } else {
    // fallback to duration from span field
    durationMs = round(nanoToMilliSec(Math.max(0, extractSpanDuration(span))), 3);
  }

  return {
    durationMs,
    startTimeMs,
    endTimeMs,
  };
};

// Nominally the root span should have timerange encompassing all its children,
// but in case of bugs or malformed test data check all spans to get accurate trace timerange
export const calculateTraceTimeRange = (spans: Span[]): TraceTimeRange => {
  if (!spans || spans.length === 0) {
    return { durationMs: 0, startTimeMs: 0, endTimeMs: 0 };
  }

  let minStartTime = Infinity;
  let maxEndTime = -Infinity;

  spans.forEach((span) => {
    const startTime = parseHighPrecisionTimestamp(span.startTime);
    const endTime = parseHighPrecisionTimestamp(span.endTime);

    if (startTime < minStartTime) {
      minStartTime = startTime;
    }
    if (endTime > maxEndTime) {
      maxEndTime = endTime;
    }
  });

  // Initialized min and max with infinity and then bound to zero to handle edge case
  // where endTime large negative value, to prevent relative waterfall bar scaling issue.
  // Edge case caused by still in progress span
  const startTimeMs = minStartTime === Infinity ? 0 : round(minStartTime, 3);
  const endTimeMs = maxEndTime === -Infinity ? 0 : round(maxEndTime, 3);
  const durationMs = round(endTimeMs - startTimeMs, 3);

  return {
    durationMs,
    startTimeMs,
    endTimeMs,
  };
};

export const parseHighPrecisionTimestamp = (timestampStr: string): number => {
  if (!timestampStr) return 0;

  try {
    let normalizedTimestamp = timestampStr;

    if (timestampStr.includes(' ') && !timestampStr.includes('T')) {
      normalizedTimestamp = timestampStr.replace(' ', 'T');
      if (!normalizedTimestamp.includes('Z')) {
        normalizedTimestamp += 'Z';
      }
    }

    const date = new Date(normalizedTimestamp);

    const fractionalMatch = timestampStr.match(/\.(\d+)/);
    if (fractionalMatch) {
      const fractionalPart = fractionalMatch[1];
      const millisecondsFromFraction = parseFloat('0.' + fractionalPart) * 1000;

      const baseMs = Math.floor(date.getTime() / 1000) * 1000;
      const secondsMs = date.getSeconds() * 1000;

      return baseMs + secondsMs + millisecondsFromFraction;
    }

    return date.getTime();
  } catch (error) {
    return 0;
  }
};
