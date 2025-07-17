/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { getTimeRangeFromPayload, redirectToLogs } from './redirection_helpers';
import { DataExplorerServices } from '../../../../../../../../data_explorer/public';

// Mock moment to control time-based tests
jest.mock('moment', () => {
  // Create mock functions that can be tracked
  const subtractMock = jest.fn(() => ({
    toISOString: jest.fn(() => 'mocked-past-time'),
  }));

  const addMock = jest.fn(() => ({
    toISOString: jest.fn(() => 'mocked-future-time'),
  }));

  const toISOStringMock = jest.fn(() => 'mocked-current-time');

  const momentInstanceMock = {
    subtract: subtractMock,
    add: addMock,
    toISOString: toISOStringMock,
    clone: jest.fn(() => ({
      add: jest.fn(() => ({
        isAfter: jest.fn(() => false),
      })),
    })),
    isBefore: jest.fn(() => false),
    isAfter: jest.fn(() => false),
  };

  const mockMoment: any = jest.fn(() => momentInstanceMock);

  // Create utc mock with similar structure
  mockMoment.utc = jest.fn(() => ({
    subtract: jest.fn(() => ({
      toISOString: jest.fn(() => 'mocked-past-time'),
    })),
    add: jest.fn(() => ({
      toISOString: jest.fn(() => 'mocked-future-time'),
    })),
    toISOString: jest.fn(() => 'mocked-current-time'),
    clone: jest.fn(() => ({
      add: jest.fn(() => ({
        isAfter: jest.fn(() => false),
      })),
    })),
    isBefore: jest.fn(() => false),
    isAfter: jest.fn(() => false),
  }));

  return mockMoment;
});

describe('redirection_helpers', () => {
  describe('getTimeRangeFromPayload', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns default time range when payload is empty', () => {
      const result = getTimeRangeFromPayload([]);

      expect(result).toEqual({
        startTime: 'mocked-past-time',
        endTime: 'mocked-current-time',
      });

      // Verify moment was called with the correct parameters
      expect(moment().subtract).toHaveBeenCalledWith(15, 'minutes');
      expect(moment().toISOString).toHaveBeenCalled();
    });

    it('extracts time range from payload with startTime and endTime', () => {
      const payload = [
        {
          spanId: 'span1',
          startTime: '2023-01-01T00:00:00.000Z',
          endTime: '2023-01-01T00:01:00.000Z',
        },
        {
          spanId: 'span2',
          startTime: '2023-01-01T00:02:00.000Z',
          endTime: '2023-01-01T00:03:00.000Z',
        },
      ];

      const result = getTimeRangeFromPayload(payload);

      expect(result).toEqual({
        startTime: 'mocked-past-time',
        endTime: 'mocked-future-time',
      });

      // Verify moment.utc was called with the correct parameters
      expect(moment.utc).toHaveBeenCalledWith('2023-01-01T00:00:00.000Z');
      expect(moment.utc).toHaveBeenCalledWith('2023-01-01T00:03:00.000Z');
    });

    it('handles payload with timestamp instead of startTime/endTime', () => {
      const payload = [
        {
          spanId: 'span1',
          timestamp: '2023-01-01T00:00:00.000Z',
        },
      ];

      const result = getTimeRangeFromPayload(payload);

      expect(result).toEqual({
        startTime: 'mocked-past-time',
        endTime: 'mocked-future-time',
      });

      // Verify moment.utc was called with the correct parameters
      expect(moment.utc).toHaveBeenCalledWith('2023-01-01T00:00:00.000Z');
    });

    it('handles payload with duration', () => {
      const payload = [
        {
          spanId: 'span1',
          startTime: '2023-01-01T00:00:00.000Z',
          durationInNanos: 1000000, // 1 millisecond
        },
      ];

      const result = getTimeRangeFromPayload(payload);

      expect(result).toEqual({
        startTime: 'mocked-past-time',
        endTime: 'mocked-future-time',
      });
    });
  });

  describe('redirectToLogs', () => {
    const originalHref = window.location.href;

    beforeEach(() => {
      // Mock window.location.href
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:5601/app/explore/traces',
        },
        writable: true,
      });
    });

    afterEach(() => {
      // Restore original href
      Object.defineProperty(window, 'location', {
        value: {
          href: originalHref,
        },
        writable: true,
      });
    });

    it('redirects to logs with correct URL parameters', () => {
      // Mock getTimeRangeFromPayload to return fixed values
      const redirectionHelpers = jest.requireMock('./redirection_helpers');
      jest.spyOn(redirectionHelpers, 'getTimeRangeFromPayload').mockReturnValue({
        startTime: '2023-01-01T00:00:00.000Z',
        endTime: '2023-01-01T00:15:00.000Z',
      });

      const payloadData = [
        {
          spanId: 'span1',
          startTime: '2023-01-01T00:00:00.000Z',
          endTime: '2023-01-01T00:01:00.000Z',
        },
      ];

      const dataSourceMDSId = [{ id: 'test-source', label: 'Test Source' }];
      const traceId = 'test-trace-id';
      const services = {} as DataExplorerServices;

      redirectToLogs(payloadData, dataSourceMDSId, traceId, services);

      // Check that window.location.href was set correctly
      expect(window.location.href).toContain('app/explore/logs');
      expect(window.location.href).toContain('test-trace-id');
      expect(window.location.href).toContain('test-source');
      expect(window.location.href).toContain('Test Source');
    });

    it('works with valid data source ID array', () => {
      // Create test data
      const payloadData = [
        {
          spanId: 'span1',
          startTime: '2023-01-01T00:00:00.000Z',
          endTime: '2023-01-01T00:01:00.000Z',
        },
      ];

      // Create a non-empty data source array
      const dataSourceMDSId = [{ id: 'test-source', label: 'Test Source' }];
      const traceId = 'test-trace-id';
      const services = {} as DataExplorerServices;

      // Mock the getTimeRangeFromPayload function
      const originalGetTimeRange = getTimeRangeFromPayload;
      const mockGetTimeRange = jest.fn().mockReturnValue({
        startTime: '2023-01-01T00:00:00.000Z',
        endTime: '2023-01-01T00:15:00.000Z',
      });

      // Replace the function temporarily
      (global as any).getTimeRangeFromPayload = mockGetTimeRange;

      try {
        expect(() => {
          // Save original href
          const currentHref = window.location.href;

          // Mock window.location.href to prevent actual navigation
          Object.defineProperty(window, 'location', {
            value: { href: 'http://localhost:5601/app/explore/traces' },
            writable: true,
          });

          try {
            redirectToLogs(payloadData, dataSourceMDSId, traceId, services);
          } finally {
            // Restore original href
            Object.defineProperty(window, 'location', {
              value: { href: currentHref },
              writable: true,
            });
          }
        }).not.toThrow();
      } finally {
        // Restore the original function
        (global as any).getTimeRangeFromPayload = originalGetTimeRange;
      }
    });
  });
});
