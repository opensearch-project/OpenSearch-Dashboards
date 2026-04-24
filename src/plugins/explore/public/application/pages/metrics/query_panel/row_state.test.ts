/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { initRows, joinRows } from './row_state';

describe('row_state', () => {
  let counter = 0;
  const nextId = () => `row-${++counter}`;

  beforeEach(() => {
    counter = 0;
  });

  describe('initRows', () => {
    it('creates a single builder row for empty query', () => {
      const rows = initRows('', nextId);
      expect(rows).toHaveLength(1);
      expect(rows[0].mode).toBe('builder');
      expect(rows[0].query).toBe('');
    });

    it('creates a builder row for a simple metric', () => {
      const rows = initRows('up', nextId);
      expect(rows).toHaveLength(1);
      expect(rows[0].query).toBe('up');
      expect(rows[0].mode).toBe('builder');
      expect(rows[0].builderState).not.toBeNull();
    });

    it('assigns unique IDs', () => {
      const rows = initRows('', nextId);
      expect(rows[0].id).toBe('row-1');
    });
  });

  describe('joinRows', () => {
    it('returns empty string for single empty row', () => {
      expect(joinRows([{ id: '1', mode: 'builder', query: '', builderState: null }])).toBe('');
    });

    it('returns single query without semicolons', () => {
      expect(joinRows([{ id: '1', mode: 'code', query: 'up', builderState: null }])).toBe('up');
    });

    it('joins multiple queries with semicolons', () => {
      const rows = [
        { id: '1', mode: 'code' as const, query: 'up', builderState: null },
        { id: '2', mode: 'code' as const, query: 'down', builderState: null },
      ];
      expect(joinRows(rows)).toBe('up;\ndown;');
    });

    it('filters out empty queries', () => {
      const rows = [
        { id: '1', mode: 'code' as const, query: 'up', builderState: null },
        { id: '2', mode: 'code' as const, query: '', builderState: null },
      ];
      expect(joinRows(rows)).toBe('up');
    });
  });
});
