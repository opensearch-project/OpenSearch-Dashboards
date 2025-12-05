/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { round } from '../utils/helper_functions';
import { defaultColors } from '../utils/shared_const';
import {
  isSpanError,
  resolveServiceNameFromSpan,
  hasNanosecondPrecision,
} from '../traces/ppl_resolve_helpers';
import { parseHighPrecisionTimestamp } from '../utils/span_timerange_utils';

interface SpanSource {
  traceId: string;
  spanId: string;
  parentSpanId: string;
  serviceName: string;
  name: string;
  startTime: string;
  endTime: string;
  durationInNanos: number;
  'status.code': number;
  traceGroup?: string;
  kind?: string;
}

interface SpanData {
  _source?: SpanSource;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  serviceName?: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  durationInNanos?: number;
  'status.code'?: number;
  traceGroup?: string;
  kind?: string;
}

function getSpanSource(span: SpanData): SpanSource {
  if (span._source) {
    return span._source;
  }
  return {
    traceId: span.traceId || '',
    spanId: span.spanId || '',
    parentSpanId: span.parentSpanId || '',
    serviceName: span.serviceName || '',
    name: span.name || '',
    startTime: span.startTime || '',
    endTime: span.endTime || '',
    durationInNanos: span.durationInNanos || 0,
    'status.code': span['status.code'] || 0,
    traceGroup: span.traceGroup,
    kind: span.kind,
  };
}

interface VegaSpan {
  spanId: string;
  parentSpanId: string;
  serviceName: string;
  name: string;
  startTime: number;
  duration: number;
  level: number;
  hasError: boolean;
  color: string;
}

interface VegaGanttData {
  values: VegaSpan[];
  maxEndTime: number;
}

interface HierarchicalSpan extends SpanData {
  children: HierarchicalSpan[];
  level: number;
}

function buildHierarchicalStructure(spans: SpanData[]): HierarchicalSpan[] {
  const spanMap: Record<string, HierarchicalSpan> = {};

  spans.forEach((span) => {
    const source = getSpanSource(span);
    spanMap[source.spanId] = {
      ...span,
      children: [],
      level: 0,
    };
  });

  const rootSpans: HierarchicalSpan[] = [];

  spans.forEach((span) => {
    const source = getSpanSource(span);
    const currentSpan = spanMap[source.spanId];

    if (source.parentSpanId && spanMap[source.parentSpanId]) {
      spanMap[source.parentSpanId].children.push(currentSpan);
    } else {
      rootSpans.push(currentSpan);
    }
  });

  rootSpans.sort((a, b) => {
    const aSource = getSpanSource(a);
    const bSource = getSpanSource(b);
    const aStartTime = parseHighPrecisionTimestamp(aSource.startTime);
    const bStartTime = parseHighPrecisionTimestamp(bSource.startTime);
    return aStartTime - bStartTime;
  });

  const sortChildren = (span: HierarchicalSpan, level = 0) => {
    span.level = level;

    if (span.children.length > 0) {
      span.children.sort((a, b) => {
        const aSource = getSpanSource(a);
        const bSource = getSpanSource(b);
        const aStartTime = parseHighPrecisionTimestamp(aSource.startTime);
        const bStartTime = parseHighPrecisionTimestamp(bSource.startTime);

        if (aStartTime !== bStartTime) {
          return aStartTime - bStartTime;
        }

        const aDuration = parseHighPrecisionTimestamp(aSource.endTime) - aStartTime;
        const bDuration = parseHighPrecisionTimestamp(bSource.endTime) - bStartTime;
        return bDuration - aDuration;
      });

      span.children.forEach((child) => sortChildren(child, level + 1));
    }
  };

  rootSpans.forEach((rootSpan) => sortChildren(rootSpan));

  return rootSpans;
}

function flattenHierarchy(hierarchicalSpans: HierarchicalSpan[]): HierarchicalSpan[] {
  const result: HierarchicalSpan[] = [];

  const traverse = (span: HierarchicalSpan) => {
    result.push(span);
    span.children.forEach((child) => traverse(child));
  };

  hierarchicalSpans.forEach((rootSpan) => traverse(rootSpan));

  return result;
}

export function convertToVegaGanttData(
  payloadData: SpanData[],
  colorMap: Record<string, string> = {}
): VegaGanttData {
  if (!payloadData || payloadData.length === 0) {
    return {
      values: [],
      maxEndTime: 0,
    };
  }

  const hierarchicalSpans = buildHierarchicalStructure(payloadData);
  const orderedSpans = flattenHierarchy(hierarchicalSpans).reverse();

  const spanTimestamps = orderedSpans.map((span) => ({
    span,
    startTimeMs: parseHighPrecisionTimestamp(getSpanSource(span).startTime),
    endTimeMs: parseHighPrecisionTimestamp(getSpanSource(span).endTime),
    level: span.level,
  }));

  const minStartTime = Math.min(...spanTimestamps.map((st) => st.startTimeMs));

  const serviceColorMap = { ...colorMap };
  let colorIndex = 0;
  let maxEndTime = 0;

  const values: VegaSpan[] = spanTimestamps.map(({ span, startTimeMs, endTimeMs, level }) => {
    const source = getSpanSource(span);
    const serviceName = resolveServiceNameFromSpan(span) || source.serviceName;

    const relativeStartTime = round(startTimeMs - minStartTime, 3);

    let duration: number;

    if (startTimeMs === 0 && endTimeMs === 0) {
      duration = 0;
    } else {
      const hasStartNanoPrecision = hasNanosecondPrecision(source.startTime);
      const hasEndNanoPrecision = hasNanosecondPrecision(source.endTime);

      // If both timestamps have nanosecond precision, use calculated duration
      if (hasStartNanoPrecision && hasEndNanoPrecision) {
        duration = round(endTimeMs - startTimeMs, 3);
      }
      // If timestamps lack precision, prefer provided duration fields for better accuracy
      else if (source.durationInNanos > 0) {
        // Convert nanoseconds to milliseconds for Gantt chart display
        duration = round(source.durationInNanos / 1000000, 3);
      }
      // Fall back to calculated duration from lower-precision timestamps
      else {
        duration = round(endTimeMs - startTimeMs, 3);
      }
    }

    maxEndTime = Math.max(maxEndTime, relativeStartTime + duration);

    if (!serviceColorMap[serviceName]) {
      serviceColorMap[serviceName] = defaultColors[colorIndex % defaultColors.length];
      colorIndex++;
    }

    return {
      spanId: source.spanId,
      parentSpanId: source.parentSpanId || '',
      serviceName,
      name: source.name,
      startTime: relativeStartTime,
      duration,
      level,
      hasError: isSpanError(source),
      color: serviceColorMap[serviceName],
    };
  });

  const validatedValues = values.map((span, index) => {
    const startTime = span.startTime || 0;
    const duration = span.duration || 0;
    return {
      ...span,
      startTime,
      duration,
      endTime: startTime + duration,
      level: span.level || 0,
      label: `${span.spanId}`,
      displayLabel: `${span.serviceName}<br/>${span.name}`,
      color: span.color || '#ddd',
    };
  });

  return {
    values: validatedValues,
    maxEndTime,
  };
}
