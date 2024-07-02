/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isMin } from './is_min';

describe('is_min', () => {
  describe('osd-extra installed', () => {
    it('should return false', () => {
      expect(isMin()).toEqual(false);
    });
  });
});
