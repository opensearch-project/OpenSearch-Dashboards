/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StandardAxes, ColorSchemas, AxisRole, Positions } from '../types';

export const applyAxisStyling = (axesStyle?: StandardAxes): any => {
  const gridEnabled = axesStyle?.grid.showLines ?? true;

  const fullAxisConfig: any = {
    // Grid settings
    grid: gridEnabled,
    gridColor: '#E0E0E0',
    gridOpacity: 0.5,
  };

  // Apply position

  fullAxisConfig.orient = axesStyle?.position;

  // Apply title settings
  fullAxisConfig.title = axesStyle?.title.text || axesStyle?.field?.default.name;

  // Apply axis visibility
  if (!axesStyle?.show) {
    fullAxisConfig.labels = false;
    fullAxisConfig.ticks = false;
    fullAxisConfig.domain = false;
    return fullAxisConfig;
  }

  // Apply label settings
  if (axesStyle.labels) {
    if (!axesStyle.labels.show) {
      fullAxisConfig.labels = false;
    } else {
      fullAxisConfig.labels = true;
      // Apply label rotation/alignment
      if (axesStyle.labels.rotate !== undefined) {
        fullAxisConfig.labelAngle = axesStyle.labels.rotate;
      }

      // Apply label truncation
      if (axesStyle.labels.truncate !== undefined && axesStyle.labels.truncate > 0) {
        fullAxisConfig.labelLimit = axesStyle.labels.truncate;
      }

      // Apply label filtering (this controls overlapping labels)
      if (axesStyle.labels.filter !== undefined) {
        fullAxisConfig.labelOverlap = axesStyle.labels.filter ? 'greedy' : false;
      }
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

export function swapAxes(axes: StandardAxes[]) {
  return axes.map((axis) => {
    if (axis.axisRole === AxisRole.Y) {
      return {
        ...axis,
        axisRole: AxisRole.X,
        position:
          axis.position === Positions.LEFT
            ? Positions.BOTTOM
            : axis.position === Positions.RIGHT
            ? Positions.TOP
            : axis.position,
      };
    }

    if (axis.axisRole === AxisRole.X) {
      return {
        ...axis,
        axisRole: AxisRole.Y,
        position:
          axis.position === Positions.BOTTOM
            ? Positions.LEFT
            : axis.position === Positions.TOP
            ? Positions.RIGHT
            : axis.position,
      };
    }
    return axis;
  });
}
