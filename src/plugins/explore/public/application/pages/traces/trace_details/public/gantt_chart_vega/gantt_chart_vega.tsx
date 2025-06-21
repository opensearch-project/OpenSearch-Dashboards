/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, parse } from 'vega';
import { createGanttSpec } from './gantt_chart_spec';
import { convertToVegaGanttData } from './gantt_data_adapter';

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

  // Calculate the maximum label width needed (simplified since text gets truncated)
  const calculateMaxLabelWidth = (): number => {
    // Since Vega handles text truncation with the 'limit' property,
    // we just need a reasonable fixed width rather than calculating actual text width
    return 70; // Fixed reasonable width since truncation handles overflow
  };

  const calculateHeight = useCallback(
    (dataLength: number): number => {
      const minRowHeight = 35;
      const baseHeaderFooterHeight = 100; // Height for axes, padding, etc.

      if (dataLength === 0) {
        return 150; // Minimal height for empty state
      }

      if (dataLength === 1) {
        return 120; // Compact height for single span
      }

      // For multiple spans, calculate based on content
      const contentHeight = dataLength * minRowHeight + baseHeaderFooterHeight;

      // Set reasonable bounds
      const minHeight = 150;
      const maxHeight = 600;

      const proposedHeight = height > 0 ? Math.max(height, contentHeight) : contentHeight;

      return Math.max(minHeight, Math.min(maxHeight, proposedHeight));
    },
    [height]
  );

  // Update container width when component mounts or window resizes
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerWidth(rect.width || 800);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  useEffect(() => {
    const initializeView = async () => {
      if (!containerRef.current || containerWidth === 0) return;

      if (viewRef.current) {
        viewRef.current.finalize();
      }

      try {
        const vegaData = convertToVegaGanttData(data, colorMap);

        const maxLabelWidth = calculateMaxLabelWidth();

        const chartHeight = calculateHeight(data.length);

        const spec = createGanttSpec(chartHeight, data.length, containerWidth, maxLabelWidth);

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
        minWidth: '400px',
        minHeight: '120px',
      }}
    />
  );
}
