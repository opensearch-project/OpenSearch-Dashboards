/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { containsIllegalCharacters } from './contains_illegal_characters';

describe('containsIllegalCharacters', () => {
  it('returns true with illegal characters', () => {
    const isInvalid = containsIllegalCharacters('abc', ['a']);
    expect(isInvalid).toBe(true);
  });

  it('returns false with no illegal characters', () => {
    const isInvalid = containsIllegalCharacters('abc', ['%']);
    expect(isInvalid).toBe(false);
  });
});
