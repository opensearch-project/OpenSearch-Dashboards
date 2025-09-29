/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { TimelineRuler } from './timeline_ruler';
import { useTimelineTicks } from './timeline_ruler_hooks';

jest.mock('./timeline_ruler_hooks');

const mockUseTimelineTicks = useTimelineTicks as jest.MockedFunction<typeof useTimelineTicks>;

describe('TimelineRuler', () => {
  const mockTraceTimeRange = {
    durationMs: 1000,
    startTimeMs: 0,
    endTimeMs: 1000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render ticks with correct labels and offsets', () => {
    const mockTicks = [
      { value: 0, offsetPercent: 0 },
      { value: 250, offsetPercent: 25 },
      { value: 500, offsetPercent: 50 },
      { value: 750, offsetPercent: 75 },
      { value: 1000, offsetPercent: 100 },
    ];
    mockUseTimelineTicks.mockReturnValue(mockTicks);

    const { getByTestId } = render(<TimelineRuler traceTimeRange={mockTraceTimeRange} />);

    mockTicks.forEach((tick) => {
      const container = getByTestId(`tick-container-${tick.value}`);
      const label = getByTestId(`tick-label-${tick.value}`);
      const mark = getByTestId(`tick-mark-${tick.value}`);

      expect(container).toHaveStyle({ left: `${tick.offsetPercent}%` });
      expect(label).toHaveTextContent(`${tick.value}ms`);
      expect(mark).toBeInTheDocument();
    });
  });

  it('should apply correct CSS classes for first, last, and center ticks', () => {
    const mockTicks = [
      { value: 0, offsetPercent: 0 },
      { value: 500, offsetPercent: 50 },
      { value: 1000, offsetPercent: 100 },
    ];
    mockUseTimelineTicks.mockReturnValue(mockTicks);

    const { getByTestId } = render(<TimelineRuler traceTimeRange={mockTraceTimeRange} />);

    expect(getByTestId('tick-label-0')).toHaveClass('timelineRuler__label--first');
    expect(getByTestId('tick-label-500')).toHaveClass('timelineRuler__label--center');
    expect(getByTestId('tick-label-1000')).toHaveClass('timelineRuler__label--last');
  });

  it('should pass correct parameters to useTimelineTicks', () => {
    mockUseTimelineTicks.mockReturnValue([]);

    render(<TimelineRuler traceTimeRange={mockTraceTimeRange} paddingPercent={5} />);

    expect(mockUseTimelineTicks).toHaveBeenCalledWith(1000, 0, 8, 5);
  });

  it('should render empty when no ticks are provided', () => {
    mockUseTimelineTicks.mockReturnValue([]);

    const { container } = render(<TimelineRuler traceTimeRange={mockTraceTimeRange} />);

    expect(container.querySelectorAll('.timelineRuler__tickContainer')).toHaveLength(0);
  });
});
