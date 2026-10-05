/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TraceTimeRange } from '../../../utils/span_timerange_utils';
import './timeline_ruler.scss';
import { useTimelineTicks } from './timeline_ruler_hooks';

export interface TimelineRulerProps {
  traceTimeRange: TraceTimeRange;
  paddingPercent?: number;
  /** When zoomed, the ruler spans this visible window (relative to trace start). */
  visibleRange?: TraceTimeRange;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  traceTimeRange,
  paddingPercent = 2,
  visibleRange,
}) => {
  const relStart = visibleRange ? visibleRange.startTimeMs - traceTimeRange.startTimeMs : 0;
  const relEnd = visibleRange
    ? visibleRange.endTimeMs - traceTimeRange.startTimeMs
    : traceTimeRange.durationMs;
  const ticks = useTimelineTicks(relEnd, relStart, 8, paddingPercent);

  return (
    <div className="exploreTimelineRuler" style={{ height: '20px', position: 'relative' }}>
      <div className="exploreTimelineRuler__baseline" />
      {ticks.map((tick, index) => {
        const labelClassName =
          index === 0
            ? 'exploreTimelineRuler__label--first'
            : index === ticks.length - 1
              ? 'exploreTimelineRuler__label--last'
              : 'exploreTimelineRuler__label--center';

        return (
          <div
            key={tick.value}
            className="exploreTimelineRuler__tickContainer"
            style={{ left: `${tick.offsetPercent}%` }}
            data-test-subj={`tick-container-${tick.value}`}
          >
            <div
              className={`exploreTimelineRuler__label ${labelClassName}`}
              data-test-subj={`tick-label-${tick.value}`}
            >
              {tick.value}ms
            </div>
            <div
              className="exploreTimelineRuler__tick"
              data-test-subj={`tick-mark-${tick.value}`}
            />
          </div>
        );
      })}
    </div>
  );
};
