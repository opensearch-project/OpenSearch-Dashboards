/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAreaConfig, AreaChartStyleControls } from './area_vis_config';
import { Positions, ThresholdLineStyle } from '../types';

describe('area_vis_config', () => {
  describe('createAreaConfig', () => {
    it('should create a valid area chart configuration', () => {
      const config = createAreaConfig();

      // Check basic properties
      expect(config.name).toBe('area');
      expect(config.type).toBe('area');
      expect(config.ui).toBeDefined();
      expect(config.ui.style).toBeDefined();
      expect(config.ui.style.defaults).toBeDefined();
      expect(config.ui.style.render).toBeDefined();
      expect(typeof config.ui.style.render).toBe('function');
    });

    it('should have the correct default style options', () => {
      const config = createAreaConfig();
      const defaults = config.ui.style.defaults as AreaChartStyleControls;

      // Check basic controls
      expect(defaults.addTooltip).toBe(true);
      expect(defaults.addLegend).toBe(true);
      expect(defaults.legendPosition).toBe(Positions.RIGHT);
      expect(defaults.addTimeMarker).toBe(false);

      // Check threshold line
      expect(defaults.thresholdLine).toBeDefined();
      expect(defaults.thresholdLine.color).toBe('#E7664C');
      expect(defaults.thresholdLine.show).toBe(false);
      expect(defaults.thresholdLine.style).toBe(ThresholdLineStyle.Full);
      expect(defaults.thresholdLine.value).toBe(10);
      expect(defaults.thresholdLine.width).toBe(1);

      // Check grid
      expect(defaults.grid).toBeDefined();
      expect(defaults.grid.categoryLines).toBe(true);
      expect(defaults.grid.valueLines).toBe(true);

      // Check axes
      expect(defaults.categoryAxes).toHaveLength(1);
      expect(defaults.categoryAxes[0].position).toBe(Positions.BOTTOM);
      expect(defaults.categoryAxes[0].show).toBe(true);

      expect(defaults.valueAxes).toHaveLength(1);
      expect(defaults.valueAxes[0].position).toBe(Positions.LEFT);
      expect(defaults.valueAxes[0].show).toBe(true);
    });

    it('should return a render function that creates a React element', () => {
      const config = createAreaConfig();
      const renderFn = config.ui.style.render;

      // Mock props
      const mockProps = {
        styleOptions: {} as AreaChartStyleControls,
        onStyleChange: jest.fn(),
      };

      // Call render function
      const result = renderFn(mockProps);

      // Check that it returns a React element
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.props).toBeDefined();
    });
  });
});
