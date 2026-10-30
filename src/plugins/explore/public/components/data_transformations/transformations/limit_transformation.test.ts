/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createLimitTransformation } from './limit_transformation';

const createRow = (source: Record<string, unknown>) => source;

describe('limit_transformation', () => {
  const instance = createLimitTransformation();
  describe('transformationMethod', () => {
    const data = [
      createRow({ name: 'a' }),
      createRow({ name: 'b' }),
      createRow({ name: 'c' }),
      createRow({ name: 'd' }),
      createRow({ name: 'e' }),
    ];

    it.each([
      { limit: 3, expectedNames: ['a', 'b', 'c'] },
      { limit: 100, expectedNames: ['a', 'b', 'c', 'd', 'e'] },
      { limit: 0, expectedNames: [] },
      { limit: undefined, expectedNames: ['a', 'b', 'c', 'd', 'e'] },
    ])('keeps the expected rows when limit is $limit', ({ limit, expectedNames }) => {
      const result = instance.transformationMethod(data, { limit });

      expect(result).toEqual({
        rows: data.filter((row) => expectedNames.includes(row.name as string)),
        status: 'applied',
        issues: [],
      });
    });
  });

  describe('createLimitTransformation', () => {
    it('creates instance with default config', () => {
      expect(instance.definition_id).toBe('limit');
      expect(instance.config).toEqual({ limit: 10 });
      expect(instance.hide).toBe(false);
    });
  });
});
