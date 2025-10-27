/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function generateArcExpression(startValue: number, endValue: number, fillColor: string) {
  return {
    mark: {
      type: 'arc',
      y: { expr: 'centerY' },
      x: { expr: 'centerX' },
      radius: { expr: 'innerRadius * 0.98' },
      radius2: { expr: 'innerRadius * 0.96' },
      theta: {
        expr: `theta_single_arc + (theta2_single_arc - theta_single_arc) * (( ${startValue} - minValue) / (maxValue - minValue))`,
      },
      theta2: {
        expr: `theta_single_arc + (theta2_single_arc - theta_single_arc) * (( ${endValue} - minValue) / (maxValue - minValue))`,
      },
      fill: fillColor,
    },
  };
}
