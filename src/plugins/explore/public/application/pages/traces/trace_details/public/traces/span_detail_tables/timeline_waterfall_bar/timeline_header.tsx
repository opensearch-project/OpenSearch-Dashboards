/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TimelineRuler, TimelineRulerProps } from './timeline_ruler';
import { TimelineBrushSlider } from './timeline_brush_slider';
import { Span } from '../types';
import { TraceTimeRange } from '../../../utils/span_timerange_utils';

export interface TimelineHeaderProps extends TimelineRulerProps {
  /** When provided, renders a brush/overview slider beneath the ruler for zoom. */
  brush?: {
    spans: Span[];
    colorMap?: Record<string, string>;
    onChange: (range: TraceTimeRange | null) => void;
  };
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({ brush, ...rulerProps }) => {
  return (
    <EuiFlexGroup direction="column" gutterSize="xs">
      <EuiFlexItem grow={false}>
        <EuiText size="xs">
          <b>
            {i18n.translate('explore.spanDetailTable.column.timeline', {
              defaultMessage: 'Timeline',
            })}
          </b>
        </EuiText>
      </EuiFlexItem>
      <TimelineRuler {...rulerProps} />
      {brush && (
        <EuiFlexItem grow={false}>
          <TimelineBrushSlider
            traceTimeRange={rulerProps.traceTimeRange}
            visibleRange={rulerProps.visibleRange}
            spans={brush.spans}
            colorMap={brush.colorMap}
            paddingPercent={rulerProps.paddingPercent}
            onChange={brush.onChange}
          />
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
