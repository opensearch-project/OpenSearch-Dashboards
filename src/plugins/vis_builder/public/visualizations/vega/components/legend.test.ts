/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildLegend } from './legend';

describe('legend.ts', () => {
  describe('buildLegend', () => {
    it('should build Vega legend configuration', () => {
      const result = buildLegend('right', true);
      expect(result.fill).toBe('color');
      expect(result.orient).toBe('right');
    });

    it('should build Vega-Lite legend configuration', () => {
      const result = buildLegend('top', false);
      expect(result.fill).toBeUndefined();
      expect(result.orient).toBe('top');
    });
  });
});
