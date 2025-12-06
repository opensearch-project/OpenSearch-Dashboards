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
      expect(result.layer).toHaveLength(3); // Main layer + label layer (no value layer) + hover state layer

      // Verify the main layer (arc mark)
      expect(result.layer[0]).toHaveProperty('mark.type', 'arc');
      expect(result.layer[0]).toHaveProperty('mark.innerRadius', 0); // Not a donut
      expect(result.layer[0]).toHaveProperty('mark.tooltip', true);

      // Verify the label layer
      const textMark = result.layer[2].layer[3];
      expect(textMark).toHaveProperty('mark.type', 'text');
      expect(textMark).toHaveProperty('encoding.text.field', 'finalLabel');

      // Verify the encoding
      expect(result.layer[0]).toHaveProperty('encoding.theta.field', 'myEnd');
      expect(result.layer[0]).toHaveProperty('encoding.theta2.field', 'myStart');
      expect(result.layer[0]).toHaveProperty('encoding.color.field', 'field-2');
      expect(result.layer[0]).toHaveProperty('encoding.color.legend.orient', Positions.RIGHT);

      // verify params
      expect(result.params).toBeDefined();
      expect(result.params.length).toBe(9);
      const stepSizeParam = result.params.find((p) => p.name === 'stepSize');
      expect(stepSizeParam).toEqual({ name: 'stepSize', expr: 'min(width, height) / 20' });
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
      expect(result.layer[0]).toHaveProperty('mark.innerRadius', {
        expr: 'innerRadius',
      });
      expect(result.layer[0]).toHaveProperty('mark.radius', { expr: 'outerRadius' });
    });

    it('should include both label and value layer when showValues and ShowLabel are true', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptions = {
        ...defaultStyleOptions,
        exclusive: {
          ...defaultStyleOptions.exclusive,
          showValues: true,
          ShowLabel: true,
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

      const labelDisplayParam = result.params.find((p) => p.name === 'labelDisplay');

      expect(labelDisplayParam).toEqual({
        name: 'labelDisplay',
        expr: `true
          ? 'all'
          : true
          ? 'onlyLables'
          : 'onlyValues'`,
      });
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

      const labelDisplayParam = result.params.find((p) => p.name === 'labelDisplay');
      expect(labelDisplayParam).toEqual({
        name: 'labelDisplay',
        expr: `false
          ? 'all'
          : false
          ? 'onlyLables'
          : 'onlyValues'`,
      });
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
      expect(result.layer[2].layer[3]).toHaveProperty('mark.limit', 50);
    });

    it('should have correct labelLayer structure with transforms', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptions = {
        ...defaultStyleOptions,
        exclusive: {
          ...defaultStyleOptions.exclusive,
          showLabels: true,
          showValues: false,
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

      const labelLayer = result.layer[2];

      // Verify transform structure
      expect(labelLayer.transform).toHaveLength(6);
      expect(labelLayer.transform[0]).toHaveProperty(
        'filter',
        'datum.gap_y_prev > labelHeight || datum.gap_y_next >  labelHeight'
      );
      expect(labelLayer.transform[1]).toHaveProperty(
        'calculate',
        'datum.rowNumber === 1 ? true : false'
      );
      expect(labelLayer.transform[1]).toHaveProperty('as', 'isFirst');
    });

    it('should have correct labelLayer sublayers structure', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptions = {
        ...defaultStyleOptions,
        exclusive: {
          ...defaultStyleOptions.exclusive,
          showLabels: true,
          showValues: false,
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

      const labelLayer = result.layer[2];

      // Should have 4 sublayers: 3 rule + 1 text
      expect(labelLayer.layer).toHaveLength(4);

      // First three should be rule marks
      expect(labelLayer.layer[0]).toHaveProperty('mark.type', 'rule');
      expect(labelLayer.layer[1]).toHaveProperty('mark.type', 'rule');
      expect(labelLayer.layer[2]).toHaveProperty('mark.type', 'rule');

      expect(labelLayer.layer[3]).toHaveProperty('mark.type', 'text');
    });

    it('should configure text mark correctly in labelLayer', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptions = {
        ...defaultStyleOptions,
        exclusive: {
          ...defaultStyleOptions.exclusive,
          showLabels: true,
          showValues: false,
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

      const textMark = result.layer[2].layer[3];

      // Verify text mark properties
      expect(textMark.mark).toHaveProperty('baseline', 'middle');
      expect(textMark.mark).toHaveProperty('fontSize', { expr: 'labelHeight' });
      expect(textMark.mark).toHaveProperty('lineHeight', 2);
      expect(textMark.mark).toHaveProperty('align', {
        signal: "datum.side=='left'?'right':'left'",
      });

      // Verify text encoding
      expect(textMark.encoding).toHaveProperty('x.field', 'text_position');
      expect(textMark.encoding).toHaveProperty('y.field', 'path_y_end');
      expect(textMark.encoding).toHaveProperty('text.field', 'finalLabel');
    });

    it('should not include labelLayer when both showLabels and showValues are false', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.SIZE]: numericColumn,
        [AxisRole.COLOR]: categoricalColumn,
      };

      const styleOptions = {
        ...defaultStyleOptions,
        exclusive: {
          ...defaultStyleOptions.exclusive,
          showLabels: false,
          showValues: false,
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

      expect(result.layer).toHaveLength(2);
      expect(result.layer[0]).toHaveProperty('mark.type', 'arc');
      expect(result.layer[1]).toHaveProperty('mark.type', 'arc');
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
      expect(result.layer[0].encoding.color.legend).toBeNull();
    });
  });
});
