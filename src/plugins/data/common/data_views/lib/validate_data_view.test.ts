/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CONTAINS_SPACES_KEY, ILLEGAL_CHARACTERS_KEY, ILLEGAL_CHARACTERS_VISIBLE } from './types';

import { validateDataView } from './validate_data_view';

describe('Index Pattern Utils', () => {
  describe('Validation', () => {
    it('should not allow space in the pattern', () => {
      const errors = validateDataView('my pattern');
      expect(errors[CONTAINS_SPACES_KEY]).toBe(true);
    });

    it('should not allow illegal characters', () => {
      ILLEGAL_CHARACTERS_VISIBLE.forEach((char) => {
        const errors = validateDataView(`pattern${char}`);
        expect(errors[ILLEGAL_CHARACTERS_KEY]).toEqual([char]);
      });
    });

    it('should return empty object when there are no errors', () => {
      expect(validateDataView('my-pattern-*')).toEqual({});
    });
  });
});
