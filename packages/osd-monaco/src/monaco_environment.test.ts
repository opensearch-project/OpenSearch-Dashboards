/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkerLabels } from './worker_config';
import { setBuildHash, getWorker } from './monaco_environment';

// Mock Worker constructor
class MockWorker {
  constructor(public url: string) {}
  postMessage = jest.fn();
  terminate = jest.fn();
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
}

global.Worker = MockWorker as any;

describe('monaco_environment', () => {
  describe('setBuildHash and getWorker', () => {
    it('should throw error if getWorker called before setBuildHash', () => {
      expect(() => getWorker(WorkerLabels.PPL)).toThrow('Build hash must be set');
    });

    it('should create Worker after setBuildHash is called', () => {
      setBuildHash(12345);
      const worker = getWorker(WorkerLabels.PPL);

      expect(worker).toBeInstanceOf(MockWorker);
      expect((worker as any).url).toBe('/12345/editor/workers/ppl.editor.worker.js');
    });

    it('should use updated build hash on subsequent calls', () => {
      setBuildHash(111);
      setBuildHash(222);
      const worker = getWorker(WorkerLabels.PPL);

      expect((worker as any).url).toBe('/222/editor/workers/ppl.editor.worker.js');
    });

    it('should create new Worker instances on each call', () => {
      setBuildHash(12345);
      const worker1 = getWorker(WorkerLabels.PPL);
      const worker2 = getWorker(WorkerLabels.PPL);

      expect(worker1).not.toBe(worker2);
    });

    it('should work with all worker labels', () => {
      setBuildHash(12345);

      const pplWorker = getWorker(WorkerLabels.PPL);
      const jsonWorker = getWorker(WorkerLabels.JSON);
      const xjsonWorker = getWorker(WorkerLabels.XJSON);

      expect((pplWorker as any).url).toContain('ppl.editor.worker.js');
      expect((jsonWorker as any).url).toContain('json.editor.worker.js');
      expect((xjsonWorker as any).url).toContain('xjson.editor.worker.js');
    });

    it('should throw error for invalid worker label', () => {
      setBuildHash(12345);
      expect(() => getWorker('invalid' as WorkerLabels)).toThrow('No worker available');
    });
  });
});
