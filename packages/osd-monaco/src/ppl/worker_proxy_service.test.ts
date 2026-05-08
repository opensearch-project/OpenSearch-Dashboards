/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLWorkerProxyService } from './worker_proxy_service';
import * as monacoEnvironment from '../monaco_environment';
import { WorkerLabels } from '../worker_config';

jest.mock('../monaco_environment');

describe('PPLWorkerProxyService', () => {
  let mockWorker: any;
  let service: PPLWorkerProxyService;

  beforeEach(() => {
    mockWorker = {
      postMessage: jest.fn(),
      terminate: jest.fn(),
      onmessage: null,
      onerror: null,
    };

    (monacoEnvironment.getWorker as jest.Mock).mockReturnValue(mockWorker);
    service = new PPLWorkerProxyService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setup', () => {
    it('should initialize worker for subsequent operations', async () => {
      service.setup();

      expect(monacoEnvironment.getWorker).toHaveBeenCalledWith(WorkerLabels.PPL);

      // Should be able to call tokenize/validate after setup
      const tokenizePromise = service.tokenize('test');
      expect(mockWorker.postMessage).toHaveBeenCalled();

      // Simulate worker response
      const messageData = mockWorker.postMessage.mock.calls[0][0];
      mockWorker.onmessage({ data: { id: messageData.id, result: [] } });

      await expect(tokenizePromise).resolves.toEqual([]);
    });

    it('should be idempotent - multiple calls do not create multiple workers', () => {
      service.setup();
      service.setup();
      service.setup();

      expect(monacoEnvironment.getWorker).toHaveBeenCalledTimes(1);
    });

    it('should propagate error if setBuildHash not called', () => {
      (monacoEnvironment.getWorker as jest.Mock).mockImplementation(() => {
        throw new Error('Build hash must be set');
      });

      expect(() => service.setup()).toThrow('Build hash must be set');
    });
  });

  describe('tokenize', () => {
    it('should throw error if setup not called', async () => {
      await expect(service.tokenize('test')).rejects.toThrow('has not been setup');
    });

    it('should return token array after setup', async () => {
      service.setup();

      const tokenizePromise = service.tokenize('search source=logs');

      // Simulate worker response
      const messageData = mockWorker.postMessage.mock.calls[0][0];
      const mockTokens = [{ type: 'search', value: 'search' }];
      mockWorker.onmessage({ data: { id: messageData.id, result: mockTokens } });

      const result = await tokenizePromise;
      expect(result).toEqual(mockTokens);
    });
  });

  describe('validate', () => {
    it('should throw error if setup not called', async () => {
      await expect(service.validate('test')).rejects.toThrow('has not been setup');
    });

    it('should return validation result after setup', async () => {
      service.setup();

      const validatePromise = service.validate('search source=logs');

      // Simulate worker response
      const messageData = mockWorker.postMessage.mock.calls[0][0];
      const mockValidation = { isValid: true, errors: [] };
      mockWorker.onmessage({ data: { id: messageData.id, result: mockValidation } });

      const result = await validatePromise;
      expect(result).toEqual(mockValidation);
    });

    it('should handle error from worker', async () => {
      service.setup();

      const validatePromise = service.validate('invalid');

      // Simulate worker error response
      const messageData = mockWorker.postMessage.mock.calls[0][0];
      mockWorker.onmessage({ data: { id: messageData.id, error: 'Validation failed' } });

      await expect(validatePromise).rejects.toThrow('Validation failed');
    });

    it('should timeout if worker never responds', async () => {
      jest.useFakeTimers();
      service.setup();

      const validatePromise = service.validate('test');

      // Fast-forward time past the 5 second timeout
      jest.advanceTimersByTime(5001);

      await expect(validatePromise).rejects.toThrow('Worker timeout');

      jest.useRealTimers();
    });
  });

  describe('stop', () => {
    it('should clean up worker resources', async () => {
      service.setup();
      service.stop();

      expect(mockWorker.terminate).toHaveBeenCalled();

      // Subsequent operations should fail
      await expect(service.tokenize('test')).rejects.toThrow('has not been setup');
    });

    it('should be safe to call without setup', () => {
      expect(() => service.stop()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      service.setup();
      service.stop();
      service.stop();

      expect(mockWorker.terminate).toHaveBeenCalledTimes(1);
    });
  });
});
