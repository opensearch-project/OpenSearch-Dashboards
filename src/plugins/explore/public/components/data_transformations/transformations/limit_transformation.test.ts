/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createLimitTransformation } from './limit_transformation';

const createHit = (source: Record<string, unknown>) => ({
  _index: 'test',
  _id: '1',
  _score: 1,
  _source: source,
});

describe('limit_transformation', () => {
  const instance = createLimitTransformation();

  describe('transformationMethod', () => {
    const data = [
      createHit({ name: 'a' }),
      createHit({ name: 'b' }),
      createHit({ name: 'c' }),
      createHit({ name: 'd' }),
      createHit({ name: 'e' }),
    ];

    it('limits data to specified number of rows', () => {
      const result = instance.transformationMethod(data, { limit: 3 });
      expect(result).toHaveLength(3);
      expect(result[0]._source).toEqual({ name: 'a' });
      expect(result[2]._source).toEqual({ name: 'c' });
    });

    it('returns all data when limit is greater than data length', () => {
      const result = instance.transformationMethod(data, { limit: 100 });
      expect(result).toHaveLength(5);
    });

    it('returns empty array when limit is 0', () => {
      const result = instance.transformationMethod(data, { limit: 0 });
      expect(result).toHaveLength(0);
    });

    it('returns original data when limit is undefined', () => {
      const result = instance.transformationMethod(data, { limit: undefined });
      expect(result).toHaveLength(5);
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
