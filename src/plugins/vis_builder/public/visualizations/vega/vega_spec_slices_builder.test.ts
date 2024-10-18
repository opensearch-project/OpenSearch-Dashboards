/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateVegaSpecForSlices } from './vega_spec_slices_builder';

// Mock the imported functions
jest.mock('./components/mark/mark_slices', () => ({
  buildSlicesMarkForVega: jest.fn(() => ({ type: 'mock-slices-mark' })),
}));

jest.mock('./components/legend', () => ({
  buildLegend: jest.fn(() => ({ type: 'mock-legend' })),
}));

describe('generateVegaSpecForSlices', () => {
  const mockData = {
    slices: [{ value: 10 }, { value: 20 }],
    levels: ['level1', 'level2'],
  };

  const mockVisConfig = {
    dimensions: {},
    addLegend: true,
    legendPosition: 'right',
  };

  const mockStyle = {
    colorSchema: 'custom-schema',
  };

  it('should generate a valid Vega spec for slices', () => {
    const result = generateVegaSpecForSlices(mockData, mockVisConfig, mockStyle);

    expect(result.$schema).toBe('https://vega.github.io/schema/vega/v5.json');
    expect(result.padding).toBe(5);
    expect(result.signals).toHaveLength(8);
    expect(result.data).toHaveLength(2);
    expect(result.scales).toHaveLength(1);
    expect(result.scales?.[0].range.scheme).toBe('category20');
    expect(result.marks).toEqual([{ type: 'mock-slices-mark' }]);
    expect(result.legends).toEqual([{ type: 'mock-legend' }]);
  });

  it('should handle split data correctly', () => {
    const splitVisConfig = {
      ...mockVisConfig,
      dimensions: { splitRow: true },
    };

    const result = generateVegaSpecForSlices(mockData, splitVisConfig, mockStyle);

    expect(result.signals?.[0].update).toBe("length(data('splits'))");
    expect(result.layout).toBeDefined();
    if (result.layout) expect(result.layout.columns).toEqual({ signal: 'splitCount' });
  });

  it('should not add legend when addLegend is false', () => {
    const noLegendVisConfig = {
      ...mockVisConfig,
      addLegend: false,
    };

    const result = generateVegaSpecForSlices(mockData, noLegendVisConfig, mockStyle);

    expect(result.legends).toBeUndefined();
  });

  it('should use default color schema when not provided in style', () => {
    const result = generateVegaSpecForSlices(mockData, mockVisConfig, {});

    expect(result.scales?.[0].range.scheme).toBe('category20');
  });
});
