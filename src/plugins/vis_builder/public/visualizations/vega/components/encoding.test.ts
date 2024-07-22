/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildVegaLiteEncoding, buildVegaScales } from './encoding';

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

  describe('buildVegaScales', () => {
    it('should build correct scales for x and y axes', () => {
      const dimensions = { x: [{}], y: [{}] };
      const formats = {};
      const result = buildVegaScales(dimensions, formats);

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('xscale');
      expect(result[1].name).toBe('yscale');
    });

    it('should include size scale when z dimension is present', () => {
      const dimensions = { x: [{}], y: [{}], z: [{}] };
      const formats = {};
      const result = buildVegaScales(dimensions, formats);

      expect(result.length).toBe(3);
      expect(result[2].name).toBe('size');
    });
  });
});
