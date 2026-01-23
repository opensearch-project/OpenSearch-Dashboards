/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfirmationService, ConfirmationRequest } from './confirmation_service';

describe('ConfirmationService', () => {
  let service: ConfirmationService;

  beforeEach(() => {
    service = new ConfirmationService();
  });

  describe('getPendingConfirmations$', () => {
    it('should return an observable', () => {
      const observable = service.getPendingConfirmations$();
      expect(observable).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');
    });

    it('should emit empty array initially', (done) => {
      service.getPendingConfirmations$().subscribe((confirmations) => {
        expect(confirmations).toEqual([]);
        done();
      });
    });

    it('should emit updates when confirmations are added', (done) => {
      const emissions: ConfirmationRequest[][] = [];

      service.getPendingConfirmations$().subscribe((confirmations) => {
        emissions.push(confirmations);

        if (emissions.length === 2) {
          expect(emissions[0]).toEqual([]);
          expect(emissions[1].length).toBe(1);
          expect(emissions[1][0].toolName).toBe('testTool');
          done();
        }
      });

      service.requestConfirmation('testTool', 'call-123', { param: 'value' });
    });
  });

  describe('requestConfirmation', () => {
    it('should add confirmation to pending list', async () => {
      const promise = service.requestConfirmation(
        'testTool',
        'call-123',
        { param: 'value' },
        'Test description'
      );

      const pending = service.getPendingConfirmations();
      expect(pending.length).toBe(1);
      expect(pending[0].toolName).toBe('testTool');
      expect(pending[0].toolCallId).toBe('call-123');
      expect(pending[0].args).toEqual({ param: 'value' });
      expect(pending[0].description).toBe('Test description');
      expect(pending[0].timestamp).toBeDefined();

      // Clean up
      service.reject(pending[0].id);
      await promise;
    });

    it('should generate unique IDs for each confirmation', async () => {
      const promise1 = service.requestConfirmation('tool1', 'call-1', {});
      const promise2 = service.requestConfirmation('tool2', 'call-2', {});

      const pending = service.getPendingConfirmations();
      expect(pending.length).toBe(2);
      expect(pending[0].id).not.toBe(pending[1].id);

      // Clean up
      service.reject(pending[0].id);
      service.reject(pending[1].id);
      await Promise.all([promise1, promise2]);
    });

    it('should return a promise that resolves on approval', async () => {
      const promise = service.requestConfirmation('testTool', 'call-123', { param: 'value' });

      const pending = service.getPendingConfirmations();
      service.approve(pending[0].id);

      const response = await promise;
      expect(response.id).toBe(pending[0].id);
      expect(response.approved).toBe(true);
    });

    it('should return a promise that resolves on rejection', async () => {
      const promise = service.requestConfirmation('testTool', 'call-123', { param: 'value' });

      const pending = service.getPendingConfirmations();
      service.reject(pending[0].id);

      const response = await promise;
      expect(response.id).toBe(pending[0].id);
      expect(response.approved).toBe(false);
    });

    it('should handle multiple pending confirmations', async () => {
      const promise1 = service.requestConfirmation('tool1', 'call-1', { a: 1 });
      const promise2 = service.requestConfirmation('tool2', 'call-2', { b: 2 });
      const promise3 = service.requestConfirmation('tool3', 'call-3', { c: 3 });

      expect(service.getPendingConfirmations().length).toBe(3);

      const pending = service.getPendingConfirmations();
      service.approve(pending[1].id);
      service.reject(pending[0].id);
      service.approve(pending[2].id);

      const [response1, response2, response3] = await Promise.all([promise1, promise2, promise3]);

      expect(response1.approved).toBe(false);
      expect(response2.approved).toBe(true);
      expect(response3.approved).toBe(true);
    });
  });

  describe('approve', () => {
    it('should resolve the confirmation promise with approved response', async () => {
      const promise = service.requestConfirmation('testTool', 'call-123', { param: 'value' });
      const pending = service.getPendingConfirmations();

      service.approve(pending[0].id);

      const response = await promise;
      expect(response.approved).toBe(true);
      expect(response.id).toBe(pending[0].id);
    });

    it('should include modified args if provided', async () => {
      const promise = service.requestConfirmation('testTool', 'call-123', { param: 'value' });
      const pending = service.getPendingConfirmations();

      const modifiedArgs = { param: 'modified' };
      service.approve(pending[0].id, modifiedArgs);

      const response = await promise;
      expect(response.approved).toBe(true);
      expect(response.modifiedArgs).toEqual(modifiedArgs);
    });

    it('should remove confirmation from pending list', async () => {
      const promise = service.requestConfirmation('testTool', 'call-123', { param: 'value' });
      const pending = service.getPendingConfirmations();

      expect(service.getPendingConfirmations().length).toBe(1);
      service.approve(pending[0].id);
      await promise;

      expect(service.getPendingConfirmations().length).toBe(0);
    });

    it('should do nothing if ID does not exist', () => {
      service.approve('non-existent-id');
      // Should not throw
      expect(service.getPendingConfirmations().length).toBe(0);
    });

    it('should emit updated pending list to subscribers', (done) => {
      const emissions: ConfirmationRequest[][] = [];

      service.getPendingConfirmations$().subscribe((confirmations) => {
        emissions.push([...confirmations]);

        if (emissions.length === 3) {
          expect(emissions[0]).toEqual([]);
          expect(emissions[1].length).toBe(1);
          expect(emissions[2]).toEqual([]);
          done();
        }
      });

      const promise = service.requestConfirmation('testTool', 'call-123', {});
      const pending = service.getPendingConfirmations();
      service.approve(pending[0].id);
      promise.catch(() => {});
    });
  });

  describe('reject', () => {
    it('should resolve the confirmation promise with rejected response', async () => {
      const promise = service.requestConfirmation('testTool', 'call-123', { param: 'value' });
      const pending = service.getPendingConfirmations();

      service.reject(pending[0].id);

      const response = await promise;
      expect(response.approved).toBe(false);
      expect(response.id).toBe(pending[0].id);
    });

    it('should remove confirmation from pending list', async () => {
      const promise = service.requestConfirmation('testTool', 'call-123', { param: 'value' });
      const pending = service.getPendingConfirmations();

      expect(service.getPendingConfirmations().length).toBe(1);
      service.reject(pending[0].id);
      await promise;

      expect(service.getPendingConfirmations().length).toBe(0);
    });

    it('should do nothing if ID does not exist', () => {
      service.reject('non-existent-id');
      // Should not throw
      expect(service.getPendingConfirmations().length).toBe(0);
    });
  });

  describe('getPendingConfirmations', () => {
    it('should return empty array initially', () => {
      expect(service.getPendingConfirmations()).toEqual([]);
    });

    it('should return current pending confirmations', async () => {
      const promise1 = service.requestConfirmation('tool1', 'call-1', { a: 1 });
      const promise2 = service.requestConfirmation('tool2', 'call-2', { b: 2 });

      const pending = service.getPendingConfirmations();
      expect(pending.length).toBe(2);
      expect(pending[0].toolName).toBe('tool1');
      expect(pending[1].toolName).toBe('tool2');

      // Clean up
      service.reject(pending[0].id);
      service.reject(pending[1].id);
      await Promise.all([promise1, promise2]);
    });

    it('should return a snapshot, not a live reference', async () => {
      const promise = service.requestConfirmation('testTool', 'call-123', {});

      const snapshot1 = service.getPendingConfirmations();
      expect(snapshot1.length).toBe(1);

      const pending = service.getPendingConfirmations();
      service.approve(pending[0].id);
      await promise;

      // Original snapshot should not be affected
      expect(snapshot1.length).toBe(1);
      expect(service.getPendingConfirmations().length).toBe(0);
    });
  });

  describe('hasPendingConfirmations', () => {
    it('should return false initially', () => {
      expect(service.hasPendingConfirmations()).toBe(false);
    });

    it('should return true when confirmations are pending', async () => {
      const promise = service.requestConfirmation('testTool', 'call-123', {});

      expect(service.hasPendingConfirmations()).toBe(true);

      const pending = service.getPendingConfirmations();
      service.approve(pending[0].id);
      await promise;
    });

    it('should return false after all confirmations are handled', async () => {
      const promise = service.requestConfirmation('testTool', 'call-123', {});
      const pending = service.getPendingConfirmations();

      expect(service.hasPendingConfirmations()).toBe(true);

      service.approve(pending[0].id);
      await promise;

      expect(service.hasPendingConfirmations()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid sequential confirmations', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(service.requestConfirmation(`tool${i}`, `call-${i}`, { index: i }));
      }

      expect(service.getPendingConfirmations().length).toBe(10);

      const pending = service.getPendingConfirmations();
      pending.forEach((req, index) => {
        if (index % 2 === 0) {
          service.approve(req.id);
        } else {
          service.reject(req.id);
        }
      });

      const responses = await Promise.all(promises);
      expect(responses.length).toBe(10);
      expect(service.getPendingConfirmations().length).toBe(0);
    });

    it('should handle confirmation with undefined description', async () => {
      const promise = service.requestConfirmation('testTool', 'call-123', { param: 'value' });

      const pending = service.getPendingConfirmations();
      expect(pending[0].description).toBeUndefined();

      service.approve(pending[0].id);
      await promise;
    });

    it('should handle confirmation with complex args', async () => {
      const complexArgs = {
        nested: { deep: { value: 123 } },
        array: [1, 2, 3],
        nullValue: null,
        undefinedValue: undefined,
      };

      const promise = service.requestConfirmation('testTool', 'call-123', complexArgs);

      const pending = service.getPendingConfirmations();
      expect(pending[0].args).toEqual(complexArgs);

      service.approve(pending[0].id);
      await promise;
    });

    it('should handle multiple subscribers to pending confirmations', (done) => {
      const emissions1: number[] = [];
      const emissions2: number[] = [];

      service.getPendingConfirmations$().subscribe((confirmations) => {
        emissions1.push(confirmations.length);
      });

      service.getPendingConfirmations$().subscribe((confirmations) => {
        emissions2.push(confirmations.length);

        if (emissions2.length === 3) {
          expect(emissions1).toEqual([0, 1, 0]);
          expect(emissions2).toEqual([0, 1, 0]);
          done();
        }
      });

      const promise = service.requestConfirmation('testTool', 'call-123', {});
      const pending = service.getPendingConfirmations();
      service.approve(pending[0].id);
      promise.catch(() => {});
    });
  });
});
