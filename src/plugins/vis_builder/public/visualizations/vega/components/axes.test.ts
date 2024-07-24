/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildAxes } from './axes';

describe('axes.ts', () => {
  describe('buildAxes', () => {
    it('should return correct axis configurations for date x-axis', () => {
      const dimensions = {
        x: { format: { id: 'date' } },
        y: [{ label: 'Y Axis' }],
      };
      const formats = {
        xAxisLabel: 'X Axis',
        yAxisLabel: 'Custom Y Axis',
      };

      const result = buildAxes(dimensions, formats);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        orient: 'bottom',
        scale: 'x',
        labelAngle: -90,
        labelAlign: 'right',
        labelBaseline: 'middle',
        title: 'X Axis',
        format: '%Y-%m-%d %H:%M',
      });
      expect(result[1]).toEqual({
        orient: 'left',
        scale: 'y',
        title: 'Custom Y Axis',
      });
    });

    it('should not add format when x is not date', () => {
      const dimensions = {
        x: { format: { id: 'number' } },
        y: [{ label: 'Y Axis' }],
      };
      const result = buildAxes(dimensions, 'X', 'Y');

      expect(result[0]).not.toHaveProperty('format');
    });

    it('should use default labels when not provided', () => {
      const dimensions = {
        x: {},
        y: [{ label: 'Default Y' }],
      };
      const result = buildAxes(dimensions, '', '');

      expect(result[0].title).toBe('_all');
      expect(result[1].title).toBe('Default Y');
    });
  });
});
