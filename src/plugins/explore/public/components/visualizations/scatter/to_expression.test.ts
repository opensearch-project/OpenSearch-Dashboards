/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createTwoMetricScatter,
  createTwoMetricOneCateScatter,
  createThreeMetricOneCateScatter,
} from './to_expression';
import {
  VisColumn,
  VisFieldType,
  VEGASCHEMA,
  Positions,
  AxisRole,
  AxisColumnMappings,
  PointShape,
} from '../types';
import { defaultScatterChartStyles, ScatterChartStyle } from './scatter_vis_config';

describe('Scatter Chart to_expression', () => {
  // Mock data for testing
  const mockTransformedData = [
    { x: 10, y: 20, category: 'A', size: 5 },
    { x: 15, y: 25, category: 'A', size: 10 },
    { x: 20, y: 30, category: 'A', size: 15 },
    { x: 25, y: 35, category: 'B', size: 20 },
    { x: 30, y: 40, category: 'B', size: 25 },
    { x: 35, y: 45, category: 'B', size: 30 },
  ];

  const mockNumericalColumns: VisColumn[] = [
    {
      id: 1,
      name: 'X Value',
      schema: VisFieldType.Numerical,
      column: 'x',
      validValuesCount: 6,
      uniqueValuesCount: 6,
    },
    {
      id: 2,
      name: 'Y Value',
      schema: VisFieldType.Numerical,
      column: 'y',
      validValuesCount: 6,
      uniqueValuesCount: 6,
    },
    {
      id: 3,
      name: 'Size',
      schema: VisFieldType.Numerical,
      column: 'size',
      validValuesCount: 6,
      uniqueValuesCount: 6,
    },
  ];

  const mockCategoricalColumns: VisColumn[] = [
    {
      id: 4,
      name: 'Category',
      schema: VisFieldType.Categorical,
      column: 'category',
      validValuesCount: 6,
      uniqueValuesCount: 2,
    },
  ];

  const mockDateColumns: VisColumn[] = [];

  const mockStyles: ScatterChartStyle = {
    ...defaultScatterChartStyles,
    addLegend: true,
    legendPosition: Positions.RIGHT,
    tooltipOptions: {
      mode: 'all',
    },
    exclusive: {
      pointShape: PointShape.CIRCLE,
      angle: 0,
      filled: false,
    },
    standardAxes: [
      {
        id: 'Axis-1',
        position: Positions.BOTTOM,
        show: true,
        style: {},
        labels: {
          show: true,
          rotate: 0,
          filter: false,
          truncate: 100,
        },
        title: {
          text: 'X Axis',
        },
        grid: { showLines: true },
        axisRole: AxisRole.X,
        field: {
          default: mockNumericalColumns[0],
        },
      },
      {
        id: 'Axis-2',
        position: Positions.LEFT,
        show: true,
        style: {},
        labels: {
          show: true,
          rotate: 0,
          filter: false,
          truncate: 100,
        },
        grid: { showLines: true },
        title: {
          text: 'Y Axis',
        },
        axisRole: AxisRole.Y,
        field: {
          default: mockNumericalColumns[1],
        },
      },
    ],
  };

  describe('createTwoMetricScatter', () => {
    it('should create a scatter chart with two metrics', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.X]: mockNumericalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[1],
      };

      const result = createTwoMetricScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        mockStyles,
        mockAxisColumnMappings
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('data.values', mockTransformedData);
      expect(result).toHaveProperty('layer');
      expect(Array.isArray(result.layer)).toBe(true);

      // Verify the mark layer
      const markLayer = result.layer[0];
      expect(markLayer).toHaveProperty('mark.type', 'point');
      expect(markLayer).toHaveProperty('mark.tooltip', true);
      expect(markLayer).toHaveProperty('mark.shape', PointShape.CIRCLE);
      expect(markLayer).toHaveProperty('mark.angle', 0);
      expect(markLayer).toHaveProperty('mark.filled', false);

      // Verify encoding
      expect(markLayer).toHaveProperty('encoding.x.field', 'x');
      expect(markLayer).toHaveProperty('encoding.x.type', 'quantitative');
      expect(markLayer).toHaveProperty('encoding.y.field', 'y');
      expect(markLayer).toHaveProperty('encoding.y.type', 'quantitative');
    });

    it('should handle different title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.X]: mockNumericalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[1],
      };

      // Case 1: No title (show = false)
      const noTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: false,
          titleName: '',
        },
      };

      const noTitleResult = createTwoMetricScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        noTitleStyles,
        mockAxisColumnMappings
      );
      expect(noTitleResult.title).toBeUndefined();

      // Case 2: Default title (show = true, titleName = '')
      const defaultTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: '',
        },
      };

      const defaultTitleResult = createTwoMetricScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult.title).toBe('X Value with Y Value');

      // Case 3: Custom title (show = true, titleName = 'Custom Title')
      const customTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: 'Custom Scatter Chart',
        },
      };

      const customTitleResult = createTwoMetricScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult.title).toBe('Custom Scatter Chart');
    });

    it('should respect tooltip settings', () => {
      const stylesWithHiddenTooltip = {
        ...mockStyles,
        tooltipOptions: {
          mode: 'hidden' as 'hidden',
        },
      };

      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.X]: mockNumericalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[1],
      };

      const result = createTwoMetricScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        stylesWithHiddenTooltip,
        mockAxisColumnMappings
      );

      const markLayer = result.layer[0];
      expect(markLayer).toHaveProperty('mark.tooltip', false);
    });

    it('should apply point shape, angle, and filled settings', () => {
      const stylesWithCustomPoint = {
        ...mockStyles,
        exclusive: {
          pointShape: PointShape.SQUARE,
          angle: 45,
          filled: true,
        },
      };

      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.X]: mockNumericalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[1],
      };

      const result = createTwoMetricScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        stylesWithCustomPoint,
        mockAxisColumnMappings
      );

      const markLayer = result.layer[0];
      expect(markLayer).toHaveProperty('mark.shape', PointShape.SQUARE);
      expect(markLayer).toHaveProperty('mark.angle', 45);
      expect(markLayer).toHaveProperty('mark.filled', true);
    });

    it('should apply grid settings', () => {
      const stylesWithoutGrid = {
        ...mockStyles,
        standardAxes: mockStyles.standardAxes?.map((axis) => ({
          ...axis,
          grid: { showLines: false },
        })),
      };

      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.X]: mockNumericalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[1],
      };

      const result = createTwoMetricScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        stylesWithoutGrid,
        mockAxisColumnMappings
      );

      const markLayer = result.layer[0];
      expect(markLayer.encoding.x.axis).toHaveProperty('grid', false);
      expect(markLayer.encoding.y.axis).toHaveProperty('grid', false);
    });
  });

  describe('createTwoMetricOneCateScatter', () => {
    it('should create a scatter chart with two metrics and one categorical column for color', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.X]: mockNumericalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[1],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
      };

      const result = createTwoMetricOneCateScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        mockStyles,
        mockAxisColumnMappings
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('data.values', mockTransformedData);
      expect(result).toHaveProperty('layer');
      expect(Array.isArray(result.layer)).toBe(true);

      // Verify the mark layer
      const markLayer = result.layer[0];
      expect(markLayer).toHaveProperty('mark.type', 'point');
      expect(markLayer).toHaveProperty('mark.tooltip', true);

      // Verify encoding
      expect(markLayer).toHaveProperty('encoding.x.field', 'x');
      expect(markLayer).toHaveProperty('encoding.x.type', 'quantitative');
      expect(markLayer).toHaveProperty('encoding.y.field', 'y');
      expect(markLayer).toHaveProperty('encoding.y.type', 'quantitative');
      expect(markLayer).toHaveProperty('encoding.color.field', 'category');
      expect(markLayer).toHaveProperty('encoding.color.type', 'nominal');
    });

    it('should handle different title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.X]: mockNumericalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[1],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
      };

      // Case 1: No title (show = false)
      const noTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: false,
          titleName: '',
        },
      };

      const noTitleResult = createTwoMetricOneCateScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        noTitleStyles,
        mockAxisColumnMappings
      );
      expect(noTitleResult.title).toBeUndefined();

      // Case 2: Default title (show = true, titleName = '')
      const defaultTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: '',
        },
      };

      const defaultTitleResult = createTwoMetricOneCateScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult.title).toBe('X Value with Y Value by Category');

      // Case 3: Custom title (show = true, titleName = 'Custom Title')
      const customTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: 'Custom Colored Scatter Chart',
        },
      };

      const customTitleResult = createTwoMetricOneCateScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult.title).toBe('Custom Colored Scatter Chart');
    });

    it('should include legend when addLegend is true', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.X]: mockNumericalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[1],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
      };

      const result = createTwoMetricOneCateScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        mockStyles,
        mockAxisColumnMappings
      );

      const markLayer = result.layer[0];
      expect(markLayer.encoding.color.legend).toBeDefined();
      expect(markLayer.encoding.color.legend).toHaveProperty('title', 'Category');
      expect(markLayer.encoding.color.legend).toHaveProperty('orient', Positions.RIGHT);
    });

    it('should not include legend when addLegend is false', () => {
      const stylesWithoutLegend = {
        ...mockStyles,
        addLegend: false,
      };

      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.X]: mockNumericalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[1],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
      };

      const result = createTwoMetricOneCateScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        stylesWithoutLegend,
        mockAxisColumnMappings
      );

      const markLayer = result.layer[0];
      expect(markLayer.encoding.color.legend).toBeNull();
    });
  });

  describe('createThreeMetricOneCateScatter', () => {
    it('should create a scatter chart with three metrics and one categorical column', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.X]: mockNumericalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[1],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
        [AxisRole.SIZE]: mockNumericalColumns[2],
      };

      const result = createThreeMetricOneCateScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        mockStyles,
        mockAxisColumnMappings
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('data.values', mockTransformedData);
      expect(result).toHaveProperty('layer');
      expect(Array.isArray(result.layer)).toBe(true);

      // Verify the mark layer
      const markLayer = result.layer[0];
      expect(markLayer).toHaveProperty('mark.type', 'point');
      expect(markLayer).toHaveProperty('mark.tooltip', true);

      // Verify encoding
      expect(markLayer).toHaveProperty('encoding.x.field', 'x');
      expect(markLayer).toHaveProperty('encoding.x.type', 'quantitative');
      expect(markLayer).toHaveProperty('encoding.y.field', 'y');
      expect(markLayer).toHaveProperty('encoding.y.type', 'quantitative');
      expect(markLayer).toHaveProperty('encoding.color.field', 'category');
      expect(markLayer).toHaveProperty('encoding.color.type', 'nominal');
      expect(markLayer).toHaveProperty('encoding.size.field', 'size');
      expect(markLayer).toHaveProperty('encoding.size.type', 'quantitative');
    });

    it('should handle different title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.X]: mockNumericalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[1],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
        [AxisRole.SIZE]: mockNumericalColumns[2],
      };

      // Case 1: No title (show = false)
      const noTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: false,
          titleName: '',
        },
      };

      const noTitleResult = createThreeMetricOneCateScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        noTitleStyles,
        mockAxisColumnMappings
      );
      expect(noTitleResult.title).toBeUndefined();

      // Case 2: Default title (show = true, titleName = '')
      const defaultTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: '',
        },
      };

      const defaultTitleResult = createThreeMetricOneCateScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult.title).toBe('X Value with Y Value by Category (Size shows Size)');

      // Case 3: Custom title (show = true, titleName = 'Custom Title')
      const customTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: 'Custom Sized Scatter Chart',
        },
      };

      const customTitleResult = createThreeMetricOneCateScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult.title).toBe('Custom Sized Scatter Chart');
    });

    it('should include size legend when addLegend is true', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.X]: mockNumericalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[1],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
        [AxisRole.SIZE]: mockNumericalColumns[2],
      };

      const result = createThreeMetricOneCateScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        mockStyles,
        mockAxisColumnMappings
      );

      const markLayer = result.layer[0];
      expect(markLayer.encoding.size.legend).toBeDefined();
      expect(markLayer.encoding.size.legend).toHaveProperty('title', 'Size');
      expect(markLayer.encoding.size.legend).toHaveProperty('orient', Positions.RIGHT);
    });

    it('should not include size legend when addLegend is false', () => {
      const stylesWithoutLegend = {
        ...mockStyles,
        addLegend: false,
      };

      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.X]: mockNumericalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[1],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
        [AxisRole.SIZE]: mockNumericalColumns[2],
      };

      const result = createThreeMetricOneCateScatter(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        stylesWithoutLegend,
        mockAxisColumnMappings
      );

      const markLayer = result.layer[0];
      expect(markLayer.encoding.size.legend).toBeNull();
    });
  });
});
