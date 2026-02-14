/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisColumnMappings, AxisRole, VisFieldType, VisColumn } from '../types';

/**
 * Generates a default visualization title based on the chart type and axis mappings
 * @param chartType The type of visualization (line, bar, scatter, pie, etc.)
 * @param axisColumnMappings The axis column mappings
 * @param axisConfig Optional axis configuration
 * @returns A descriptive title string
 */
export function generateDefaultVisualizationTitle(
  chartType: string,
  axisColumnMappings: AxisColumnMappings
): string {
  const x = axisColumnMappings[AxisRole.X];
  const y = axisColumnMappings[AxisRole.Y];
  const color = axisColumnMappings[AxisRole.COLOR];
  const facet = axisColumnMappings[AxisRole.FACET];
  const size = axisColumnMappings[AxisRole.SIZE];

  // Determine if time-based
  const isTimeSeries = x?.schema === VisFieldType.Date;

  // Special handling for specific chart types
  switch (chartType.toLowerCase()) {
    case 'metric':
    case 'gauge':
      return y?.name || 'metric';

    case 'pie':
      if (size && color) {
        return `${size.name} by ${color.name}`;
      }
      return y?.name || 'value';

    case 'scatter':
      return generateScatterTitle(x, y, color, size);

    case 'heatmap':
      return generateHeatmapTitle(x, y, axisColumnMappings[AxisRole.COLOR]);

    case 'state_timeline':
      return generateStateTimelineTitle(x, y, color);

    default:
      // For line, bar, area charts
      return generateStandardTitle(y, x, color, facet, isTimeSeries);
  }
}

/**
 * Generate title for scatter plots
 */
function generateScatterTitle(
  x: VisColumn | undefined,
  y: VisColumn | undefined,
  color?: VisColumn,
  size?: VisColumn
): string {
  if (!x || !y) return 'scatter plot';

  let title = `${y.name} vs ${x.name}`;

  if (color) {
    title += ` by ${color.name}`;
  }

  if (size) {
    title += ` (sized by ${size.name})`;
  }

  return title;
}

/**
 * Generate title for heatmaps
 */
function generateHeatmapTitle(
  x: VisColumn | undefined,
  y: VisColumn | undefined,
  value?: VisColumn
): string {
  if (!x || !y) return 'heatmap';

  const valueName = value?.name || 'value';
  return `${valueName} by ${x.name}, ${y.name}`;
}

/**
 * Generate title for state timeline
 */
function generateStateTimelineTitle(
  x: VisColumn | undefined,
  y: VisColumn | undefined,
  color?: VisColumn
): string {
  if (!x || !y) return 'state timeline';

  const colorName = color?.name || 'status';
  const isTimeSeries = x?.schema === VisFieldType.Date;

  if (isTimeSeries) {
    return `${colorName} by time, ${y.name}`;
  }

  return `${colorName} by ${x.name}, ${y.name}`;
}

/**
 * Generate title for standard charts (line, bar, area)
 */
function generateStandardTitle(
  y: VisColumn | undefined,
  x: VisColumn | undefined,
  color?: VisColumn,
  facet?: VisColumn,
  isTimeSeries: boolean = false
): string {
  if (!y) return 'visualization';

  let title = y.name;

  // Add "by time" or "by category"
  if (x) {
    if (isTimeSeries) {
      title += ' by time';
    } else {
      title += ` by ${x.name}`;
    }
  }

  // Add color dimension
  if (color) {
    title += `, ${color.name}`;
  }

  // Add facet information
  if (facet) {
    title += ` (split by ${facet.name})`;
  }

  return title;
}
