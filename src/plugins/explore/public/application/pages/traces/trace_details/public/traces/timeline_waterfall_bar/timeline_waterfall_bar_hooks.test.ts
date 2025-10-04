/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useTimelineBarColor, useTimelineBarRange } from './timeline_waterfall_bar_hooks';
import { calculateSpanTimeRange } from '../../utils/span_timerange_utils';
import { resolveServiceNameFromSpan } from '../ppl_resolve_helpers';
import { Span } from '../span_detail_table';

jest.mock('../../utils/span_timerange_utils');
jest.mock('../ppl_resolve_helpers');

const mockCalculateSpanTimeRange = calculateSpanTimeRange as jest.MockedFunction<
  typeof calculateSpanTimeRange
>;
const mockResolveServiceNameFromSpan = resolveServiceNameFromSpan as jest.MockedFunction<
  typeof resolveServiceNameFromSpan
>;

describe('timeline_waterfall_bar_hooks', () => {
  const mockSpan: Span = {
    spanId: 'span-1',
    children: [],
    serviceName: 'test-service',
    startTime: 1000,
    endTime: 2000,
  } as Span;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useTimelineBarColor', () => {
    it('should return color from colorMap when service name exists', () => {
      mockResolveServiceNameFromSpan.mockReturnValue('test-service');
      const colorMap = { 'test-service': '#ff0000' };

      const { result } = renderHook(() => useTimelineBarColor(mockSpan, colorMap));

      expect(result.current).toBe('#ff0000');
    });

    it('should return default color when service name not in colorMap', () => {
      mockResolveServiceNameFromSpan.mockReturnValue('unknown-service');
      const colorMap = { 'test-service': '#ff0000' };

      const { result } = renderHook(() => useTimelineBarColor(mockSpan, colorMap));

      expect(result.current).toBe('#ff7f00');
    });

    it('should use span.serviceName when resolveServiceNameFromSpan returns empty string', () => {
      mockResolveServiceNameFromSpan.mockReturnValue('');
      const colorMap = { 'test-service': '#00ff00' };

      const { result } = renderHook(() => useTimelineBarColor(mockSpan, colorMap));

      expect(result.current).toBe('#00ff00');
    });

    it('should use "unknown" when both resolveServiceNameFromSpan and span.serviceName are not present', () => {
      mockResolveServiceNameFromSpan.mockReturnValue('');
      const spanWithoutService = { ...mockSpan, serviceName: undefined };
      const colorMap = { unknown: '#0000ff' };

      const { result } = renderHook(() => useTimelineBarColor(spanWithoutService, colorMap));

      expect(result.current).toBe('#0000ff');
    });

    it('should return default color when colorMap is undefined', () => {
      mockResolveServiceNameFromSpan.mockReturnValue('test-service');

      const { result } = renderHook(() => useTimelineBarColor(mockSpan));

      expect(result.current).toBe('#ff7f00');
    });
  });

  describe('useTimelineBarRange', () => {
    const traceTimeRange = {
      durationMs: 5000,
      startTimeMs: 1000,
      endTimeMs: 6000,
    };

    it('should calculate correct timeline bar range', () => {
      mockCalculateSpanTimeRange.mockReturnValue({
        durationMs: 1000,
        startTimeMs: 2000,
        endTimeMs: 3000,
      });

      const { result } = renderHook(() => useTimelineBarRange(mockSpan, traceTimeRange));

      expect(result.current).toEqual({
        timelineBarOffsetPercent: 20, // (2000 - 1000) / 5000 * 100
        timelineBarWidthPercent: 20, // 1000 / 5000 * 100
        durationMs: 1000,
        relativeStart: 1000, // 2000 - 1000
        relativeEnd: 2000, // 3000 - 1000
      });
    });

    it('should ensure minimum width of 1 percent', () => {
      mockCalculateSpanTimeRange.mockReturnValue({
        durationMs: 10, // Very small duration
        startTimeMs: 1000,
        endTimeMs: 1010,
      });

      const { result } = renderHook(() => useTimelineBarRange(mockSpan, traceTimeRange));

      expect(result.current.timelineBarWidthPercent).toBe(1);
    });

    it('should handle span at trace start', () => {
      mockCalculateSpanTimeRange.mockReturnValue({
        durationMs: 500,
        startTimeMs: 1000, // Same as trace start
        endTimeMs: 1500,
      });

      const { result } = renderHook(() => useTimelineBarRange(mockSpan, traceTimeRange));

      expect(result.current).toEqual({
        timelineBarOffsetPercent: 0,
        timelineBarWidthPercent: 10, // 500 / 5000 * 100
        durationMs: 500,
        relativeStart: 0,
        relativeEnd: 500,
      });
    });

    it('should handle span at trace end', () => {
      mockCalculateSpanTimeRange.mockReturnValue({
        durationMs: 1000,
        startTimeMs: 5000,
        endTimeMs: 6000, // Same as trace end
      });

      const { result } = renderHook(() => useTimelineBarRange(mockSpan, traceTimeRange));

      expect(result.current).toEqual({
        timelineBarOffsetPercent: 80, // (5000 - 1000) / 5000 * 100
        timelineBarWidthPercent: 20, // 1000 / 5000 * 100
        durationMs: 1000,
        relativeStart: 4000, // 5000 - 1000
        relativeEnd: 5000, // 6000 - 1000
      });
    });

    it('should adjust calculations when paddingPercent is provided', () => {
      mockCalculateSpanTimeRange.mockReturnValue({
        durationMs: 1000,
        startTimeMs: 2000,
        endTimeMs: 3000,
      });

      const { result } = renderHook(() => useTimelineBarRange(mockSpan, traceTimeRange, 5));

      expect(result.current).toEqual({
        timelineBarOffsetPercent: 18, // 20 * (100 - 10) / 100 = 18
        timelineBarWidthPercent: 18, // 20 * (100 - 10) / 100 = 18
        durationMs: 1000,
        relativeStart: 1000,
        relativeEnd: 2000,
      });
    });
  });
});
