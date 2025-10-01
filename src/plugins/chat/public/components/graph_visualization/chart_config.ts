/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TooltipProps,
  XYChartElementEvent,
  ElementClickListener,
  BrushEndListener,
  PointerEvent,
  TooltipType,
} from '@elastic/charts';
import moment from 'moment';

/**
 * Chart configuration interfaces
 */
export interface ChartSettings {
  showLegend: boolean;
  legendPosition: 'top' | 'bottom' | 'left' | 'right';
  enableTooltip: boolean;
  enableCrosshair: boolean;
  enableZoom: boolean;
  enablePan: boolean;
  animationDuration: number;
  pointRadius: number;
  lineWidth: number;
}

export interface ChartInteractionHandlers {
  onElementClick?: ElementClickListener;
  onBrushEnd?: BrushEndListener;
  onPointerUpdate?: (event: PointerEvent) => void;
}

export interface TooltipConfig {
  showTimestamp: boolean;
  timestampFormat: string;
  showSeriesName: boolean;
  valueFormatter: (value: number) => string;
  customHeader?: (values: any[]) => string;
}

/**
 * Default chart settings
 */
export const DEFAULT_CHART_SETTINGS: ChartSettings = {
  showLegend: true,
  legendPosition: 'bottom',
  enableTooltip: true,
  enableCrosshair: true,
  enableZoom: true,
  enablePan: true,
  animationDuration: 300,
  pointRadius: 3,
  lineWidth: 2,
};

/**
 * Default tooltip configuration
 */
export const DEFAULT_TOOLTIP_CONFIG: TooltipConfig = {
  showTimestamp: true,
  timestampFormat: 'YYYY-MM-DD HH:mm:ss',
  showSeriesName: true,
  valueFormatter: (value: number) => {
    // Format numbers with appropriate precision
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    } else if (Math.abs(value) < 1 && value !== 0) {
      return value.toFixed(4);
    } else {
      return value.toFixed(2);
    }
  },
};

/**
 * Performance settings for large datasets
 */
export const PERFORMANCE_SETTINGS = {
  // Maximum number of data points before sampling
  MAX_DATA_POINTS: 1000,
  // Animation threshold - disable animations for large datasets
  ANIMATION_THRESHOLD: 500,
  // Debounce delay for interactions (ms)
  INTERACTION_DEBOUNCE: 100,
};

/**
 * Creates default chart settings with theme integration
 */
export function createChartSettings(
  customSettings: Partial<ChartSettings> = {},
  handlers: ChartInteractionHandlers = {}
) {
  const settings = { ...DEFAULT_CHART_SETTINGS, ...customSettings };

  return {
    showLegend: settings.showLegend,
    legendPosition: settings.legendPosition,
    onElementClick: handlers.onElementClick,
    onBrushEnd: handlers.onBrushEnd,
    onPointerUpdate: handlers.onPointerUpdate,
    animationDuration: settings.animationDuration,
  };
}

/**
 * Creates tooltip settings with custom formatters
 */
export function createTooltipSettings(config: Partial<TooltipConfig> = {}): TooltipProps {
  const tooltipConfig = { ...DEFAULT_TOOLTIP_CONFIG, ...config };

  return {
    type: TooltipType.VerticalCursor,
    headerFormatter: (tooltipData) => {
      if (!tooltipConfig.showTimestamp || !tooltipData.value) {
        return '';
      }

      if (tooltipConfig.customHeader) {
        return tooltipConfig.customHeader([tooltipData]);
      }

      // Format timestamp
      const timestamp = new Date(tooltipData.value);
      return moment(timestamp).format(tooltipConfig.timestampFormat);
    },
  };
}

/**
 * Creates axis configurations for time series data
 */
export function createAxisConfigs() {
  return {
    xAxis: {
      id: 'time',
      title: 'Time',
      position: 'bottom' as const,
      tickFormat: (value: number) => {
        const date = new Date(value);
        return moment(date).format('HH:mm:ss');
      },
    },
    yAxis: {
      id: 'value',
      title: 'Value',
      position: 'left' as const,
      tickFormat: (value: number) => DEFAULT_TOOLTIP_CONFIG.valueFormatter(value),
    },
  };
}

/**
 * Creates interaction handlers for chart events
 */
export function createInteractionHandlers(
  onDataPointClick?: (event: XYChartElementEvent[]) => void,
  onZoom?: (domain: { xDomain: [number, number]; yDomain: [number, number] }) => void,
  onHover?: (event: PointerEvent) => void
): ChartInteractionHandlers {
  return {
    onElementClick: onDataPointClick
      ? (elements) => {
          if (elements.length > 0) {
            // Filter to only XY chart events
            const xyEvents = elements.filter(
              (event): event is XYChartElementEvent => Array.isArray(event) && event.length === 2
            );
            if (xyEvents.length > 0) {
              onDataPointClick(xyEvents);
            }
          }
        }
      : undefined,

    onBrushEnd: onZoom
      ? (brushArea) => {
          if (brushArea && brushArea.x && brushArea.y) {
            const xDomain = Array.isArray(brushArea.x) ? brushArea.x : [brushArea.x, brushArea.x];
            const yDomain = Array.isArray(brushArea.y) ? brushArea.y : [brushArea.y, brushArea.y];

            if (xDomain.length >= 2 && yDomain.length >= 2) {
              onZoom({
                xDomain: [Number(xDomain[0]), Number(xDomain[1])],
                yDomain: [Number(yDomain[0]), Number(yDomain[1])],
              });
            }
          }
        }
      : undefined,

    onPointerUpdate: onHover,
  };
}

/**
 * Optimizes chart settings based on data size
 */
export function optimizeSettingsForDataSize(
  dataPointCount: number,
  baseSettings: ChartSettings
): ChartSettings {
  const optimizedSettings = { ...baseSettings };

  // Disable animations for large datasets
  if (dataPointCount > PERFORMANCE_SETTINGS.ANIMATION_THRESHOLD) {
    optimizedSettings.animationDuration = 0;
  }

  // Reduce point radius for dense data
  if (dataPointCount > PERFORMANCE_SETTINGS.MAX_DATA_POINTS) {
    optimizedSettings.pointRadius = Math.max(1, optimizedSettings.pointRadius - 1);
    optimizedSettings.lineWidth = Math.max(1, optimizedSettings.lineWidth - 0.5);
  }

  return optimizedSettings;
}

/**
 * Creates responsive chart dimensions
 */
export function createResponsiveDimensions(
  containerWidth: number,
  containerHeight: number,
  isExpanded: boolean = false
) {
  const minHeight = isExpanded ? 400 : 200;
  const maxHeight = isExpanded ? 800 : 400;
  const aspectRatio = isExpanded ? 16 / 9 : 4 / 3;

  let width = containerWidth;
  let height = containerHeight;

  // Ensure minimum dimensions
  if (height < minHeight) {
    height = minHeight;
  }

  // Ensure maximum dimensions
  if (height > maxHeight) {
    height = maxHeight;
  }

  // Maintain aspect ratio if needed
  if (isExpanded && width / height > aspectRatio) {
    width = height * aspectRatio;
  }

  return { width, height };
}

/**
 * Debounce utility for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Creates performance-optimized interaction handlers
 */
export function createOptimizedInteractionHandlers(
  handlers: ChartInteractionHandlers
): ChartInteractionHandlers {
  return {
    onElementClick: handlers.onElementClick,
    onBrushEnd: handlers.onBrushEnd,
    onPointerUpdate: handlers.onPointerUpdate
      ? debounce(handlers.onPointerUpdate, PERFORMANCE_SETTINGS.INTERACTION_DEBOUNCE)
      : undefined,
  };
}
