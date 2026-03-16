/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getWorkerUrl, getWorkerUrls } from './worker_config';

describe('worker_config', () => {
  describe('getWorkerUrl', () => {
    it('should return correct URL format for valid worker IDs', () => {
      expect(getWorkerUrl('ppl', 12345)).toBe('/12345/editor/workers/ppl.editor.worker.js');
      expect(getWorkerUrl('json', 12345)).toBe('/12345/editor/workers/json.editor.worker.js');
      expect(getWorkerUrl('xjson', 12345)).toBe('/12345/editor/workers/xjson.editor.worker.js');
    });

    it('should return undefined for unknown worker IDs', () => {
      expect(getWorkerUrl('invalid', 12345)).toBeUndefined();
      expect(getWorkerUrl('', 12345)).toBeUndefined();
    });
  });

  describe('getWorkerUrls', () => {
    it('should return URLs for all three workers with consistent build hash', () => {
      const result = getWorkerUrls(12345);

      expect(result).toEqual({
        ppl: '/12345/editor/workers/ppl.editor.worker.js',
        json: '/12345/editor/workers/json.editor.worker.js',
        xjson: '/12345/editor/workers/xjson.editor.worker.js',
      });
    });
  });
});
