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

// Mock global fetch
const originalFetch = global.fetch;

describe('fetchExternalConfig', () => {
  // Create mock objects
  const mockLogger = {
    error: jest.fn(),
  };

  // Mock response for fetch
  const createMockResponse = (status: number, jsonData?: any, throwOnJson?: Error) => {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockImplementation(() => {
        if (throwOnJson) {
          return Promise.reject(throwOnJson);
        }
        return Promise.resolve(jsonData);
      }),
    };
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockLogger.error.mockClear();
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterAll(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  test('successfully fetches and parses JSON data from HTTP URL', async () => {
    // Mock data
    const testUrl = 'http://example.com/banner-config';
    const mockData = { content: 'Test Banner', color: 'primary' };
    // Mock fetch response
    const mockResponse = createMockResponse(200, mockData);
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    // Call the function
    const result = await fetchExternalConfig(testUrl, mockLogger);

    // Verify results
    expect(global.fetch).toHaveBeenCalledWith(
      testUrl,
      expect.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: expect.any(AbortSignal),
      })
    );
    expect(result).toEqual(mockData);
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test('successfully fetches and parses JSON data from HTTPS URL', async () => {
    // Mock data
    const httpsUrl = 'https://example.com/banner-config';
    const mockData = { content: 'Test Banner', color: 'primary' };
    // Mock fetch response
    const mockResponse = createMockResponse(200, mockData);
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    // Call the function
    const result = await fetchExternalConfig(httpsUrl, mockLogger);

    // Verify results
    expect(global.fetch).toHaveBeenCalledWith(
      httpsUrl,
      expect.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: expect.any(AbortSignal),
      })
    );
    expect(result).toEqual(mockData);
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test('handles non-200 status code', async () => {
    // Mock data
    const errorUrl = 'http://example.com/banner-config';

    // Mock fetch response with non-200 status
    const mockResponse = createMockResponse(404);
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    // Call the function
    const result = await fetchExternalConfig(errorUrl, mockLogger);

    // Verify results
    expect(result).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith('Error fetching banner config: HTTP status 404');
  });

  test('handles JSON parsing error', async () => {
    // Mock data
    const jsonErrorUrl = 'http://example.com/banner-config';
    const syntaxError = new SyntaxError('Unexpected token i in JSON at position 2');

    // Mock fetch response with JSON parsing error
    const mockResponse = createMockResponse(200, null, syntaxError);
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    // Call the function
    const result = await fetchExternalConfig(jsonErrorUrl, mockLogger);

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

    // Mock fetch to throw an error
    (global.fetch as jest.Mock).mockRejectedValue(mockError);

    // Call the function
    const result = await fetchExternalConfig(url, mockLogger);

    // Verify results
    expect(result).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith(`Error fetching banner config: ${mockError}`);
  });

  test('handles request timeout', async () => {
    // Mock data
    const url = 'http://example.com/banner-config';
    const abortError = new DOMException('The operation was aborted', 'AbortError');

    // Mock fetch to throw an AbortError
    (global.fetch as jest.Mock).mockRejectedValue(abortError);

    // Call the function
    const result = await fetchExternalConfig(url, mockLogger);

    // Verify results
    expect(result).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith('Request timeout while fetching banner config');
  });

  test('handles URL parsing error', async () => {
    // Invalid URL
    const url = 'invalid-url';
    const typeError = new TypeError('Invalid URL');

    // Mock fetch to throw a TypeError for invalid URL
    (global.fetch as jest.Mock).mockRejectedValue(typeError);

    // Call the function
    const result = await fetchExternalConfig(url, mockLogger);

    // Verify results
    expect(result).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith(`Error fetching banner config: ${typeError}`);
  });
});
