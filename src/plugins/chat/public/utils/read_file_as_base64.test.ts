/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileAsBase64 } from './read_file_as_base64';

describe('readFileAsBase64', () => {
  // Helper to create a mock File
  const createMockFile = (name: string, content: string, type: string): File => {
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
  };

  it('should read a text file as base64', async () => {
    const file = createMockFile('test.txt', 'Hello, world!', 'text/plain');
    const result = await readFileAsBase64(file);

    expect(result.filename).toBe('test.txt');
    expect(result.mimeType).toBe('text/plain');
    expect(result.size).toBe(13);
    // Verify base64 decodes back to original content
    expect(atob(result.base64)).toBe('Hello, world!');
  });

  it('should read a CSV file as base64', async () => {
    const csvContent = 'name,age\nAlice,30\nBob,25';
    const file = createMockFile('data.csv', csvContent, 'text/csv');
    const result = await readFileAsBase64(file);

    expect(result.filename).toBe('data.csv');
    expect(result.mimeType).toBe('text/csv');
    expect(atob(result.base64)).toBe(csvContent);
  });

  it('should read a JSON file as base64', async () => {
    const jsonContent = '{"key": "value"}';
    const file = createMockFile('config.json', jsonContent, 'application/json');
    const result = await readFileAsBase64(file);

    expect(result.filename).toBe('config.json');
    expect(result.mimeType).toBe('application/json');
    expect(atob(result.base64)).toBe(jsonContent);
  });

  it('should fall back to application/octet-stream when mime type is empty', async () => {
    const blob = new Blob(['content'], { type: '' });
    const file = new File([blob], 'unknown.dat', { type: '' });
    const result = await readFileAsBase64(file);

    expect(result.mimeType).toBe('application/octet-stream');
  });

  it('should handle empty files', async () => {
    const file = createMockFile('empty.txt', '', 'text/plain');
    const result = await readFileAsBase64(file);

    expect(result.filename).toBe('empty.txt');
    expect(result.size).toBe(0);
    expect(result.base64).toBe('');
  });

  it('should reject when FileReader errors', async () => {
    // Mock FileReader to simulate an error
    const originalFileReader = global.FileReader;
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onerror: null as any,
      onload: null as any,
      result: null,
    };

    global.FileReader = jest.fn(() => mockFileReader) as any;

    const file = createMockFile('bad.txt', 'content', 'text/plain');
    const promise = readFileAsBase64(file);

    // Trigger the error
    mockFileReader.onerror();

    await expect(promise).rejects.toThrow('Failed to read file: bad.txt');

    global.FileReader = originalFileReader;
  });
});
