/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, parse } from 'vega';
import { createGanttSpec } from './gantt_chart_spec';
import { convertToVegaGanttData } from './gantt_data_adapter';
import { GANTT_CHART_CONSTANTS, TOTAL_PADDING } from './gantt_constants';

interface GanttChartProps {
  data: any[];
  colorMap: Record<string, string>;
  height: number;
  onSpanClick?: (spanId: string) => void;
}

export function GanttChart({ data, colorMap, height, onSpanClick }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  const calculateHeight = useCallback(
    (dataLength: number): number => {
      if (dataLength === 0) {
        return GANTT_CHART_CONSTANTS.EMPTY_STATE_HEIGHT;
      }

      if (dataLength === 1) {
        return GANTT_CHART_CONSTANTS.SINGLE_SPAN_HEIGHT;
      }

      // For multiple spans, calculate based on content - match Vega spec calculation
      const contentHeight =
        dataLength * GANTT_CHART_CONSTANTS.MIN_ROW_HEIGHT +
        GANTT_CHART_CONSTANTS.BASE_CALCULATION_HEIGHT;
      const finalHeight = contentHeight + TOTAL_PADDING;

      const proposedHeight = height > 0 ? Math.max(height, finalHeight) : finalHeight;

      return Math.max(
        GANTT_CHART_CONSTANTS.MIN_HEIGHT,
        Math.min(GANTT_CHART_CONSTANTS.MAX_HEIGHT, proposedHeight)
      );
    },
    [height]
  );

  // Update container width when component mounts, window resizes, or container resizes
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = rect.width || 800;
        if (Math.abs(newWidth - containerWidth) > 10) {
          // Only update if significant change
          setContainerWidth(newWidth);
        }
      }
    };

    updateWidth();

    // Listen for window resize
    window.addEventListener('resize', updateWidth);

    // Set up ResizeObserver to detect container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          // Debounce the resize to avoid too many updates
          setTimeout(updateWidth, 100);
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [containerWidth]);

  useEffect(() => {
    const initializeView = async () => {
      if (!containerRef.current || containerWidth === 0) return;

      if (viewRef.current) {
        viewRef.current.finalize();
      }

      try {
        const vegaData = convertToVegaGanttData(data, colorMap);

        const chartHeight = calculateHeight(data.length);

        const spec = createGanttSpec(chartHeight, data.length, containerWidth);

        const runtime = parse(spec);
        const view = new View(runtime).renderer('svg').initialize(containerRef.current);

        await view.data('spans', vegaData.values).run();

        // Add click handler
        if (onSpanClick) {
          view.addEventListener('click', (event, item) => {
            if (item && item.datum && item.datum.spanId) {
              onSpanClick(item.datum.spanId);
            }
          });
        }

        viewRef.current = view;
      } catch (error) {
        // Handle error silently or use a proper error handling mechanism
        // Error setting up Vega view is non-critical and shouldn't break the UI
      }
    };

    initializeView();

    return () => {
      if (viewRef.current) {
        viewRef.current.finalize();
      }
    };
  }, [data, colorMap, height, onSpanClick, containerWidth, calculateHeight]);

  const finalHeight = calculateHeight(data.length);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: `${finalHeight}px`,
        position: 'relative',
        overflow: 'visible',
        minWidth: `${GANTT_CHART_CONSTANTS.MIN_WIDTH}px`,
        minHeight: `${GANTT_CHART_CONSTANTS.MIN_CONTAINER_HEIGHT}px`,
      }}
    />
  );
}
