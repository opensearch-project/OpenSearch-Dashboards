/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  StandardAxes,
  ColorSchemas,
  AxisRole,
  VisFieldType,
  CompleteAxisWithStyle,
} from '../types';

export const applyAxisStyling = (axesStyle?: CompleteAxisWithStyle, showGrid?: boolean): any => {
  const gridEnabled = showGrid ?? true;

  const fullAxisConfig: any = {
    // Grid settings
    grid: gridEnabled,
    gridColor: '#E0E0E0',
    gridOpacity: 0.5,
  };

  // Apply position

  fullAxisConfig.orient = axesStyle?.styles?.position;

  // Apply title settings
  fullAxisConfig.title = axesStyle?.styles?.title.text || axesStyle?.name;

  // Apply axis visibility
  if (!axesStyle?.styles?.show) {
    fullAxisConfig.title = null;
    fullAxisConfig.labels = false;
    fullAxisConfig.ticks = false;
    fullAxisConfig.domain = false;
    return fullAxisConfig;
  }

  // Apply label settings
  if (axesStyle?.styles?.labels) {
    if (!axesStyle?.styles?.labels.show) {
      fullAxisConfig.labels = false;
    } else {
      fullAxisConfig.labels = true;
      // Apply label rotation/alignment
      if (axesStyle?.styles?.labels.rotate !== undefined) {
        fullAxisConfig.labelAngle = axesStyle?.styles?.labels.rotate;
      }

      // Apply label truncation
      if (
        axesStyle?.styles?.labels.truncate !== undefined &&
        axesStyle?.styles?.labels.truncate > 0
      ) {
        fullAxisConfig.labelLimit = axesStyle?.styles?.labels.truncate;
      }

      // Apply label filtering (this controls overlapping labels)
      fullAxisConfig.labelOverlap = 'greedy';
    }
  }

  return fullAxisConfig;
};

export function getAxisByRole(
  axes: StandardAxes[],
  axisRole: AxisRole.X | AxisRole.Y
): StandardAxes | undefined {
  return axes.find((axis) => axis.axisRole === axisRole);
}

export function generateColorBySchema(count: number, schema: ColorSchemas): string[] {
  const colors: string[] = [];

  // Define RGB gradient start and end for each schema
  const colorRanges: Record<
    ColorSchemas,
    { start: [number, number, number]; end: [number, number, number] }
  > = {
    [ColorSchemas.BLUES]: { start: [173, 216, 230], end: [0, 0, 51] },
    [ColorSchemas.GREENS]: { start: [204, 255, 204], end: [0, 51, 0] },
    [ColorSchemas.GREYS]: { start: [240, 240, 240], end: [51, 51, 51] },
    [ColorSchemas.REDS]: { start: [255, 204, 204], end: [102, 0, 0] },
    [ColorSchemas.YELLOWORANGE]: { start: [255, 255, 204], end: [204, 102, 0] },
    [ColorSchemas.GREENBLUE]: { start: [204, 255, 204], end: [0, 0, 51] },
  };

  const range = colorRanges[schema];
  if (!range) return colors;

  const [startR, startG, startB] = range.start;
  const [endR, endG, endB] = range.end;

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const r = Math.round(startR + (endR - startR) * t);
    const g = Math.round(startG + (endG - startG) * t);
    const b = Math.round(startB + (endB - startB) * t);
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
      .toString(16)
      .padStart(2, '0')}`;
    colors.push(hex);
  }
  return colors;
}

export const getSchemaFromAxisMapping = (
  axis?: CompleteAxisWithStyle
): 'quantitative' | 'nominal' | 'temporal' | 'unknown' => {
  switch (axis?.schema) {
    case VisFieldType.Numerical:
      return 'quantitative';
    case VisFieldType.Categorical:
      return 'nominal';
    case VisFieldType.Date:
      return 'temporal';
    default:
      return 'unknown';
  }
};
