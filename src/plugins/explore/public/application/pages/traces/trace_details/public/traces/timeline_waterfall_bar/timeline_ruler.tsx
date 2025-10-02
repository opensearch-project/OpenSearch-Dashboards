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
    <div className="timeline_ruler" style={{ height: '30px', position: 'relative' }}>
      <div className="timeline_ruler__baseline" />
      {ticks.map((tick, index) => {
        const labelClassName =
          index === 0
            ? 'timeline_ruler__label--first'
            : index === ticks.length - 1
            ? 'timeline_ruler__label--last'
            : 'timeline_ruler__label--center';

        return (
          <div
            key={tick.value}
            className="timeline_ruler__tick_container"
            style={{ left: `${tick.offsetPercent}%` }}
            data-test-subj={`tick-container-${tick.value}`}
          >
            <div
              className={`timeline_ruler__label ${labelClassName}`}
              data-test-subj={`tick-label-${tick.value}`}
            >
              {tick.value}ms
            </div>
            <div className="timeline_ruler__tick" data-test-subj={`tick-mark-${tick.value}`} />
          </div>
        );
      })}
    </div>
  );
};
