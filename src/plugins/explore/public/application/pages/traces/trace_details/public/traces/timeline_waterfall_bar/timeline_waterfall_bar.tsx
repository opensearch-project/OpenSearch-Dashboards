/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiToolTip, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { Span } from '../span_detail_table';
import { TraceTimeRange } from '../../utils/span_timerange_utils';
import { useTimelineBarColor, useTimelineBarRange } from './timeline_waterfall_bar_hooks';

export interface TimelineWaterfallBarProps {
  span: Span;
  traceTimeRange: TraceTimeRange;
  colorMap?: Record<string, string>;
  paddingPercent?: number;
}

export const TimelineWaterfallBar: React.FC<TimelineWaterfallBarProps> = ({
  span,
  traceTimeRange,
  colorMap,
  paddingPercent = 2,
}) => {
  const timelineBarColor = useTimelineBarColor(span, colorMap);
  const {
    timelineBarOffsetPercent,
    timelineBarWidthPercent,
    durationMs,
    relativeStart,
    relativeEnd,
  } = useTimelineBarRange(span, traceTimeRange, paddingPercent);

  return (
    <EuiFlexGroup gutterSize="none" alignItems="center">
      <EuiFlexItem
        grow={false}
        style={{ width: `${paddingPercent + timelineBarOffsetPercent}%` }}
        data-test-subj="timeline-bar-offset"
      />
      <EuiFlexItem
        grow={false}
        style={{
          width: `${timelineBarWidthPercent}%`,
          backgroundColor: timelineBarColor,
          cursor: 'pointer',
        }}
        data-test-subj="timeline-bar"
      >
        <EuiToolTip
          content={
            <EuiFlexGroup
              direction="column"
              gutterSize="none"
              data-testid="timeline-tooltip-content"
            >
              <EuiFlexItem>
                <EuiText size="s">Duration: {durationMs} ms</EuiText>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText size="s">Start: {relativeStart} ms</EuiText>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText size="s">End: {relativeEnd} ms</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          }
        >
          <div
            style={{ height: '1.25rem', width: '100%' }}
            data-test-subj="timeline-bar-tooltip-anchor"
          />
        </EuiToolTip>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
