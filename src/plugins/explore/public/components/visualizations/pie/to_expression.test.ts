/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createPieSpec } from './to_expression';
import {
  VisColumn,
  VisFieldType,
  Positions,
  TooltipOptions,
  AxisRole,
  AxisColumnMappings,
} from '../types';
import { defaultPieChartStyles, PieChartStyle } from './pie_vis_config';

jest.mock('../utils/utils', () => {
  const actual = jest.requireActual('../utils/utils');
  return {
    ...actual,
    getChartRender: jest.fn().mockReturnValue('vega'),
  };
});

describe('to_expression', () => {
  // Sample data for testing
  const transformedData = [
    { 'field-1': 100, 'field-2': 'Category A' },
    { 'field-1': 200, 'field-2': 'Category B' },
  ];

  const numericColumn: VisColumn = {
    id: 1,
    name: 'value',
    schema: VisFieldType.Numerical,
    column: 'field-1',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const categoricalColumn: VisColumn = {
    id: 2,
    name: 'category',
    schema: VisFieldType.Categorical,
    column: 'field-2',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const defaultStyleOptions: PieChartStyle = {
    ...defaultPieChartStyles,
    addLegend: true,
    legendPosition: Positions.RIGHT,
    tooltipOptions: {
      mode: 'all' as TooltipOptions['mode'],
    },
    exclusive: {
      donut: false,
      showLabels: true,
      showValues: false,
      truncate: 100,
    },
  };

  describe('createPieSpec', () => {
    it('should create a basic pie chart specification', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const result = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        defaultStyleOptions,
        mockAxisColumnMappings
      );

      // Verify the result structure
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('data.values', transformedData);
      expect(result).toHaveProperty('layer');
      // @ts-expect-error TS18048 TODO(ts-error): fixme
      expect(result.layer).toHaveLength(3); // Main layer + label layer (no value layer) + hover state layer

      // Verify the main layer (arc mark)
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('mark.type', 'arc');
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('mark.innerRadius', 0); // Not a donut
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('mark.tooltip', true);

      // Verify the label layer
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[2]).toHaveProperty('mark.type', 'text');
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[2]).toHaveProperty('encoding.text.field', 'field-2');

      // Verify the encoding
      expect(result).toHaveProperty('encoding.theta.field', 'field-1');
      expect(result).toHaveProperty('encoding.color.field', 'field-2');
      expect(result).toHaveProperty('encoding.color.legend.orient', Positions.RIGHT);
    });

    it('should handle different title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      // Case 1: No title (show = false)
      const noTitleStyles = {
        ...defaultStyleOptions,
        titleOptions: {
          show: false,
          titleName: '',
        },
      };

      const noTitleResult = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        noTitleStyles,
        mockAxisColumnMappings
      );
      // @ts-expect-error TS18048 TODO(ts-error): fixme
      expect(noTitleResult.title).toBeUndefined();

      // Case 2: Default title (show = true, titleName = '')
      const defaultTitleStyles = {
        ...defaultStyleOptions,
        titleOptions: {
          show: true,
          titleName: '',
        },
      };

      const defaultTitleResult = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      // @ts-expect-error TS18048 TODO(ts-error): fixme
      expect(defaultTitleResult.title).toBe('value by category');

      // Case 3: Custom title (show = true, titleName = 'Custom Title')
      const customTitleStyles = {
        ...defaultStyleOptions,
        titleOptions: {
          show: true,
          titleName: 'Custom Pie Chart',
        },
      };

      const customTitleResult = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        customTitleStyles,
        mockAxisColumnMappings
      );
      // @ts-expect-error TS18048 TODO(ts-error): fixme
      expect(customTitleResult.title).toBe('Custom Pie Chart');
    });

    it('should create a donut chart when donut option is true', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptions = {
        ...defaultStyleOptions,
        exclusive: {
          ...defaultStyleOptions.exclusive,
          donut: true,
        },
      };

      const result = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        styleOptions,
        mockAxisColumnMappings
      );

      // Verify the donut configuration
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('mark.innerRadius', { expr: '7*stepSize' });
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('mark.radius', { expr: '9*stepSize' });
    });

    it('should include value layer when showValues is true', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptions = {
        ...defaultStyleOptions,
        exclusive: {
          ...defaultStyleOptions.exclusive,
          showValues: true,
        },
      };

      const result = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        styleOptions,
        mockAxisColumnMappings
      );

      // Verify the layer count
      // @ts-expect-error TS18048 TODO(ts-error): fixme
      expect(result.layer).toHaveLength(4); // Main layer + label layer + value layer + hover state layer

      // Verify the value layer
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[3]).toHaveProperty('mark.type', 'text');
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[3]).toHaveProperty('encoding.text.field', 'field-1');
    });

    it('should not include label layer when showLabels is false', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptions = {
        ...defaultStyleOptions,
        exclusive: {
          ...defaultStyleOptions.exclusive,
          showLabels: false,
        },
      };

      const result = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        styleOptions,
        mockAxisColumnMappings
      );

      // Verify the layer count
      // @ts-expect-error TS18048 TODO(ts-error): fixme
      expect(result.layer).toHaveLength(2); // main layer + hover state layer

      // Verify the main layer
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('mark.type', 'arc');
    });

    it('should disable tooltip when tooltipOptions.mode is hidden', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptions = {
        ...defaultStyleOptions,
        tooltipOptions: {
          mode: 'hidden' as TooltipOptions['mode'],
        },
      };

      const result = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        styleOptions,
        mockAxisColumnMappings
      );

      // Verify tooltip is disabled
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('mark.tooltip', false);
    });

    it('should apply custom truncate value for labels', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptions = {
        ...defaultStyleOptions,
        exclusive: {
          ...defaultStyleOptions.exclusive,
          truncate: 50,
        },
      };

      const result = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        styleOptions,
        mockAxisColumnMappings
      );

      // Verify the truncate value
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[2]).toHaveProperty('mark.limit', 50);
    });

    it('should not include legend when addLegend is false', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptions = {
        ...defaultStyleOptions,
        addLegend: false,
      };

      const result = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        styleOptions,
        mockAxisColumnMappings
      );

      // Verify legend is null
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.encoding.color.legend).toBeNull();
    });
  });

  describe('edge and error cases', () => {
    it('should handle empty transformedData', () => {
      const result = createPieSpec(
        [],
        [numericColumn],
        [categoricalColumn],
        [],
        defaultStyleOptions,
        { [AxisRole.SIZE]: numericColumn, [AxisRole.COLOR]: categoricalColumn }
      );
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.data.values).toEqual([]);
    });

    it('should handle empty numericalColumns and categoricalColumns', () => {
      const result = createPieSpec(
        [{ 'field-1': 1, 'field-2': 'A' }],
        [],
        [],
        [],
        defaultStyleOptions,
        { [AxisRole.SIZE]: undefined, [AxisRole.COLOR]: undefined }
      );
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.encoding.theta.field).toBeUndefined();
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.encoding.color.field).toBeUndefined();
    });

    it('should handle missing styleOptions fields', () => {
      const partialStyleOptions = {
        addLegend: true,
        legendPosition: Positions.RIGHT,
        exclusive: { donut: false },
      };
      const result = createPieSpec(
        [{ 'field-1': 1, 'field-2': 'A' }],
        [numericColumn],
        [categoricalColumn],
        [],
        partialStyleOptions as any,
        { [AxisRole.SIZE]: numericColumn, [AxisRole.COLOR]: categoricalColumn }
      );
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer.length).toBeGreaterThan(0);
    });

    it('should handle missing axisColumnMappings', () => {
      const result = createPieSpec(
        [{ 'field-1': 1, 'field-2': 'A' }],
        [numericColumn],
        [categoricalColumn],
        [],
        defaultStyleOptions,
        undefined
      );
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.encoding.theta.field).toBeUndefined();
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.encoding.color.field).toBeUndefined();
    });

    it('should handle incomplete axisColumnMappings', () => {
      const result = createPieSpec(
        [{ 'field-1': 1, 'field-2': 'A' }],
        [numericColumn],
        [categoricalColumn],
        [],
        defaultStyleOptions,
        { [AxisRole.SIZE]: numericColumn }
      );
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.encoding.theta.field).toBe('field-1');
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.encoding.color.field).toBeUndefined();
    });
  });
});
