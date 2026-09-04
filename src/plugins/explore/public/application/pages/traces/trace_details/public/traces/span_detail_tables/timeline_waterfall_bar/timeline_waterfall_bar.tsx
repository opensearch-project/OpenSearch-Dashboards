/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiToolTip, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import classNames from 'classnames';
import { Span } from '../types';
import { TraceTimeRange } from '../../../utils/span_timerange_utils';
import { isSpanError } from '../../ppl_resolve_helpers';
import { useTimelineBarColor, useTimelineBarRange } from './timeline_waterfall_bar_hooks';
import './timeline_waterfall_bar.scss';

export interface TimelineWaterfallBarProps {
  span: Span;
  traceTimeRange: TraceTimeRange;
  colorMap?: Record<string, string>;
  paddingPercent?: number;
  isSelected?: boolean;
  /** Visible time window driven by the timeline brush (zoom). */
  visibleRange?: TraceTimeRange;
}

// Compact duration label shown at the bar's trailing edge (replaces the separate
// far-right Duration column so the timeline reclaims that gutter). Sub-second
// durations read as ms; anything >= 1s reads as seconds so long spans stay legible.
const formatBarDuration = (durationMs: number): string => {
  if (durationMs >= 1000) {
    return `${(durationMs / 1000).toFixed(2)}s`;
  }
  if (durationMs >= 10) {
    return `${Math.round(durationMs)}ms`;
  }
  return `${durationMs.toFixed(2)}ms`;
};

export const TimelineWaterfallBar: React.FC<TimelineWaterfallBarProps> = ({
  span,
  traceTimeRange,
  colorMap,
  paddingPercent = 2,
  isSelected = false,
  visibleRange,
}) => {
  const timelineBarColor = useTimelineBarColor(span, colorMap);
  const isError = isSpanError(span);
  const {
    timelineBarOffsetPercent,
    timelineBarWidthPercent,
    durationMs,
    relativeStart,
    relativeEnd,
    isOutsideWindow,
  } = useTimelineBarRange(span, traceTimeRange, paddingPercent, visibleRange);

  return (
    <EuiFlexGroup gutterSize="none" alignItems="center">
      <EuiFlexItem
        grow={false}
        style={{ width: `${paddingPercent + timelineBarOffsetPercent}%` }}
        data-test-subj="timeline-bar-offset"
      />
      <EuiFlexItem
        grow={false}
        className={classNames('exploreTimelineWaterfallBar__bar', {
          'exploreTimelineWaterfallBar__bar--selected': isSelected,
          'exploreTimelineWaterfallBar__bar--outside': isOutsideWindow,
          'exploreTimelineWaterfallBar__bar--error': isError,
        })}
        style={{
          width: `${Math.min(
            timelineBarWidthPercent,
            100 - paddingPercent * 2 - timelineBarOffsetPercent
          )}%`,
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
      {/* Inline duration at the bar's trailing edge — reads with the bar instead
          of forcing the eye out to a far-right Duration gutter. */}
      <EuiFlexItem grow={false}>
        <EuiText
          size="xs"
          color="subdued"
          className="exploreTimelineWaterfallBar__duration"
          data-test-subj="timeline-bar-duration"
        >
          {formatBarDuration(durationMs)}
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
