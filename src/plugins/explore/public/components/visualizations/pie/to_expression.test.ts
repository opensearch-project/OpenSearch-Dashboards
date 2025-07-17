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

  const defaultStyleOptions = {
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
      expect(result.layer).toHaveLength(2); // Main layer + label layer (no value layer)

      // Verify the main layer (arc mark)
      expect(result.layer[0]).toHaveProperty('mark.type', 'arc');
      expect(result.layer[0]).toHaveProperty('mark.innerRadius', 0); // Not a donut
      expect(result.layer[0]).toHaveProperty('mark.tooltip', true);

      // Verify the label layer
      expect(result.layer[1]).toHaveProperty('mark.type', 'text');
      expect(result.layer[1]).toHaveProperty('encoding.text.field', 'field-2');

      // Verify the encoding
      expect(result).toHaveProperty('encoding.theta.field', 'field-1');
      expect(result).toHaveProperty('encoding.color.field', 'field-2');
      expect(result).toHaveProperty('encoding.color.legend.orient', Positions.RIGHT);
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
      expect(result.layer[0]).toHaveProperty('mark.innerRadius', 30);
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
      expect(result.layer).toHaveLength(3); // Main layer + label layer + value layer

      // Verify the value layer
      expect(result.layer[2]).toHaveProperty('mark.type', 'text');
      expect(result.layer[2]).toHaveProperty('encoding.text.field', 'field-1');
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
      expect(result.layer).toHaveLength(1); // Only main layer

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
      expect(result.layer[1]).toHaveProperty('mark.limit', 50);
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
  });
});
