/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisFieldType, ThresholdMode, Positions } from './types';

describe('types', () => {
  describe('VisFieldType', () => {
    it('should define the correct field types', () => {
      expect(VisFieldType.Numerical).toBe('numerical');
      expect(VisFieldType.Categorical).toBe('categorical');
      expect(VisFieldType.Date).toBe('date');
      expect(VisFieldType.Unknown).toBe('unknown');
    });
  });

  describe('ThresholdMode', () => {
    it('should define the correct threshold line styles', () => {
      expect(ThresholdMode.Solid).toBe('solid');
      expect(ThresholdMode.Dashed).toBe('dashed');
      expect(ThresholdMode.DotDashed).toBe('dot-dashed');
    });
  });

  describe('Positions', () => {
    it('should have the correct position values', () => {
      // Verify that Positions enum has the correct values
      expect(Positions.RIGHT).toBe('right');
      expect(Positions.LEFT).toBe('left');
      expect(Positions.TOP).toBe('top');
      expect(Positions.BOTTOM).toBe('bottom');
    });
  });
});
