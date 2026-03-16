/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateArcExpression } from './gauge_chart_utils';

describe('gauge_chart_utils', () => {
  describe('generateArcExpression', () => {
    it('generates correct arc expression', () => {
      const result = generateArcExpression(0, 90, '#red');

      expect(result.mark.type).toBe('arc');
      expect(result.mark.fill).toBe('#red');
    });
  });
});
