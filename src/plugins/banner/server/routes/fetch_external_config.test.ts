/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { fetchExternalConfig } from './fetch_external_config';
import http from 'http';
import https from 'https';

// Mock http and https modules
jest.mock('http');
jest.mock('https');

describe('fetchExternalConfig', () => {
  // Create mock objects
  const mockLogger = {
    error: jest.fn(),
  };

  // Mock response object with EventEmitter-like behavior
  const createMockResponse = (statusCode: number) => {
    const listeners: Record<string, Array<(chunk?: any) => void>> = {
      data: [],
      end: [],
    };

    return {
      statusCode,
      on: jest.fn((event: string, callback: (chunk?: any) => void) => {
        if (!listeners[event]) {
          listeners[event] = [];
        }
        listeners[event].push(callback);
        return this;
      }),
      // Helper methods to trigger events in tests
      emitData: (chunk: string) => {
        listeners.data.forEach((callback) => callback(chunk));
      },
      emitEnd: () => {
        listeners.end.forEach((callback) => callback());
      },
    };
  };

  // Mock request object with EventEmitter-like behavior
  const createMockRequest = () => {
    const listeners: Record<string, Array<(error?: Error) => void>> = {
      error: [],
      timeout: [],
    };

    return {
      on: jest.fn((event: string, callback: (error?: Error) => void) => {
        if (!listeners[event]) {
          listeners[event] = [];
        }
        listeners[event].push(callback);
        return this;
      }),
      end: jest.fn(),
      destroy: jest.fn(),
      // Helper methods to trigger events in tests
      emitError: (error: Error) => {
        listeners.error.forEach((callback) => callback(error));
      },
      emitTimeout: () => {
        listeners.timeout.forEach((callback) => callback());
      },
    };
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockLogger.error.mockClear();
  });

  test('successfully fetches and parses JSON data from HTTP URL', async () => {
    // Mock data
    const testUrl = 'http://example.com/banner-config';
    const mockData = { content: 'Test Banner', color: 'primary' };
    const mockJsonString = JSON.stringify(mockData);

    // Create mock response
    const mockResponse = createMockResponse(200);

    // Create mock request
    const mockRequest = createMockRequest();

    // Mock http.request to return our mock request and call the callback with mock response
    (http.request as jest.Mock).mockImplementation((url, options, callback) => {
      callback(mockResponse);
      return mockRequest;
    });

    // Start the async function call
    const resultPromise = fetchExternalConfig(testUrl, mockLogger);

    // Simulate response data events
    mockResponse.emitData(mockJsonString);
    mockResponse.emitEnd();

    // Wait for the promise to resolve
    const result = await resultPromise;

    // Verify results
    expect(http.request).toHaveBeenCalledWith(
      testUrl,
      expect.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
        timeout: 5000,
      }),
      expect.any(Function)
    );
    expect(mockRequest.end).toHaveBeenCalled();
    expect(result).toEqual(mockData);
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test('successfully fetches and parses JSON data from HTTPS URL', async () => {
    // Mock data
    const httpsUrl = 'https://example.com/banner-config';
    const mockData = { content: 'Test Banner', color: 'primary' };
    const mockJsonString = JSON.stringify(mockData);

    // Create mock response
    const mockResponse = createMockResponse(200);

    // Create mock request
    const mockRequest = createMockRequest();

    // Mock https.request to return our mock request and call the callback with mock response
    (https.request as jest.Mock).mockImplementation((url, options, callback) => {
      callback(mockResponse);
      return mockRequest;
    });

    // Start the async function call
    const resultPromise = fetchExternalConfig(httpsUrl, mockLogger);

    // Simulate response data events
    mockResponse.emitData(mockJsonString);
    mockResponse.emitEnd();

    // Wait for the promise to resolve
    const result = await resultPromise;

    // Verify results
    expect(https.request).toHaveBeenCalledWith(
      httpsUrl,
      expect.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
        timeout: 5000,
      }),
      expect.any(Function)
    );
    expect(mockRequest.end).toHaveBeenCalled();
    expect(result).toEqual(mockData);
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test('handles non-200 status code', async () => {
    // Mock data
    const errorUrl = 'http://example.com/banner-config';

    // Create mock response with non-200 status
    const mockResponse = createMockResponse(404);

    // Create mock request
    const mockRequest = createMockRequest();

    // Mock http.request
    (http.request as jest.Mock).mockImplementation((url, options, callback) => {
      callback(mockResponse);
      return mockRequest;
    });

    // Call the function
    const result = await fetchExternalConfig(errorUrl, mockLogger);

    // Verify results
    expect(result).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith('Error fetching banner config: HTTP status 404');
  });

  test('handles JSON parsing error', async () => {
    // Mock data
    const jsonErrorUrl = 'http://example.com/banner-config';
    const invalidJson = '{ invalid: json }';

    // Create mock response
    const mockResponse = createMockResponse(200);

    // Create mock request
    const mockRequest = createMockRequest();

    // Mock http.request
    (http.request as jest.Mock).mockImplementation((url, options, callback) => {
      callback(mockResponse);
      return mockRequest;
    });

    // Start the async function call
    const resultPromise = fetchExternalConfig(jsonErrorUrl, mockLogger);

    // Simulate response data events with invalid JSON
    mockResponse.emitData(invalidJson);
    mockResponse.emitEnd();

    // Wait for the promise to resolve
    const result = await resultPromise;

    // Verify results
    expect(result).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error parsing banner config JSON:')
    );
  });

  test('handles request error', async () => {
    // Mock data
    const url = 'http://example.com/banner-config';
    const mockError = new Error('Network error');

    // Create mock request
    const mockRequest = createMockRequest();

    // Mock http.request
    (http.request as jest.Mock).mockImplementation(() => {
      return mockRequest;
    });

    // Start the async function call
    const resultPromise = fetchExternalConfig(url, mockLogger);

    // Simulate request error
    mockRequest.emitError(mockError);

    // Wait for the promise to resolve
    const result = await resultPromise;

    // Verify results
    expect(result).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith('Error fetching banner config: Network error');
  });

  test('handles request timeout', async () => {
    // Mock data
    const url = 'http://example.com/banner-config';

    // Create mock request
    const mockRequest = createMockRequest();

    // Mock http.request
    (http.request as jest.Mock).mockImplementation(() => {
      return mockRequest;
    });

    // Start the async function call
    const resultPromise = fetchExternalConfig(url, mockLogger);

    // Simulate request timeout
    mockRequest.emitTimeout();

    // Wait for the promise to resolve
    const result = await resultPromise;

    // Verify results
    expect(result).toBeNull();
    expect(mockRequest.destroy).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith('Request timeout while fetching banner config');
  });

  test('handles URL parsing error', async () => {
    // Invalid URL
    const url = 'invalid-url';

    // Call the function
    const result = await fetchExternalConfig(url, mockLogger);

    // Verify results
    expect(result).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error creating request for banner config:')
    );
  });
});
