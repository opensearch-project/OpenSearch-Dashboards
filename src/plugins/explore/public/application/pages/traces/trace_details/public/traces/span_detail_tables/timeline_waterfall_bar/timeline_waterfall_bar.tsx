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
import { formatSpanDuration } from '../../../utils/helper_functions';
import { extractSpanDuration } from '../../../utils/span_data_utils';
import './timeline_waterfall_bar.scss';

// The timeline hook's start/end offsets are in milliseconds; formatSpanDuration
// takes nanoseconds.
const MS_TO_NANOS = 1_000_000;

export interface TimelineWaterfallBarProps {
  span: Span;
  traceTimeRange: TraceTimeRange;
  colorMap?: Record<string, string>;
  paddingPercent?: number;
  isSelected?: boolean;
  /** Visible time window driven by the timeline brush (zoom). */
  visibleRange?: TraceTimeRange;
}

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
    relativeStart,
    relativeEnd,
    isOutsideWindow,
  } = useTimelineBarRange(span, traceTimeRange, paddingPercent, visibleRange);

  // Formatted with the shared ladder (ns -> µs -> ms -> s -> min) so labels read
  // consistently with the Discover Traces grid. Duration uses the raw span
  // nanoseconds (the hook's durationMs is rounded to ms and would lose sub-ms
  // precision, e.g. 512ns -> "1 µs"). Start/End are elapsed offsets from the
  // trace start (ms), so the same ladder applies.
  const durationLabel = formatSpanDuration(extractSpanDuration(span));
  const startLabel = formatSpanDuration(relativeStart * MS_TO_NANOS);
  const endLabel = formatSpanDuration(relativeEnd * MS_TO_NANOS);

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
                <EuiText size="s">Duration: {durationLabel}</EuiText>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText size="s">Start: {startLabel}</EuiText>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText size="s">End: {endLabel}</EuiText>
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
          {durationLabel}
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
