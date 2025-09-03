/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, parse } from 'vega';
import { Handler } from 'vega-tooltip';
import { createGanttSpec } from './gantt_chart_spec';
import { convertToVegaGanttData } from './gantt_data_adapter';
import { GANTT_CHART_CONSTANTS, TOTAL_PADDING } from './gantt_constants';
import { useOpenSearchDashboards } from '../../../../../../../../opensearch_dashboards_react/public';
import { DataExplorerServices } from '../../../../../../../../data_explorer/public';
import './gantt_chart_vega.scss';

interface GanttChartProps {
  data: any[];
  colorMap: Record<string, string>;
  height: number;
  onSpanClick?: (spanId: string) => void;
  selectedSpanId?: string;
  isEmbedded?: boolean;
}

export function GanttChart({
  data,
  colorMap,
  height,
  onSpanClick,
  selectedSpanId,
  isEmbedded,
}: GanttChartProps) {
  const { services } = useOpenSearchDashboards<DataExplorerServices>();
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

      // In embedded mode, don't apply maximum height constraint - let it grow to show all spans
      if (isEmbedded) {
        return Math.max(GANTT_CHART_CONSTANTS.MIN_HEIGHT, proposedHeight);
      }

      // In non-embedded mode, apply the maximum height constraint
      return Math.max(
        GANTT_CHART_CONSTANTS.MIN_HEIGHT,
        Math.min(GANTT_CHART_CONSTANTS.MAX_HEIGHT, proposedHeight)
      );
    },
    [height, isEmbedded]
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

    // Set initial width
    updateWidth();

    // Skip resize listeners in embedded mode to prevent rapid resizing
    if (isEmbedded) {
      return;
    }

    // Add resize listeners
    window.addEventListener('resize', updateWidth);

    // Set up ResizeObserver to detect container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        // Debounce the resize to avoid too many updates
        setTimeout(updateWidth, 100);
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [containerWidth, isEmbedded]);

  useEffect(() => {
    const initializeView = async () => {
      if (!containerRef.current || containerWidth === 0) return;

      if (viewRef.current) {
        viewRef.current.finalize();
      }

      try {
        const vegaData = convertToVegaGanttData(data, colorMap);

        const chartHeight = calculateHeight(data.length);

        const isDarkMode = services?.uiSettings?.get('theme:darkMode') || false;
        const spec = createGanttSpec(
          chartHeight,
          data.length,
          containerWidth,
          selectedSpanId,
          isDarkMode,
          isEmbedded
        );

        const runtime = parse(spec);
        const view = new View(runtime).renderer('svg').initialize(containerRef.current);

        // Configure tooltip to appear instantly using vega-tooltip
        const tooltipHandler = new Handler();

        // Set delay properties directly on the handler instance
        (tooltipHandler as any).delay = 0;
        (tooltipHandler as any).hideDelay = 200;

        view.tooltip(tooltipHandler.call);

        await view.data('spans', vegaData.values).run();

        // Add click handler mousedown needed or code block breaks it
        if (onSpanClick) {
          view.addEventListener('mousedown', (_, item) => {
            if (item && item.datum && item.datum.spanId) {
              onSpanClick(item.datum.spanId);
            }
          });
        }

        viewRef.current = view;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error initializing Gantt chart:', error);
      }
    };

    initializeView();

    return () => {
      if (viewRef.current) {
        viewRef.current.finalize();
      }
    };
  }, [
    data,
    colorMap,
    height,
    onSpanClick,
    containerWidth,
    calculateHeight,
    selectedSpanId,
    services?.uiSettings,
    isEmbedded,
  ]);

  const finalHeight = calculateHeight(data.length);

  return (
    <div
      ref={containerRef}
      className="exploreGanttChart__container"
      style={{
        height: `${finalHeight}px`,
        minWidth: `${GANTT_CHART_CONSTANTS.MIN_WIDTH}px`,
        minHeight: `${GANTT_CHART_CONSTANTS.MIN_CONTAINER_HEIGHT}px`,
      }}
    />
  );
}
