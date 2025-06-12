/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createHeatmapConfig, HeatmapChartStyleControls } from './heatmap_vis_config';
import { HeatmapVisStyleControls } from './heatmap_vis_options';
import { StandardAxes, Positions, ColorSchemas, ScaleType } from '../types';

// Mock the React.createElement function
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createElement: jest.fn(),
}));

describe('line_vis_config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLineConfig', () => {
    it('should create a heatmap visualization type configuration', () => {
      const config = createHeatmapConfig();

      // Verify the basic structure
      expect(config).toHaveProperty('name', 'heatmap');
      expect(config).toHaveProperty('type', 'heatmap');
      expect(config).toHaveProperty('ui.style.defaults');
      expect(config).toHaveProperty('ui.style.render');
    });
  });
});
