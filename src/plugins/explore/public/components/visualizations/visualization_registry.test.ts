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
    mappings: Array<Partial<Record<string, { type: VisFieldType }>>>
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
  });

  describe('getVisualization', () => {
    it('should return undefined for unregistered type', () => {
      expect(registry.getVisualization('nonexistent')).toBeUndefined();
    });
  });
});
