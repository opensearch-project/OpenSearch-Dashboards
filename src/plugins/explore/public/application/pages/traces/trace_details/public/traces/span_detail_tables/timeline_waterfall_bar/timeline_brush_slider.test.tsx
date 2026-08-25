/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TimelineBrushSlider } from './timeline_brush_slider';
import { Span } from '../types';

jest.mock('./timeline_waterfall_bar_hooks', () => ({
  useTimelineBarColor: () => '#123456',
}));

jest.mock('../../../utils/span_timerange_utils', () => ({
  calculateSpanTimeRange: (span: any) => ({
    startTimeMs: span.startTime,
    endTimeMs: span.endTime,
    durationMs: span.endTime - span.startTime,
  }),
}));

const traceTimeRange = { startTimeMs: 1000, endTimeMs: 6000, durationMs: 5000 };
const spans: Span[] = [
  { spanId: 's1', startTime: 1000, endTime: 2000 } as Span,
  { spanId: 's2', startTime: 2000, endTime: 4000 } as Span,
  { spanId: 's3', startTime: 4000, endTime: 6000 } as Span,
];

describe('TimelineBrushSlider', () => {
  let raf: jest.SpyInstance;
  let rect: jest.SpyInstance;

  beforeEach(() => {
    // Run rAF callbacks synchronously so onChange fires within the test.
    raf = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: any) => {
      cb(0);
      return 0;
    });
    // Give the track a deterministic width for px -> fraction math.
    rect = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 1000,
      left: 0,
      right: 1000,
      top: 0,
      bottom: 22,
      height: 22,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
  });

  afterEach(() => {
    raf.mockRestore();
    rect.mockRestore();
  });

  it('renders one overview bar per span', () => {
    const { container } = render(
      <TimelineBrushSlider traceTimeRange={traceTimeRange} spans={spans} onChange={jest.fn()} />
    );
    expect(container.querySelectorAll('.exploreTimelineBrush__overviewBar')).toHaveLength(3);
  });

  it('resets to the full range on double-click', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <TimelineBrushSlider traceTimeRange={traceTimeRange} spans={spans} onChange={onChange} />
    );
    fireEvent.doubleClick(getByTestId('timelineBrushWindow'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('emits a window on left-handle drag, keeping the trace end fixed', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <TimelineBrushSlider
        traceTimeRange={traceTimeRange}
        spans={spans}
        onChange={onChange}
        paddingPercent={0}
      />
    );

    // Drag the left handle inward. (jsdom does not carry clientX on synthetic
    // pointer events, so the exact start is verified in-browser; here we assert
    // the drag path fires onChange with the right edge left at the trace end.)
    fireEvent.pointerDown(getByTestId('timelineBrushHandleLeft'), { clientX: 0 });
    fireEvent.pointerMove(window, { clientX: 250 });
    fireEvent.pointerUp(window);

    expect(onChange).toHaveBeenCalled();
    const arg = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(arg).not.toBeNull();
    expect(arg.endTimeMs).toBe(6000);
  });
});
