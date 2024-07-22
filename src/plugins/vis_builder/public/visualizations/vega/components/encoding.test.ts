/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildVegaLiteEncoding } from './encoding';

describe('encoding.ts', () => {
  describe('buildVegaLiteEncoding', () => {
    it('should build correct encoding for x and y axes', () => {
      const dimensions = { x: [{}], y: [{}] };
      const formats = { xAxisLabel: 'X Label', yAxisLabel: 'Y Label' };
      const result = buildVegaLiteEncoding(dimensions, formats);

      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
      expect(result.x!.axis!.title).toBe('X Label');
      expect(result.y!.axis!.title).toBe('Y Label');
    });

    it('should include color encoding when y dimension is present', () => {
      const dimensions = { x: [{}], y: [{}] };
      const formats = {};
      const result = buildVegaLiteEncoding(dimensions, formats);

      expect(result.color).toBeDefined();
      expect(result.color!.field).toBe('series');
      expect(result.color!.type).toBe('nominal');
    });
  });
});
