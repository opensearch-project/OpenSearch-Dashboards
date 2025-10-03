/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TraceTimeRange } from '../../utils/span_timerange_utils';
import './timeline_ruler.scss';
import { useTimelineTicks } from './timeline_ruler_hooks';

export interface TimelineRulerProps {
  traceTimeRange: TraceTimeRange;
  paddingPercent?: number;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  traceTimeRange,
  paddingPercent = 2,
}) => {
  const ticks = useTimelineTicks(traceTimeRange.durationMs, 0, 8, paddingPercent);

  return (
    <div className="exploreTimelineRuler" style={{ height: '30px', position: 'relative' }}>
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
