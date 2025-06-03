/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { shallowEqual } from './shallow_equal';

describe('shallowEqual', () => {
  it('should return true for equal objects without ignored keys', () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 1, b: 2, c: 3 };
    const ignoreKeys = [];

    expect(shallowEqual(obj1, obj2, ignoreKeys)).toBe(true);
  });

  it('should return false for objects with different values', () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 1, b: 2, c: 4 };
    const ignoreKeys = [];

    expect(shallowEqual(obj1, obj2, ignoreKeys)).toBe(false);
  });

  it('should return false for objects with different keys', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2, c: 3 };
    const ignoreKeys = [];

    expect(shallowEqual(obj1, obj2, ignoreKeys)).toBe(false);
  });

  it('should return true for objects with different values but ignored', () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 1, b: 2, c: 4 };
    const ignoreKeys = ['c'];

    expect(shallowEqual(obj1, obj2, ignoreKeys)).toBe(true);
  });

  it('should return true for objects with different keys but ignored', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2, c: 4 };
    const ignoreKeys = ['c'];

    expect(shallowEqual(obj1, obj2, ignoreKeys)).toBe(true);
  });
});
