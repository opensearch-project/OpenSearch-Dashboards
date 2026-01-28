/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TelemetryCoreService } from './telemetry_service';
import { TelemetryProvider } from './types';

describe('TelemetryCoreService', () => {
  let service: TelemetryCoreService;
  let mockProvider: jest.Mocked<TelemetryProvider>;

  beforeEach(() => {
    service = new TelemetryCoreService();
    mockProvider = {
      isEnabled: jest.fn().mockReturnValue(true),
      recordEvent: jest.fn(),
      recordMetric: jest.fn(),
      recordError: jest.fn(),
    };
  });

  describe('setup', () => {
    it('should return a setup contract with registerProvider', () => {
      const setupContract = service.setup();

      expect(setupContract).toHaveProperty('registerProvider');
      expect(typeof setupContract.registerProvider).toBe('function');
    });

    it('should allow registering a provider', () => {
      const setupContract = service.setup();

      expect(() => {
        setupContract.registerProvider(mockProvider);
      }).not.toThrow();
    });

    it('should warn when registering a second provider', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const setupContract = service.setup();

      setupContract.registerProvider(mockProvider);
      setupContract.registerProvider(mockProvider);

      expect(consoleSpy).toHaveBeenCalledWith(
        'TelemetryProvider already registered. Only the first registration is used.'
      );
      consoleSpy.mockRestore();
    });

    it('should ignore second provider registration', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const setupContract = service.setup();
      const startContract = service.start();

      const firstProvider: jest.Mocked<TelemetryProvider> = {
        isEnabled: jest.fn().mockReturnValue(true),
        recordEvent: jest.fn(),
        recordMetric: jest.fn(),
        recordError: jest.fn(),
      };
      const secondProvider: jest.Mocked<TelemetryProvider> = {
        isEnabled: jest.fn().mockReturnValue(false),
        recordEvent: jest.fn(),
        recordMetric: jest.fn(),
        recordError: jest.fn(),
      };

      setupContract.registerProvider(firstProvider);
      setupContract.registerProvider(secondProvider);

      // Should use first provider (returns true)
      expect(startContract.isEnabled()).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  describe('start', () => {
    it('should return a start contract with isEnabled and getPluginRecorder', () => {
      const startContract = service.start();

      expect(startContract).toHaveProperty('isEnabled');
      expect(startContract).toHaveProperty('getPluginRecorder');
      expect(typeof startContract.isEnabled).toBe('function');
      expect(typeof startContract.getPluginRecorder).toBe('function');
    });

    describe('isEnabled', () => {
      it('should return false without provider', () => {
        const startContract = service.start();

        expect(startContract.isEnabled()).toBe(false);
      });

      it('should return true when provider.isEnabled returns true', () => {
        const setupContract = service.setup();
        const startContract = service.start();

        mockProvider.isEnabled.mockReturnValue(true);
        setupContract.registerProvider(mockProvider);

        expect(startContract.isEnabled()).toBe(true);
      });

      it('should return false when provider.isEnabled returns false', () => {
        const setupContract = service.setup();
        const startContract = service.start();

        mockProvider.isEnabled.mockReturnValue(false);
        setupContract.registerProvider(mockProvider);

        expect(startContract.isEnabled()).toBe(false);
      });
    });

    describe('getPluginRecorder', () => {
      it('should return a recorder with recordEvent, recordMetric, recordError', () => {
        const startContract = service.start();
        const recorder = startContract.getPluginRecorder('testPlugin');

        expect(recorder).toHaveProperty('recordEvent');
        expect(recorder).toHaveProperty('recordMetric');
        expect(recorder).toHaveProperty('recordError');
        expect(typeof recorder.recordEvent).toBe('function');
        expect(typeof recorder.recordMetric).toBe('function');
        expect(typeof recorder.recordError).toBe('function');
      });

      it('should add source to events when recording', () => {
        const setupContract = service.setup();
        const startContract = service.start();
        setupContract.registerProvider(mockProvider);

        const recorder = startContract.getPluginRecorder('myPlugin');
        recorder.recordEvent({ name: 'test_event', data: { foo: 'bar' } });

        expect(mockProvider.recordEvent).toHaveBeenCalledWith({
          name: 'test_event',
          data: { foo: 'bar' },
          source: 'myPlugin',
        });
      });

      it('should add source to metrics when recording', () => {
        const setupContract = service.setup();
        const startContract = service.start();
        setupContract.registerProvider(mockProvider);

        const recorder = startContract.getPluginRecorder('myPlugin');
        recorder.recordMetric({ name: 'latency', value: 100, unit: 'ms' });

        expect(mockProvider.recordMetric).toHaveBeenCalledWith({
          name: 'latency',
          value: 100,
          unit: 'ms',
          source: 'myPlugin',
        });
      });

      it('should add source to errors when recording', () => {
        const setupContract = service.setup();
        const startContract = service.start();
        setupContract.registerProvider(mockProvider);

        const recorder = startContract.getPluginRecorder('myPlugin');
        recorder.recordError({ type: 'TestError', message: 'Something went wrong' });

        expect(mockProvider.recordError).toHaveBeenCalledWith({
          type: 'TestError',
          message: 'Something went wrong',
          source: 'myPlugin',
        });
      });

      it('should be a no-op without provider (recordEvent)', () => {
        const startContract = service.start();
        const recorder = startContract.getPluginRecorder('myPlugin');

        expect(() => {
          recorder.recordEvent({ name: 'test', data: {} });
        }).not.toThrow();
      });

      it('should be a no-op without provider (recordMetric)', () => {
        const startContract = service.start();
        const recorder = startContract.getPluginRecorder('myPlugin');

        expect(() => {
          recorder.recordMetric({ name: 'test', value: 1 });
        }).not.toThrow();
      });

      it('should be a no-op without provider (recordError)', () => {
        const startContract = service.start();
        const recorder = startContract.getPluginRecorder('myPlugin');

        expect(() => {
          recorder.recordError({ type: 'Error', message: 'test' });
        }).not.toThrow();
      });

      it('should return different recorders for different plugin IDs', () => {
        const setupContract = service.setup();
        const startContract = service.start();
        setupContract.registerProvider(mockProvider);

        const recorderA = startContract.getPluginRecorder('pluginA');
        const recorderB = startContract.getPluginRecorder('pluginB');

        recorderA.recordEvent({ name: 'event1', data: {} });
        recorderB.recordEvent({ name: 'event2', data: {} });

        expect(mockProvider.recordEvent).toHaveBeenCalledWith({
          name: 'event1',
          data: {},
          source: 'pluginA',
        });
        expect(mockProvider.recordEvent).toHaveBeenCalledWith({
          name: 'event2',
          data: {},
          source: 'pluginB',
        });
      });

      it('should return the same cached recorder for the same plugin ID', () => {
        const startContract = service.start();

        const recorder1 = startContract.getPluginRecorder('myPlugin');
        const recorder2 = startContract.getPluginRecorder('myPlugin');

        expect(recorder1).toBe(recorder2);
      });

      it('should return different cached recorders for different plugin IDs', () => {
        const startContract = service.start();

        const recorderA = startContract.getPluginRecorder('pluginA');
        const recorderB = startContract.getPluginRecorder('pluginB');

        expect(recorderA).not.toBe(recorderB);
      });

      describe('error handling', () => {
        it('should catch and log errors from provider.recordEvent', () => {
          const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
          const setupContract = service.setup();
          const startContract = service.start();

          const throwingProvider: TelemetryProvider = {
            isEnabled: jest.fn().mockReturnValue(true),
            recordEvent: jest.fn().mockImplementation(() => {
              throw new Error('Provider error');
            }),
            recordMetric: jest.fn(),
            recordError: jest.fn(),
          };
          setupContract.registerProvider(throwingProvider);

          const recorder = startContract.getPluginRecorder('myPlugin');

          expect(() => {
            recorder.recordEvent({ name: 'test', data: {} });
          }).not.toThrow();

          expect(consoleSpy).toHaveBeenCalledWith(
            '[Telemetry] Error recording event:',
            expect.any(Error)
          );
          consoleSpy.mockRestore();
        });

        it('should catch and log errors from provider.recordMetric', () => {
          const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
          const setupContract = service.setup();
          const startContract = service.start();

          const throwingProvider: TelemetryProvider = {
            isEnabled: jest.fn().mockReturnValue(true),
            recordEvent: jest.fn(),
            recordMetric: jest.fn().mockImplementation(() => {
              throw new Error('Provider error');
            }),
            recordError: jest.fn(),
          };
          setupContract.registerProvider(throwingProvider);

          const recorder = startContract.getPluginRecorder('myPlugin');

          expect(() => {
            recorder.recordMetric({ name: 'test', value: 1 });
          }).not.toThrow();

          expect(consoleSpy).toHaveBeenCalledWith(
            '[Telemetry] Error recording metric:',
            expect.any(Error)
          );
          consoleSpy.mockRestore();
        });

        it('should catch and log errors from provider.recordError', () => {
          const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
          const setupContract = service.setup();
          const startContract = service.start();

          const throwingProvider: TelemetryProvider = {
            isEnabled: jest.fn().mockReturnValue(true),
            recordEvent: jest.fn(),
            recordMetric: jest.fn(),
            recordError: jest.fn().mockImplementation(() => {
              throw new Error('Provider error');
            }),
          };
          setupContract.registerProvider(throwingProvider);

          const recorder = startContract.getPluginRecorder('myPlugin');

          expect(() => {
            recorder.recordError({ type: 'Error', message: 'test' });
          }).not.toThrow();

          expect(consoleSpy).toHaveBeenCalledWith(
            '[Telemetry] Error recording error:',
            expect.any(Error)
          );
          consoleSpy.mockRestore();
        });
      });
    });
  });

  describe('stop', () => {
    it('should clear the provider', async () => {
      const setupContract = service.setup();
      const startContract = service.start();

      setupContract.registerProvider(mockProvider);
      expect(startContract.isEnabled()).toBe(true);

      await service.stop();
      expect(startContract.isEnabled()).toBe(false);
    });

    it('should not throw if called without provider', async () => {
      await expect(service.stop()).resolves.toBeUndefined();
    });

    it('should clear the recorder cache', async () => {
      const startContract = service.start();

      const recorderBefore = startContract.getPluginRecorder('myPlugin');
      await service.stop();

      // After stop, start a new lifecycle
      const startContract2 = service.start();
      const recorderAfter = startContract2.getPluginRecorder('myPlugin');

      // Should be different instances after cache was cleared
      expect(recorderBefore).not.toBe(recorderAfter);
    });
  });
});
