/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { defaultPrepareQuery } from '../query_actions';

describe('Query Actions', () => {
  describe('defaultPrepareQuery', () => {
    it('should remove stats pipe from query string', () => {
      const queryWithStats = 'source=logs | where level="error" | stats count by host';
      const result = defaultPrepareQuery(queryWithStats);
      expect(result).toBe('source=logs | where level="error"');
    });

    it('should handle query without stats pipe', () => {
      const queryWithoutStats = 'source=logs | where level="error"';
      const result = defaultPrepareQuery(queryWithoutStats);
      expect(result).toBe('source=logs | where level="error"');
    });

    it('should handle empty query string', () => {
      const result = defaultPrepareQuery('');
      expect(result).toBe('');
    });

    it('should handle case insensitive stats removal', () => {
      const queryWithStats = 'source=logs | STATS count by host';
      const result = defaultPrepareQuery(queryWithStats);
      expect(result).toBe('source=logs');
    });

    it('should handle stats with extra whitespace', () => {
      const queryWithStats = 'source=logs   |   stats count by host';
      const result = defaultPrepareQuery(queryWithStats);
      expect(result).toBe('source=logs');
    });
  });
});
