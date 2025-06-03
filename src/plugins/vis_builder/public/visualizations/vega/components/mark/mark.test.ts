/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildMarkForVegaLite, buildMarkForVega } from './mark';

describe('mark.ts', () => {
  describe('buildMarkForVegaLite', () => {
    it('should build line mark', () => {
      const result = buildMarkForVegaLite('line');
      expect(result.type).toBe('line');
      expect(result.point).toBe(true);
    });

    it('should build area mark', () => {
      const result = buildMarkForVegaLite('area');
      expect(result.type).toBe('area');
      expect(result.line).toBe(true);
    });

    it('should build bar mark', () => {
      const result = buildMarkForVegaLite('bar');
      expect(result.type).toBe('bar');
    });
  });

  describe('buildMarkForVega', () => {
    it('should build group mark with correct structure', () => {
      const dimensions = { y: [{ label: 'Y Label' }] };
      const formats = { xAxisLabel: 'X Label' };
      const result = buildMarkForVega('line', dimensions, formats);

      expect(result.type).toBe('group');
      expect(result.marks).toBeDefined();
      expect(result.scales).toHaveLength(3);
      expect(result.axes).toHaveLength(2);
    });
  });
});
