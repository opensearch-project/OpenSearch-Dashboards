/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Positions } from './collections';

describe('Collections', () => {
  describe('Positions enum', () => {
    it('should have the correct values', () => {
      expect(Positions.TOP).toBe('top');
      expect(Positions.RIGHT).toBe('right');
      expect(Positions.BOTTOM).toBe('bottom');
      expect(Positions.LEFT).toBe('left');
    });
  });
});
