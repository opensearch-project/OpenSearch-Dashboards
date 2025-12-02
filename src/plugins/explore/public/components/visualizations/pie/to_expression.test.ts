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
  ColorModeOption,
} from '../types';
import { defaultPieChartStyles, PieChartStyle } from './pie_vis_config';

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
      expect(result).toHaveProperty('layer');
      expect(result.layer).toHaveLength(3); // Main layer + label layer (no value layer) + hover state layer

      // Verify the main layer (arc mark)
      expect(result.layer[0]).toHaveProperty('mark.type', 'arc');
      expect(result.layer[0]).toHaveProperty('mark.innerRadius', 0); // Not a donut
      expect(result.layer[0]).toHaveProperty('mark.tooltip', true);

      // Verify the label layer
      expect(result.layer[2]).toHaveProperty('mark.type', 'text');
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
      expect(result.layer[0]).toHaveProperty('mark.innerRadius', { expr: '7*stepSize' });
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
      expect(result.layer).toHaveLength(4); // Main layer + label layer + value layer + hover state layer

      // Verify the value layer
      expect(result.layer[3]).toHaveProperty('mark.type', 'text');
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
      expect(result.layer).toHaveLength(2); // main layer + hover state layer

      // Verify the main layer
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
      expect(result.encoding.color.legend).toBeNull();
    });

    it('should use value mapping when valid values exist and colorModeOption is not none', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptionsWithValueMapping: PieChartStyle = {
        ...defaultStyleOptions,
        colorModeOption: 'useValueMapping' as ColorModeOption,
        valueMappingOptions: {
          valueMappings: [
            {
              type: 'value',
              value: '100',
              color: '#ff0000',
              displayText: 'Low Value',
            },
            {
              type: 'value',
              value: '200',
              color: '#00ff00',
              displayText: 'High Value',
            },
          ],
        },
      };

      const result = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        styleOptionsWithValueMapping,
        mockAxisColumnMappings
      );

      // Should use 'mappingValue' field instead of category field
      expect(result.encoding.color.field).toBe('mappingValue');
      expect(result.encoding.color.scale).toBeDefined();
      expect(result.encoding.color.scale.domain).toEqual(['100', '200']);
    });

    it('should use range mapping when valid ranges exist and colorModeOption is not none', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptionsWithRangeMapping: PieChartStyle = {
        ...defaultStyleOptions,
        colorModeOption: 'highlightValueMapping' as ColorModeOption,
        valueMappingOptions: {
          valueMappings: [
            {
              type: 'range',
              range: { min: 50, max: 150 },
              color: '#00ff00',
              displayText: 'Low Range',
            },
            {
              type: 'range',
              range: { min: 150 },
              color: '#ff0000',
              displayText: 'High Range',
            },
          ],
        },
      };

      const result = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        styleOptionsWithRangeMapping,
        mockAxisColumnMappings
      );

      // Should use 'mappingValue' field and include null for highlight mode
      expect(result.encoding.color.field).toBe('mappingValue');
      expect(result.encoding.color.scale).toBeDefined();
      expect(result.encoding.color.scale.domain).toEqual([null, '[50,150)', '[150,∞)']);
    });

    it('should disable value mapping when colorModeOption is none', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptionsWithNoneColorMode: PieChartStyle = {
        ...defaultStyleOptions,
        colorModeOption: 'none' as ColorModeOption,
        valueMappingOptions: {
          valueMappings: [
            {
              type: 'value',
              value: '100',
              color: '#ff0000',
            },
          ],
        },
      };

      const result = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        styleOptionsWithNoneColorMode,
        mockAxisColumnMappings
      );

      // Should use category field, not 'mappingValue'
      expect(result.encoding.color.field).toBe('field-2');
      expect(result.encoding.color.scale).toBeUndefined();
    });

    it('should disable value mapping when no valid mappings exist', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptionsWithInvalidMappings: PieChartStyle = {
        ...defaultStyleOptions,
        colorModeOption: 'useValueMapping' as ColorModeOption,
        valueMappingOptions: {
          valueMappings: [
            {
              type: 'value',
              value: '999', // Value not in data
              color: '#ff0000',
            },
            {
              type: 'range',
              range: { min: 1000, max: 2000 }, // Range not matching data
              color: '#00ff00',
            },
          ],
        },
      };

      const result = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        styleOptionsWithInvalidMappings,
        mockAxisColumnMappings
      );

      // Should use category field since no mappings are valid
      expect(result.encoding.color.field).toBe('field-2');
      expect(result.encoding.color.scale).toBeUndefined();
    });

    it('should handle empty valueMappingOptions', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptionsWithEmptyMappings: PieChartStyle = {
        ...defaultStyleOptions,
        colorModeOption: 'useValueMapping' as ColorModeOption,
        valueMappingOptions: {
          valueMappings: [],
        },
      };

      const result = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        styleOptionsWithEmptyMappings,
        mockAxisColumnMappings
      );

      // Should use category field when mappings are empty
      expect(result.encoding.color.field).toBe('field-2');
      expect(result.encoding.color.scale).toBeUndefined();
    });

    it('should apply correct legend label expression when value mapping is enabled', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptionsWithMapping: PieChartStyle = {
        ...defaultStyleOptions,
        colorModeOption: 'highlightValueMapping' as ColorModeOption,
        valueMappingOptions: {
          valueMappings: [
            {
              type: 'value',
              value: '100',
              color: '#ff0000',
              displayText: 'displayText',
            },
          ],
        },
      };

      const result = createPieSpec(
        transformedData,
        [numericColumn],
        [categoricalColumn],
        [],
        styleOptionsWithMapping,
        mockAxisColumnMappings
      );

      expect(result.encoding.color.legend?.labelExpr).toBeDefined();
      expect(result.encoding.color.legend?.labelExpr).toContain('displayText');
    });

    it('should process data correctly and use newRecord in result', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const testData = [
        { 'field-1': 100, 'field-2': 'Category A' },
        { 'field-1': 10000, 'field-2': 'Category B' },
        { 'field-1': 150, 'field-2': 'Category C' },
      ];

      const styleOptionsWithMapping: PieChartStyle = {
        ...defaultStyleOptions,
        colorModeOption: 'useValueMapping' as ColorModeOption,
        valueMappingOptions: {
          valueMappings: [
            {
              type: 'value',
              value: '100',
              color: '#ff0000',
            },
            {
              type: 'range',
              range: { min: 150, max: 250 },
              color: '#00ff00',
            },
          ],
        },
      };

      const result = createPieSpec(
        testData,
        [numericColumn],
        [categoricalColumn],
        [],
        styleOptionsWithMapping,
        mockAxisColumnMappings
      );

      // Verify that processData was called and newRecord is used
      expect(result.data.values).toHaveLength(3);
      expect(result.data.values.every((record) => 'mergedLabel' in record)).toBe(true);

      // Verify the mapping logic worked
      const record1 = result.data.values.find((r) => r['field-1'] === 100);
      const record2 = result.data.values.find((r) => r['field-1'] === 10000);
      const record3 = result.data.values.find((r) => r['field-1'] === 150);

      expect(record1?.mergedLabel).toBe('100'); // Value mapping
      expect(record2?.mergedLabel).toBe(null); // No matching mapping
      expect(record3?.mergedLabel).toBe('[150,250)'); // Range mapping
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
      expect(result.encoding.theta.field).toBeUndefined();
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
      expect(result.encoding.theta.field).toBeUndefined();
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
      expect(result.encoding.theta.field).toBe('field-1');
      expect(result.encoding.color.field).toBeUndefined();
    });
  });
});
