/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createTableConfig, defaultTableChartStyles } from './table_vis_config';
import { TableVisStyleControls as TableVisStyleControlsComponent } from './table_vis_options';

// Mock the TableVisStyleControls component
jest.mock('./table_vis_options', () => ({
  TableVisStyleControls: jest.fn(),
}));

describe('table_vis_config', () => {
  describe('createTableConfig', () => {
    test('returns the correct configuration object', () => {
      const config = createTableConfig();

      // Check the basic properties
      expect(config.name).toBe('table');
      expect(config.type).toBe('table');

      // Check the UI configuration
      expect(config.ui).toBeDefined();
      expect(config.ui.style).toBeDefined();
      expect(config.ui.availableMappings).toEqual([]);

      // Check the style defaults
      expect(config.ui.style.defaults).toBeDefined();
      expect(config.ui.style.defaults.pageSize).toBe(10);

      // Check that the render function returns a React element
      const mockProps = {
        styleOptions: { ...defaultTableChartStyles, pageSize: 10 },
        onStyleChange: jest.fn(),
        updateVisualization: jest.fn(),
        axisColumnMappings: {},
        numericalColumns: [],
        categoricalColumns: [],
        dateColumns: [],
      };

      const renderResult = config.ui.style.render(mockProps);
      expect(renderResult.type).toBe(TableVisStyleControlsComponent);
      expect(renderResult.props).toEqual(mockProps);
    });

    test('style defaults match expected values', () => {
      const config = createTableConfig();
      const defaults = config.ui.style.defaults;

      expect(defaults).toEqual({
        pageSize: 10,
        globalAlignment: 'left',
        hiddenColumns: [],
        showColumnFilter: false,
        showFooter: false,
        footerCalculations: [],
        cellTypes: [],
        thresholds: [],
        baseColor: '#000000',
        dataLinks: [],
        visibleColumns: [],
      });
    });
  });
});
