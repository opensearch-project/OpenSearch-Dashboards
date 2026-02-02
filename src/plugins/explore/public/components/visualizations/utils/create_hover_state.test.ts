/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createCrosshairLayers, createHighlightBarLayers } from './create_hover_state';

// Mock the getColors function
jest.mock('../theme/default_colors', () => ({
  getColors: jest.fn().mockReturnValue({
    text: '#000000',
    // Add other colors as needed for the tests
  }),
}));

describe('create_hover_state', () => {
  // Common test data
  const xField = { name: 'timestamp', type: 'temporal' };
  const yField = { name: 'count', type: 'quantitative' };
  const y1Field = { name: 'average', type: 'quantitative' };
  const colorField = { name: 'category', type: 'nominal' };
  const multipleYFields = [
    { name: 'count', type: 'quantitative' },
    { name: 'sum', type: 'quantitative' },
  ];
  const testData = [
    { timestamp: '2023-01-01', count: 10, average: 5, category: 'A' },
    { timestamp: '2023-01-02', count: 20, average: 15, category: 'B' },
  ];

  describe('createCrosshairLayers', () => {
    it('should create layers with single y field', () => {
      const axisConfig = {
        x: xField,
        y: yField,
      };
      const options = { showTooltip: true };

      const layers = createCrosshairLayers(axisConfig, options);

      expect(layers).toHaveLength(3);
      expect(layers).toMatchSnapshot();
    });

    it('should create layers with y1 field', () => {
      const axisConfig = {
        x: xField,
        y: yField,
        y1: y1Field,
      };
      const options = { showTooltip: true };

      const layers = createCrosshairLayers(axisConfig, options);

      // Should create 5 layers: point layer for y, point layer for y1, hidden bar layer, x rule layer, and y rule layer
      expect(layers).toHaveLength(4);
      expect(layers).toMatchSnapshot();
    });

    it('should create layers with color field', () => {
      const axisConfig = {
        x: xField,
        y: yField,
        color: colorField,
      };
      const options = { showTooltip: true };

      const layers = createCrosshairLayers(axisConfig, options);

      // Should create 3 layers: point layer, hidden bar layer, and x rule layer
      // No y rule layer when color field is present
      expect(layers).toHaveLength(3);
      expect(layers).toMatchSnapshot();
    });

    it('should create layers with multiple y fields', () => {
      const axisConfig = {
        x: xField,
        y: multipleYFields,
      };
      const options = { showTooltip: true };

      const layers = createCrosshairLayers(axisConfig, options);

      // Should create 3 layers: point layer, hidden bar layer, and x rule layer
      expect(layers).toHaveLength(3);
      expect(layers).toMatchSnapshot();
    });

    it('should create layers with showTooltip=false', () => {
      const axisConfig = {
        x: xField,
        y: yField,
      };
      const options = { showTooltip: false };

      const layers = createCrosshairLayers(axisConfig, options);
      expect(layers).toMatchSnapshot();
    });

    it('should create layers with nominal x field', () => {
      const axisConfig = {
        x: { ...xField, type: 'nominal' },
        y: yField,
      };
      const options = { showTooltip: true };

      const layers = createCrosshairLayers(axisConfig, options);
      expect(layers).toMatchSnapshot();
    });
  });

  describe('createHighlightBarLayers', () => {
    it('should create layers with single y field', () => {
      const axisConfig = {
        x: xField,
        y: yField,
      };
      const options = { showTooltip: true };

      const layers = createHighlightBarLayers(axisConfig, options);

      // Should create 2 layers: point layer and hidden bar layer
      expect(layers).toHaveLength(2);
      expect(layers).toMatchSnapshot();
    });

    it('should create layers with y1 field', () => {
      const axisConfig = {
        x: xField,
        y: yField,
        y1: y1Field,
      };
      const options = { showTooltip: true };

      const layers = createHighlightBarLayers(axisConfig, options);

      // Should create 1 layers: hidden bar layer
      expect(layers).toHaveLength(1);
      expect(layers).toMatchSnapshot();
    });

    it('should create layers with color field and data', () => {
      const axisConfig = {
        x: xField,
        y: yField,
        color: colorField,
      };
      const options = { showTooltip: true, data: testData };

      const layers = createHighlightBarLayers(axisConfig, options);
      expect(layers).toMatchSnapshot();
    });

    it('should create layers with multiple y fields', () => {
      const axisConfig = {
        x: xField,
        y: multipleYFields,
      };
      const options = { showTooltip: true };

      const layers = createHighlightBarLayers(axisConfig, options);
      expect(layers).toMatchSnapshot();
    });

    it('should create layers with showTooltip=false', () => {
      const axisConfig = {
        x: xField,
        y: yField,
      };
      const options = { showTooltip: false };

      const layers = createHighlightBarLayers(axisConfig, options);
      expect(layers).toMatchSnapshot();
    });
  });
});
