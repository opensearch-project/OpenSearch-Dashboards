/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildTooltip } from './tooltip';
import { VegaLiteSpec } from '../utils/types';

describe('tooltip.ts', () => {
  describe('buildTooltip', () => {
    it('should build tooltip with combined series and y value when yAxisLabel is not provided', () => {
      const baseSpec: VegaLiteSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        data: { values: [] },
        mark: { type: 'point' },
        encoding: {},
      };
      const dimensions = {};
      const formats = { xAxisLabel: 'X Label' };

      buildTooltip(baseSpec, dimensions, formats);

      expect(baseSpec.transform).toBeDefined();
      expect(baseSpec.encoding.tooltip).toBeDefined();
      expect(Array.isArray(baseSpec.encoding.tooltip)).toBe(true);
      expect((baseSpec.encoding.tooltip as any[]).length).toBe(2);
      expect((baseSpec.encoding.tooltip as any[])[0].field).toBe('x');
      expect((baseSpec.encoding.tooltip as any[])[1].field).toBe('metrics');
    });

    it('should build tooltip with separate x and y fields when yAxisLabel is provided', () => {
      const baseSpec: VegaLiteSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        data: { values: [] },
        mark: { type: 'point' },
        encoding: {},
      };
      const dimensions = {};
      const formats = { xAxisLabel: 'X Label', yAxisLabel: 'Y Label' };

      buildTooltip(baseSpec, dimensions, formats);

      expect(baseSpec.transform).toBeUndefined();
      expect(baseSpec.encoding.tooltip).toBeDefined();
      expect(Array.isArray(baseSpec.encoding.tooltip)).toBe(true);
      expect((baseSpec.encoding.tooltip as any[]).length).toBe(2);
      expect((baseSpec.encoding.tooltip as any[])[0].field).toBe('x');
      expect((baseSpec.encoding.tooltip as any[])[1].field).toBe('y');
    });

    it('should add z dimension to tooltip when present', () => {
      const baseSpec: VegaLiteSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        data: { values: [] },
        mark: { type: 'point' },
        encoding: {},
      };
      const dimensions = { z: [{ label: 'Z Label' }] };
      const formats = { xAxisLabel: 'X Label', yAxisLabel: 'Y Label' };

      buildTooltip(baseSpec, dimensions, formats);

      expect(baseSpec.encoding.tooltip).toBeDefined();
      expect(Array.isArray(baseSpec.encoding.tooltip)).toBe(true);
      expect((baseSpec.encoding.tooltip as any[]).length).toBe(3);
      expect((baseSpec.encoding.tooltip as any[])[2].field).toBe('z');
    });
  });
});
