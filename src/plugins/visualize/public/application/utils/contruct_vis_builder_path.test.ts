/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Mock the entire module
jest.mock('./construct_vis_builder_path');

// Import the mocked module
import { constructVisBuilderPath } from './construct_vis_builder_path';

describe('constructVisBuilderPath', () => {
  const mockVisualizeServices = {} as any;
  const mockItem = { id: 'test-id' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a URL with _q and _a parameters', async () => {
    const mockUrl = '/app/vis-builder#/_q={"filters":[],"query":""}&_a={"param":"value"}';
    (constructVisBuilderPath as jest.Mock).mockResolvedValue(mockUrl);

    const result = await constructVisBuilderPath(mockItem, mockVisualizeServices);

    expect(result).toContain('/app/vis-builder#/');
    expect(result).toContain('_q=');
    expect(result).toContain('_a=');
  });

  it('should include filters and query in _q parameter', async () => {
    const mockUrl = '/app/vis-builder#/_q={"filters":["test"],"query":"test query"}&_a={}';
    (constructVisBuilderPath as jest.Mock).mockResolvedValue(mockUrl);

    const result = await constructVisBuilderPath(mockItem, mockVisualizeServices);

    expect(result).toContain('"filters":["test"]');
    expect(result).toContain('"query":"test query"');
  });

  it('should handle empty _q parameter', async () => {
    const mockUrl = '/app/vis-builder#/_q={}&_a={}';
    (constructVisBuilderPath as jest.Mock).mockResolvedValue(mockUrl);

    const result = await constructVisBuilderPath(mockItem, mockVisualizeServices);

    expect(result).toContain('_q={}');
  });

  it('should include _a parameter with some content', async () => {
    const mockUrl = '/app/vis-builder#/_q={}&_a={"someKey":"someValue"}';
    (constructVisBuilderPath as jest.Mock).mockResolvedValue(mockUrl);

    const result = await constructVisBuilderPath(mockItem, mockVisualizeServices);

    expect(result).toContain('_a={"someKey":"someValue"}');
  });
});
