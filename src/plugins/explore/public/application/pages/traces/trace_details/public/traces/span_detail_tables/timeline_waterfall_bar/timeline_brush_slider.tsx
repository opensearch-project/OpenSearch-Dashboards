/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { Span } from '../types';
import { TraceTimeRange, calculateSpanTimeRange } from '../../../utils/span_timerange_utils';
import { useTimelineBarColor } from './timeline_waterfall_bar_hooks';
import './timeline_brush_slider.scss';

export interface TimelineBrushSliderProps {
  /** Full trace time range (the brush's extent). */
  traceTimeRange: TraceTimeRange;
  /** Current visible window; defaults to the full range when omitted. */
  visibleRange?: TraceTimeRange;
  /** Spans rendered as an overview behind the brush. */
  spans: Span[];
  colorMap?: Record<string, string>;
  /** Horizontal padding (%) to align with the bars/ruler. */
  paddingPercent?: number;
  /** Emits the new window, or null when reset to the full range. */
  onChange: (range: TraceTimeRange | null) => void;
}

// Minimum window width as a fraction of the full range, to avoid a zero-width zoom.
const MIN_WINDOW_FRACTION = 0.02;

// Evenly-spaced tick fractions drawn across the overview so the minimap reads as
// a time strip (not just a colored blob).
const BRUSH_TICK_FRACTIONS = [0.25, 0.5, 0.75];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// Compact total-duration caption for the minimap (e.g. "2.26s", "480ms").
const formatTotalDuration = (durationMs: number): string => {
  if (durationMs >= 1000) {
    return `${(durationMs / 1000).toFixed(2)}s`;
  }
  return `${Math.round(durationMs)}ms`;
};

type DragMode = 'left' | 'right' | 'move';

const SpanOverviewBar: React.FC<{
  span: Span;
  traceTimeRange: TraceTimeRange;
  colorMap?: Record<string, string>;
}> = ({ span, traceTimeRange, colorMap }) => {
  const color = useTimelineBarColor(span, colorMap);
  const { startTimeMs, durationMs } = calculateSpanTimeRange(span);
  const { startTimeMs: traceStart, durationMs: traceDuration } = traceTimeRange;
  const dur = traceDuration || 1;
  const left = clamp(((startTimeMs - traceStart) / dur) * 100, 0, 100);
  const width = clamp((durationMs / dur) * 100, 0.3, 100 - left);

  return (
    <div
      className="exploreTimelineBrush__overviewBar"
      style={{ left: `${left}%`, width: `${width}%`, backgroundColor: color }}
    />
  );
};

export const TimelineBrushSlider: React.FC<TimelineBrushSliderProps> = ({
  traceTimeRange,
  visibleRange,
  spans,
  colorMap,
  paddingPercent = 2,
  onChange,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragModeRef = useRef<DragMode | null>(null);
  const rafRef = useRef<number | null>(null);

  const { startTimeMs: traceStart, durationMs: traceDuration } = traceTimeRange;
  const fullDuration = traceDuration || 1;

  const startFrac = visibleRange
    ? clamp((visibleRange.startTimeMs - traceStart) / fullDuration, 0, 1)
    : 0;
  const endFrac = visibleRange
    ? clamp((visibleRange.endTimeMs - traceStart) / fullDuration, 0, 1)
    : 1;

  const isZoomed = startFrac > 0 || endFrac < 1;

  // Keep the latest fractions available to the window-level pointer listeners.
  const fracRef = useRef({ start: startFrac, end: endFrac });
  fracRef.current = { start: startFrac, end: endFrac };
  const pointerStartRef = useRef({ x: 0, start: 0, end: 0 });

  const emit = useCallback(
    (nextStart: number, nextEnd: number) => {
      const runEmit = () => {
        if (nextStart <= 0 && nextEnd >= 1) {
          onChange(null);
          return;
        }
        const startMs = traceStart + nextStart * fullDuration;
        const endMs = traceStart + nextEnd * fullDuration;
        onChange({ startTimeMs: startMs, endTimeMs: endMs, durationMs: endMs - startMs });
      };
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        runEmit();
      });
    },
    [onChange, traceStart, fullDuration]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const mode = dragModeRef.current;
      const track = trackRef.current;
      if (!mode || !track) return;
      const rect = track.getBoundingClientRect();
      if (rect.width === 0) return;
      const deltaFrac = (event.clientX - pointerStartRef.current.x) / rect.width;
      const { start, end } = pointerStartRef.current;

      let nextStart = start;
      let nextEnd = end;
      if (mode === 'left') {
        nextStart = clamp(start + deltaFrac, 0, end - MIN_WINDOW_FRACTION);
      } else if (mode === 'right') {
        nextEnd = clamp(end + deltaFrac, start + MIN_WINDOW_FRACTION, 1);
      } else {
        const windowWidth = end - start;
        nextStart = clamp(start + deltaFrac, 0, 1 - windowWidth);
        nextEnd = nextStart + windowWidth;
      }
      emit(nextStart, nextEnd);
    },
    [emit]
  );

  const stopDragging = useCallback(() => {
    dragModeRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', stopDragging);
  }, [handlePointerMove]);

  const startDragging = useCallback(
    (mode: DragMode) => (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dragModeRef.current = mode;
      pointerStartRef.current = {
        x: event.clientX,
        start: fracRef.current.start,
        end: fracRef.current.end,
      };
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', stopDragging);
    },
    [handlePointerMove, stopDragging]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
    };
  }, [handlePointerMove, stopDragging]);

  const reset = useCallback(() => onChange(null), [onChange]);

  const innerStyle: React.CSSProperties = {
    left: `${paddingPercent}%`,
    right: `${paddingPercent}%`,
  };

  return (
    <div className="exploreTimelineBrush" data-test-subj="timelineBrushSlider">
      <div className="exploreTimelineBrush__track" style={innerStyle} ref={trackRef}>
        {BRUSH_TICK_FRACTIONS.map((frac) => (
          <div
            key={frac}
            className="exploreTimelineBrush__tick"
            style={{ left: `${frac * 100}%` }}
            data-test-subj={`timelineBrushTick-${frac}`}
          />
        ))}
        <div className="exploreTimelineBrush__overview">
          {spans.map((span) => (
            <SpanOverviewBar
              key={span.spanId}
              span={span}
              traceTimeRange={traceTimeRange}
              colorMap={colorMap}
            />
          ))}
        </div>
        {/* Dim the regions outside the selected window so the brush reads as a
            range selector (bright window = current view, dark = excluded). */}
        {isZoomed && (
          <>
            <div
              className="exploreTimelineBrush__mask"
              style={{ left: 0, width: `${startFrac * 100}%` }}
            />
            <div
              className="exploreTimelineBrush__mask"
              style={{ left: `${endFrac * 100}%`, right: 0 }}
            />
          </>
        )}
        <div
          className={classNames('exploreTimelineBrush__window', {
            'exploreTimelineBrush__window--zoomed': isZoomed,
          })}
          style={{ left: `${startFrac * 100}%`, width: `${(endFrac - startFrac) * 100}%` }}
          onPointerDown={startDragging('move')}
          onDoubleClick={reset}
          data-test-subj="timelineBrushWindow"
        >
          <div
            className="exploreTimelineBrush__handle exploreTimelineBrush__handle--left"
            onPointerDown={startDragging('left')}
            data-test-subj="timelineBrushHandleLeft"
          />
          <div
            className="exploreTimelineBrush__handle exploreTimelineBrush__handle--right"
            onPointerDown={startDragging('right')}
            data-test-subj="timelineBrushHandleRight"
          />
        </div>
      </div>
      <div
        className="exploreTimelineBrush__total"
        style={{ right: `${paddingPercent}%` }}
        data-test-subj="timelineBrushTotal"
      >
        {formatTotalDuration(traceDuration || 0)} total
      </div>
    </div>
  );
};
