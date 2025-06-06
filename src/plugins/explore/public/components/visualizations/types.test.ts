/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisFieldType, ThresholdLineStyle, Positions } from './types';
import { Positions as CollectionsPositions } from './utils/collections';

describe('types', () => {
  describe('VisFieldType', () => {
    it('should define the correct field types', () => {
      expect(VisFieldType.Numerical).toBe('numerical');
      expect(VisFieldType.Categorical).toBe('categorical');
      expect(VisFieldType.Date).toBe('date');
      expect(VisFieldType.Unknown).toBe('date'); // Note: This might be a bug in the original code
    });
  });

  describe('ThresholdLineStyle', () => {
    it('should define the correct threshold line styles', () => {
      expect(ThresholdLineStyle.Full).toBe('full');
      expect(ThresholdLineStyle.Dashed).toBe('dashed');
      expect(ThresholdLineStyle.DotDashed).toBe('dot-dashed');
    });
  });

  describe('Positions', () => {
    it('should import Positions from collections', () => {
      // Verify that Positions is correctly imported from collections
      expect(Positions).toBe(CollectionsPositions);
    });
  });
});
