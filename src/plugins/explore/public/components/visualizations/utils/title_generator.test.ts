/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateDefaultVisualizationTitle } from './title_generator';
import { AxisRole, VisFieldType, AxisColumnMappings } from '../types';

describe('generateDefaultVisualizationTitle', () => {
  const mockDateColumn = {
    id: 1,
    name: 'timestamp',
    schema: VisFieldType.Date,
    column: 'timestamp',
    validValuesCount: 100,
    uniqueValuesCount: 100,
  };

  const mockCategoryColumn = {
    id: 2,
    name: 'product',
    schema: VisFieldType.Categorical,
    column: 'product',
    validValuesCount: 50,
    uniqueValuesCount: 10,
  };

  const mockNumericalColumn = {
    id: 3,
    name: 'sales',
    schema: VisFieldType.Numerical,
    column: 'sales',
    validValuesCount: 100,
    uniqueValuesCount: 80,
  };

  const mockColorColumn = {
    id: 4,
    name: 'region',
    schema: VisFieldType.Categorical,
    column: 'region',
    validValuesCount: 50,
    uniqueValuesCount: 5,
  };

  const mockSizeColumn = {
    id: 5,
    name: 'quantity',
    schema: VisFieldType.Numerical,
    column: 'quantity',
    validValuesCount: 100,
    uniqueValuesCount: 75,
  };

  const mockFacetColumn = {
    id: 6,
    name: 'store',
    schema: VisFieldType.Categorical,
    column: 'store',
    validValuesCount: 50,
    uniqueValuesCount: 3,
  };

  describe('metric and gauge charts', () => {
    it('should generate title for metric chart', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumn,
      };
      const title = generateDefaultVisualizationTitle('metric', mappings);
      expect(title).toBe('sales');
    });

    it('should generate title for gauge chart', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumn,
      };
      const title = generateDefaultVisualizationTitle('gauge', mappings);
      expect(title).toBe('sales');
    });

    it('should return "metric" when y-axis is undefined', () => {
      const mappings: AxisColumnMappings = {};
      const title = generateDefaultVisualizationTitle('metric', mappings);
      expect(title).toBe('metric');
    });
  });

  describe('pie charts', () => {
    it('should generate title with size and color', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.SIZE]: mockNumericalColumn,
        [AxisRole.COLOR]: mockColorColumn,
      };
      const title = generateDefaultVisualizationTitle('pie', mappings);
      expect(title).toBe('sales by region');
    });

    it('should use y-axis name when size is not defined', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockColorColumn,
      };
      const title = generateDefaultVisualizationTitle('pie', mappings);
      expect(title).toBe('sales');
    });

    it('should return "value" when y-axis is undefined', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.COLOR]: mockColorColumn,
      };
      const title = generateDefaultVisualizationTitle('pie', mappings);
      expect(title).toBe('value');
    });
  });

  describe('scatter plots', () => {
    it('should generate simple scatter title', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockCategoryColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };
      const title = generateDefaultVisualizationTitle('scatter', mappings);
      expect(title).toBe('sales vs product');
    });

    it('should generate scatter title with color', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockCategoryColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockColorColumn,
      };
      const title = generateDefaultVisualizationTitle('scatter', mappings);
      expect(title).toBe('sales vs product by region');
    });

    it('should generate scatter title with color and size', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockCategoryColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockColorColumn,
        [AxisRole.SIZE]: mockSizeColumn,
      };
      const title = generateDefaultVisualizationTitle('scatter', mappings);
      expect(title).toBe('sales vs product by region (sized by quantity)');
    });

    it('should return "scatter plot" when axes are undefined', () => {
      const mappings: AxisColumnMappings = {};
      const title = generateDefaultVisualizationTitle('scatter', mappings);
      expect(title).toBe('scatter plot');
    });
  });

  describe('heatmap charts', () => {
    it('should generate heatmap title', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockCategoryColumn,
        [AxisRole.Y]: mockDateColumn,
        [AxisRole.COLOR]: mockNumericalColumn,
      };
      const title = generateDefaultVisualizationTitle('heatmap', mappings);
      expect(title).toBe('sales by product, timestamp');
    });

    it('should use "value" when color column is undefined', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockCategoryColumn,
        [AxisRole.Y]: mockDateColumn,
      };
      const title = generateDefaultVisualizationTitle('heatmap', mappings);
      expect(title).toBe('value by product, timestamp');
    });

    it('should return "heatmap" when axes are undefined', () => {
      const mappings: AxisColumnMappings = {};
      const title = generateDefaultVisualizationTitle('heatmap', mappings);
      expect(title).toBe('heatmap');
    });
  });

  describe('state timeline charts', () => {
    it('should generate state timeline title with time', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockCategoryColumn,
        [AxisRole.COLOR]: {
          id: 7,
          name: 'status',
          schema: VisFieldType.Categorical,
          column: 'status',
          validValuesCount: 50,
          uniqueValuesCount: 4,
        },
      };
      const title = generateDefaultVisualizationTitle('state_timeline', mappings);
      expect(title).toBe('status by time, product');
    });

    it('should generate state timeline title without time', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockCategoryColumn,
        [AxisRole.Y]: {
          id: 8,
          name: 'host',
          schema: VisFieldType.Categorical,
          column: 'host',
          validValuesCount: 50,
          uniqueValuesCount: 20,
        },
        [AxisRole.COLOR]: {
          id: 9,
          name: 'status',
          schema: VisFieldType.Categorical,
          column: 'status',
          validValuesCount: 50,
          uniqueValuesCount: 4,
        },
      };
      const title = generateDefaultVisualizationTitle('state_timeline', mappings);
      expect(title).toBe('status by product, host');
    });

    it('should use "status" as default color name', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockCategoryColumn,
      };
      const title = generateDefaultVisualizationTitle('state_timeline', mappings);
      expect(title).toBe('status by time, product');
    });

    it('should return "state timeline" when axes are undefined', () => {
      const mappings: AxisColumnMappings = {};
      const title = generateDefaultVisualizationTitle('state_timeline', mappings);
      expect(title).toBe('state timeline');
    });
  });

  describe('standard charts (line, bar, area)', () => {
    it('should generate simple time series title', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };
      const title = generateDefaultVisualizationTitle('line', mappings);
      expect(title).toBe('sales by time');
    });

    it('should generate time series title with color', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockColorColumn,
      };
      const title = generateDefaultVisualizationTitle('bar', mappings);
      expect(title).toBe('sales by time, region');
    });

    it('should generate time series title with color and facet', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockColorColumn,
        [AxisRole.FACET]: mockFacetColumn,
      };
      const title = generateDefaultVisualizationTitle('area', mappings);
      expect(title).toBe('sales by time, region (split by store)');
    });

    it('should generate category-based title', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockCategoryColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };
      const title = generateDefaultVisualizationTitle('bar', mappings);
      expect(title).toBe('sales by product');
    });

    it('should generate category-based title with color', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockCategoryColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockColorColumn,
      };
      const title = generateDefaultVisualizationTitle('bar', mappings);
      expect(title).toBe('sales by product, region');
    });

    it('should generate category-based title with color and facet', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockCategoryColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockColorColumn,
        [AxisRole.FACET]: mockFacetColumn,
      };
      const title = generateDefaultVisualizationTitle('line', mappings);
      expect(title).toBe('sales by product, region (split by store)');
    });

    it('should generate title with only y-axis', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumn,
      };
      const title = generateDefaultVisualizationTitle('bar', mappings);
      expect(title).toBe('sales');
    });

    it('should return "visualization" when y-axis is undefined', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockCategoryColumn,
      };
      const title = generateDefaultVisualizationTitle('line', mappings);
      expect(title).toBe('visualization');
    });
  });

  describe('case insensitivity', () => {
    it('should handle uppercase chart types', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumn,
      };
      const title = generateDefaultVisualizationTitle('METRIC', mappings);
      expect(title).toBe('sales');
    });

    it('should handle mixed case chart types', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };
      const title = generateDefaultVisualizationTitle('Line', mappings);
      expect(title).toBe('sales by time');
    });
  });

  describe('edge cases', () => {
    it('should handle empty mappings', () => {
      const mappings: AxisColumnMappings = {};
      const title = generateDefaultVisualizationTitle('line', mappings);
      expect(title).toBe('visualization');
    });

    it('should handle unknown chart type', () => {
      const mappings: AxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };
      const title = generateDefaultVisualizationTitle('unknown', mappings);
      expect(title).toBe('sales by time');
    });
  });
});
