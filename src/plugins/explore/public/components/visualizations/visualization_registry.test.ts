/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationRegistry } from './visualization_registry';
import { AxisRole, VisColumn, VisFieldType } from './types';
import { VisualizationType, VisRule } from './utils/use_visualization_types';

describe('VisualizationRegistry', () => {
  let registry: VisualizationRegistry;

  const makeRule = (
    priority: number,
    mappings: Array<Partial<Record<string, { type: VisFieldType; multi?: boolean }>>>
  ): VisRule<any> => ({
    priority,
    mappings,
    render: jest.fn(),
  });

  const makeVisType = (
    type: string,
    name: string,
    rules: Array<VisRule<any>>
  ): VisualizationType<any> => ({
    type: type as any,
    name,
    icon: `vis${name}`,
    getRules: () => rules,
    ui: {
      style: {
        defaults: {} as any,
        render: jest.fn() as any,
      },
    },
  });

  beforeEach(() => {
    registry = new VisualizationRegistry();
  });

  describe('registerVisualization', () => {
    it('should register a single visualization', () => {
      const lineVis = makeVisType('line', 'Line', []);
      registry.registerVisualization(lineVis);
      expect(registry.getVisualization('line')).toBe(lineVis);
    });

    it('should register multiple visualizations at once', () => {
      const lineVis = makeVisType('line', 'Line', []);
      const barVis = makeVisType('bar', 'Bar', []);
      registry.registerVisualization([lineVis, barVis]);
      expect(registry.getVisualization('line')).toBe(lineVis);
      expect(registry.getVisualization('bar')).toBe(barVis);
    });

    it('should not overwrite an existing visualization with the same type', () => {
      const lineVis1 = makeVisType('line', 'Line v1', []);
      const lineVis2 = makeVisType('line', 'Line v2', []);
      registry.registerVisualization(lineVis1);
      registry.registerVisualization(lineVis2);
      expect(registry.getVisualization('line')?.name).toBe('Line v1');
    });
  });

  describe('getAvailableChartTypes', () => {
    it('should return metadata for all registered visualizations', () => {
      registry.registerVisualization(makeVisType('line', 'Line', []));
      registry.registerVisualization(makeVisType('bar', 'Bar', []));

      const chartTypes = registry.getAvailableChartTypes();
      expect(chartTypes).toHaveLength(2);
      expect(chartTypes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'line', name: 'Line' }),
          expect.objectContaining({ type: 'bar', name: 'Bar' }),
        ])
      );
    });

    it('should return empty array when no visualizations registered', () => {
      expect(registry.getAvailableChartTypes()).toEqual([]);
    });
  });

  describe('findRulesByColumns', () => {
    const numCol: VisColumn = {
      id: 1,
      name: 'value',
      schema: VisFieldType.Numerical,
      column: 'value',
      validValuesCount: 1,
      uniqueValuesCount: 1,
    };
    const catCol: VisColumn = {
      id: 2,
      name: 'category',
      schema: VisFieldType.Categorical,
      column: 'category',
      validValuesCount: 1,
      uniqueValuesCount: 1,
    };
    const dateCol: VisColumn = {
      id: 3,
      name: 'timestamp',
      schema: VisFieldType.Date,
      column: 'timestamp',
      validValuesCount: 1,
      uniqueValuesCount: 1,
    };

    it('should return exact matches when column counts match rule mappings', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Categorical },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ]);
      registry.registerVisualization(makeVisType('bar', 'Bar', [rule]));

      const result = registry.findRulesByColumns([numCol], [catCol], []);
      expect(result.exact).toHaveLength(1);
      expect(result.exact[0].visType).toBe('bar');
      expect(result.exact[0].rules).toContain(rule);
    });

    it('should return compatible matches when columns are a superset', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ]);
      registry.registerVisualization(makeVisType('metric', 'Metric', [rule]));

      // Providing extra categorical column — compatible but not exact
      const result = registry.findRulesByColumns([numCol], [catCol], []);
      expect(result.all).toHaveLength(1);
      expect(result.exact).toHaveLength(0);
    });

    it('should filter by chartType when provided', () => {
      const barRule = makeRule(100, [{ [AxisRole.Y]: { type: VisFieldType.Numerical } }]);
      const lineRule = makeRule(100, [{ [AxisRole.Y]: { type: VisFieldType.Numerical } }]);
      registry.registerVisualization(makeVisType('bar', 'Bar', [barRule]));
      registry.registerVisualization(makeVisType('line', 'Line', [lineRule]));

      const result = registry.findRulesByColumns([numCol], [], [], 'bar');
      expect(result.exact).toHaveLength(1);
      expect(result.exact[0].visType).toBe('bar');
    });

    it('should return empty results when no rules match', () => {
      const rule = makeRule(100, [{ [AxisRole.Y]: { type: VisFieldType.Date } }]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      const result = registry.findRulesByColumns([numCol], [], []);
      expect(result.all).toHaveLength(0);
      expect(result.exact).toHaveLength(0);
    });

    it('should return exact match for multi axis as sole consumer of its type', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      const numCol2: VisColumn = { ...numCol, id: 4, name: 'value2', column: 'value2' };
      const result = registry.findRulesByColumns([numCol, numCol2], [], [dateCol]);
      expect(result.exact).toHaveLength(1);
      expect(result.exact[0].visType).toBe('line');
    });

    it('should not return exact match when multi and fixed axes share the same type', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Numerical },
          [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      const numCol2: VisColumn = { ...numCol, id: 4, name: 'value2', column: 'value2' };
      const numCol3: VisColumn = { ...numCol, id: 5, name: 'value3', column: 'value3' };
      const result = registry.findRulesByColumns([numCol, numCol2, numCol3], [], []);
      expect(result.all).toHaveLength(1);
      expect(result.exact).toHaveLength(0);
    });

    it('should return compatible match for multi axis with sufficient columns', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      const numCol2: VisColumn = { ...numCol, id: 4, name: 'value2', column: 'value2' };
      // Extra categorical column means not exact, but still compatible
      const result = registry.findRulesByColumns([numCol, numCol2], [catCol], [dateCol]);
      expect(result.all).toHaveLength(1);
      expect(result.exact).toHaveLength(0);
    });

    it('should not match multi axis when no columns of that type are available', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      const result = registry.findRulesByColumns([], [], [dateCol]);
      expect(result.all).toHaveLength(0);
      expect(result.exact).toHaveLength(0);
    });
  });

  describe('findBestMatch', () => {
    const numCol: VisColumn = {
      id: 1,
      name: 'value',
      schema: VisFieldType.Numerical,
      column: 'value',
      validValuesCount: 1,
      uniqueValuesCount: 1,
    };

    it('should return null when no rules match', () => {
      registry.registerVisualization(makeVisType('line', 'Line', []));
      expect(registry.findBestMatch([numCol], [], [])).toBeNull();
    });

    it('should select the highest priority rule', () => {
      const lowPriority = makeRule(50, [{ [AxisRole.Y]: { type: VisFieldType.Numerical } }]);
      const highPriority = makeRule(100, [{ [AxisRole.Y]: { type: VisFieldType.Numerical } }]);
      registry.registerVisualization(makeVisType('bar', 'Bar', [lowPriority, highPriority]));

      const result = registry.findBestMatch([numCol], [], []);
      expect(result?.rule).toBe(highPriority);
      expect(result?.chartType).toBe('bar');
    });

    it('should select highest priority across visualization types', () => {
      const barRule = makeRule(50, [{ [AxisRole.Y]: { type: VisFieldType.Numerical } }]);
      const lineRule = makeRule(100, [{ [AxisRole.Y]: { type: VisFieldType.Numerical } }]);
      registry.registerVisualization(makeVisType('bar', 'Bar', [barRule]));
      registry.registerVisualization(makeVisType('line', 'Line', [lineRule]));

      const result = registry.findBestMatch([numCol], [], []);
      expect(result?.rule).toBe(lineRule);
      expect(result?.chartType).toBe('line');
    });

    it('should filter by chartType when provided', () => {
      const barRule = makeRule(50, [{ [AxisRole.Y]: { type: VisFieldType.Numerical } }]);
      const lineRule = makeRule(100, [{ [AxisRole.Y]: { type: VisFieldType.Numerical } }]);
      registry.registerVisualization(makeVisType('bar', 'Bar', [barRule]));
      registry.registerVisualization(makeVisType('line', 'Line', [lineRule]));

      const result = registry.findBestMatch([numCol], [], [], 'bar');
      expect(result?.rule).toBe(barRule);
      expect(result?.chartType).toBe('bar');
    });
  });

  describe('getAxesMappingByRule', () => {
    it('should map columns to axis roles based on rule mapping', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Categorical },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ]);

      const numCol: VisColumn = {
        id: 1,
        name: 'count',
        schema: VisFieldType.Numerical,
        column: 'count',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      };
      const catCol: VisColumn = {
        id: 2,
        name: 'category',
        schema: VisFieldType.Categorical,
        column: 'category',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      };

      const result = registry.getAxesMappingByRule(rule, [numCol], [catCol], []);
      expect(result).toEqual({
        [AxisRole.X]: 'category',
        [AxisRole.Y]: 'count',
      });
    });

    it('should return empty object when columns are insufficient', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ]);

      const result = registry.getAxesMappingByRule(rule, [], [], []);
      expect(result).toEqual({});
    });

    it('should assign all columns of a type to a multi axis', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
        },
      ]);

      const numCol1: VisColumn = {
        id: 1,
        name: 'revenue',
        schema: VisFieldType.Numerical,
        column: 'revenue',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      };
      const numCol2: VisColumn = {
        id: 2,
        name: 'cost',
        schema: VisFieldType.Numerical,
        column: 'cost',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      };
      const dateCol: VisColumn = {
        id: 3,
        name: 'timestamp',
        schema: VisFieldType.Date,
        column: 'timestamp',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      };

      const result = registry.getAxesMappingByRule(rule, [numCol1, numCol2], [], [dateCol]);
      expect(result).toEqual({
        [AxisRole.X]: 'timestamp',
        [AxisRole.Y]: ['revenue', 'cost'],
      });
    });

    it('should return empty object when multi axis has no columns available', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
        },
      ]);

      const dateCol: VisColumn = {
        id: 1,
        name: 'timestamp',
        schema: VisFieldType.Date,
        column: 'timestamp',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      };

      const result = registry.getAxesMappingByRule(rule, [], [], [dateCol]);
      expect(result).toEqual({});
    });
  });

  describe('findRuleByAxesMapping', () => {
    const numCol: VisColumn = {
      id: 1,
      name: 'value',
      schema: VisFieldType.Numerical,
      column: 'value',
      validValuesCount: 1,
      uniqueValuesCount: 1,
    };
    const catCol: VisColumn = {
      id: 2,
      name: 'category',
      schema: VisFieldType.Categorical,
      column: 'category',
      validValuesCount: 1,
      uniqueValuesCount: 1,
    };
    const dateCol: VisColumn = {
      id: 3,
      name: 'timestamp',
      schema: VisFieldType.Date,
      column: 'timestamp',
      validValuesCount: 1,
      uniqueValuesCount: 1,
    };
    const allColumns = [numCol, catCol, dateCol];

    it('should return the matching rule when axes mapping matches exactly', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Categorical },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ]);
      registry.registerVisualization(makeVisType('bar', 'Bar', [rule]));

      const result = registry.findRuleByAxesMapping(
        'bar',
        { [AxisRole.X]: 'category', [AxisRole.Y]: 'value' },
        allColumns
      );
      expect(result).toBe(rule);
    });

    it('should return undefined when field types do not match', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      // Passing a categorical column for X, but rule expects date
      const result = registry.findRuleByAxesMapping(
        'line',
        { [AxisRole.X]: 'category', [AxisRole.Y]: 'value' },
        allColumns
      );
      expect(result).toBeUndefined();
    });

    it('should return undefined when axis count differs', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Categorical },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ]);
      registry.registerVisualization(makeVisType('bar', 'Bar', [rule]));

      // Only one axis provided, rule requires two
      const result = registry.findRuleByAxesMapping('bar', { [AxisRole.Y]: 'value' }, allColumns);
      expect(result).toBeUndefined();
    });

    it('should return undefined when a column is not found in allColumns', () => {
      const rule = makeRule(100, [{ [AxisRole.Y]: { type: VisFieldType.Numerical } }]);
      registry.registerVisualization(makeVisType('metric', 'Metric', [rule]));

      const result = registry.findRuleByAxesMapping(
        'metric',
        { [AxisRole.Y]: 'nonexistent_column' },
        allColumns
      );
      expect(result).toBeUndefined();
    });

    it('should return undefined for an unregistered chart type', () => {
      const result = registry.findRuleByAxesMapping(
        'unknown_chart',
        { [AxisRole.Y]: 'value' },
        allColumns
      );
      expect(result).toBeUndefined();
    });

    it('should return undefined when axesMapping is empty', () => {
      const rule = makeRule(100, [{ [AxisRole.Y]: { type: VisFieldType.Numerical } }]);
      registry.registerVisualization(makeVisType('metric', 'Metric', [rule]));

      const result = registry.findRuleByAxesMapping('metric', {}, allColumns);
      expect(result).toBeUndefined();
    });

    it('should match against the correct mapping in a rule with multiple mappings', () => {
      const rule = makeRule(100, [
        // First mapping: date + numerical
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
        // Second mapping: categorical + numerical
        {
          [AxisRole.X]: { type: VisFieldType.Categorical },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ]);
      registry.registerVisualization(makeVisType('bar', 'Bar', [rule]));

      const result = registry.findRuleByAxesMapping(
        'bar',
        { [AxisRole.X]: 'category', [AxisRole.Y]: 'value' },
        allColumns
      );
      expect(result).toBe(rule);
    });

    it('should match a multi axis rule when multiple fields are provided', () => {
      const numCol2: VisColumn = {
        id: 4,
        name: 'value2',
        schema: VisFieldType.Numerical,
        column: 'value2',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      };
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      const result = registry.findRuleByAxesMapping(
        'line',
        { [AxisRole.X]: 'timestamp', [AxisRole.Y]: ['value', 'value2'] },
        [...allColumns, numCol2]
      );
      expect(result).toBe(rule);
    });

    it('should match a multi rule when single field is provided', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      const result = registry.findRuleByAxesMapping(
        'line',
        { [AxisRole.X]: 'timestamp', [AxisRole.Y]: 'value' },
        allColumns
      );
      expect(result).toBe(rule);
    });

    it('should not match a single-field rule when multiple fields are provided', () => {
      const numCol2: VisColumn = {
        id: 4,
        name: 'value2',
        schema: VisFieldType.Numerical,
        column: 'value2',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      };
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      const result = registry.findRuleByAxesMapping(
        'line',
        { [AxisRole.X]: 'timestamp', [AxisRole.Y]: ['value', 'value2'] },
        [...allColumns, numCol2]
      );
      expect(result).toBeUndefined();
    });

    it('should return undefined when multi field types are mixed', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      const result = registry.findRuleByAxesMapping(
        'line',
        { [AxisRole.Y]: ['value', 'category'] },
        allColumns
      );
      expect(result).toBeUndefined();
    });
  });

  describe('getVisualization', () => {
    it('should return undefined for unregistered type', () => {
      expect(registry.getVisualization('nonexistent')).toBeUndefined();
    });
  });

  describe('reuseAxesMapping', () => {
    const col = (name: string, schema: VisFieldType, id = 0): VisColumn => ({
      id,
      name,
      schema,
      column: name,
      validValuesCount: 10,
      uniqueValuesCount: 5,
    });

    it('should return the saved mapping when all fields still exist and types match', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      const allColumns = [
        col('timestamp', VisFieldType.Date),
        col('bytes', VisFieldType.Numerical),
      ];
      const result = registry.reuseAxesMapping(
        'line',
        { [AxisRole.X]: 'timestamp', [AxisRole.Y]: 'bytes' },
        allColumns
      );
      expect(result).toEqual({ [AxisRole.X]: 'timestamp', [AxisRole.Y]: 'bytes' });
    });

    it('should replace a missing field with an unused column of the same type', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      // "bytes" is gone, "memory" is available
      const allColumns = [
        col('timestamp', VisFieldType.Date),
        col('memory', VisFieldType.Numerical),
      ];
      const result = registry.reuseAxesMapping(
        'line',
        { [AxisRole.X]: 'timestamp', [AxisRole.Y]: 'bytes' },
        allColumns
      );
      expect(result).toEqual({ [AxisRole.X]: 'timestamp', [AxisRole.Y]: 'memory' });
    });

    it('should return undefined when no replacement column is available', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      // "bytes" is gone and no other Numerical column exists
      const allColumns = [col('timestamp', VisFieldType.Date)];
      const result = registry.reuseAxesMapping(
        'line',
        { [AxisRole.X]: 'timestamp', [AxisRole.Y]: 'bytes' },
        allColumns
      );
      expect(result).toBeUndefined();
    });

    it('should return undefined for an unregistered chart type', () => {
      const result = registry.reuseAxesMapping('unknown', { [AxisRole.Y]: 'value' }, [
        col('value', VisFieldType.Numerical),
      ]);
      expect(result).toBeUndefined();
    });

    it('should return undefined when no rule matches the saved role keys', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      // Saved mapping has roles that don't match any rule
      const allColumns = [
        col('timestamp', VisFieldType.Date),
        col('bytes', VisFieldType.Numerical),
      ];
      const result = registry.reuseAxesMapping('line', { a: 'timestamp', b: 'bytes' }, allColumns);
      expect(result).toBeUndefined();
    });

    it('should use surviving field types to disambiguate rules with same key structure', () => {
      const ruleCategoricalColor = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
          [AxisRole.COLOR]: { type: VisFieldType.Categorical },
        },
      ]);
      const ruleNumericalColor = makeRule(80, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
          [AxisRole.COLOR]: { type: VisFieldType.Numerical },
        },
      ]);
      registry.registerVisualization(
        makeVisType('line', 'Line', [ruleCategoricalColor, ruleNumericalColor])
      );

      // COLOR field "status" is Categorical → should match ruleCategoricalColor
      // Y field "bytes" is gone → replaced by "memory"
      const allColumns = [
        col('timestamp', VisFieldType.Date),
        col('memory', VisFieldType.Numerical),
        col('status', VisFieldType.Categorical),
      ];
      const result = registry.reuseAxesMapping(
        'line',
        { [AxisRole.X]: 'timestamp', [AxisRole.Y]: 'bytes', [AxisRole.COLOR]: 'status' },
        allColumns
      );
      expect(result).toEqual({
        [AxisRole.X]: 'timestamp',
        [AxisRole.Y]: 'memory',
        [AxisRole.COLOR]: 'status',
      });
    });

    it('should not let a replacement steal a surviving fields column', () => {
      // Regression: if y's field is gone, it should not claim color's surviving field
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
          [AxisRole.COLOR]: { type: VisFieldType.Numerical },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      // "bytes" (Y) is gone; "count" (COLOR) survives; "memory" is available
      const allColumns = [
        col('timestamp', VisFieldType.Date),
        col('count', VisFieldType.Numerical),
        col('memory', VisFieldType.Numerical),
      ];
      const result = registry.reuseAxesMapping(
        'line',
        { [AxisRole.X]: 'timestamp', [AxisRole.Y]: 'bytes', [AxisRole.COLOR]: 'count' },
        allColumns
      );
      expect(result).toEqual({
        [AxisRole.X]: 'timestamp',
        [AxisRole.Y]: 'memory',
        [AxisRole.COLOR]: 'count',
      });
    });

    it('should return undefined when a surviving field has a type mismatch with the rule', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      // "bytes" still exists but is now Categorical instead of Numerical
      const allColumns = [
        col('timestamp', VisFieldType.Date),
        col('bytes', VisFieldType.Categorical),
      ];
      const result = registry.reuseAxesMapping(
        'line',
        { [AxisRole.X]: 'timestamp', [AxisRole.Y]: 'bytes' },
        allColumns
      );
      expect(result).toBeUndefined();
    });

    it('should handle all fields missing and find replacements', () => {
      const rule = makeRule(100, [
        {
          [AxisRole.X]: { type: VisFieldType.Date },
          [AxisRole.Y]: { type: VisFieldType.Numerical },
        },
      ]);
      registry.registerVisualization(makeVisType('line', 'Line', [rule]));

      // Both saved fields are gone, but matching types are available
      const allColumns = [
        col('new_date', VisFieldType.Date),
        col('new_num', VisFieldType.Numerical),
      ];
      const result = registry.reuseAxesMapping(
        'line',
        { [AxisRole.X]: 'old_date', [AxisRole.Y]: 'old_num' },
        allColumns
      );
      expect(result).toEqual({ [AxisRole.X]: 'new_date', [AxisRole.Y]: 'new_num' });
    });
  });
});
