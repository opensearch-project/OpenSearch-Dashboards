/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimelineWaterfallBar } from './timeline_waterfall_bar';
import { useTimelineBarColor, useTimelineBarRange } from './timeline_waterfall_bar_hooks';
import { Span } from '../span_detail_table';

jest.mock('./timeline_waterfall_bar_hooks');

const mockUseTimelineBarColor = useTimelineBarColor as jest.MockedFunction<
  typeof useTimelineBarColor
>;
const mockUseTimelineBarRange = useTimelineBarRange as jest.MockedFunction<
  typeof useTimelineBarRange
>;

describe('TimelineWaterfallBar', () => {
  const mockSpan: Span = {
    spanId: 'span-1',
    children: [],
    serviceName: 'test-service',
    startTime: 1000,
    endTime: 2000,
  } as Span;

  const mockTraceTimeRange = {
    durationMs: 5000,
    startTimeMs: 1000,
    endTimeMs: 6000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTimelineBarColor.mockReturnValue('#ff0000');
    mockUseTimelineBarRange.mockReturnValue({
      timelineBarOffsetPercent: 20,
      timelineBarWidthPercent: 30,
      durationMs: 1500,
      relativeStart: 1000,
      relativeEnd: 2500,
    });
  });

  it('should render timeline-bar-offset with correct width', () => {
    const { getByTestId } = render(
      <TimelineWaterfallBar
        span={mockSpan}
        traceTimeRange={mockTraceTimeRange}
        paddingPercent={2}
      />
    );

    const offsetElement = getByTestId('timeline-bar-offset');
    expect(offsetElement).toHaveStyle({ width: '22%' }); // 2 + 20
  });

  it('should render timeline-bar with correct width and color', () => {
    const { getByTestId } = render(
      <TimelineWaterfallBar span={mockSpan} traceTimeRange={mockTraceTimeRange} />
    );

    const barElement = getByTestId('timeline-bar');
    expect(barElement).toHaveStyle({
      width: '30%',
      backgroundColor: '#ff0000',
      cursor: 'pointer',
    });
  });

  it('should render tooltip with correct Duration, Start, and End values on hover', async () => {
    const { getByTestId } = render(
      <TimelineWaterfallBar span={mockSpan} traceTimeRange={mockTraceTimeRange} />
    );

    const toolTipAnchor = getByTestId('timeline-bar-tooltip-anchor');
    fireEvent.mouseEnter(toolTipAnchor);

    await waitFor(
      () => {
        expect(screen.getByText('Duration: 1500 ms')).toBeInTheDocument();
        expect(screen.getByText('Start: 1000 ms')).toBeInTheDocument();
        expect(screen.getByText('End: 2500 ms')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
