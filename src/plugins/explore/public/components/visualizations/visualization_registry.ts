/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisRole, ChartMetadata, VisColumn, VisFieldType } from './types';
import { VisualizationType, VisRule } from './utils/use_visualization_types';
import { getColumnsByAxesMapping } from './visualization_builder_utils';

interface MatchedVisRules {
  visType: string;
  rules: Array<VisRule<any>>;
}

interface FindRulesByColumnsResult {
  /** Rules where required field counts <= input counts (superset, includes exact) */
  all: MatchedVisRules[];
  /** Rules where required field counts === input counts exactly */
  exact: MatchedVisRules[];
}

/**
 * Registry for visualization rules and configurations.
 * This class is designed to be used as a service that can be accessed by other plugins.
 */
export class VisualizationRegistry {
  private visualizations: Map<string, VisualizationType<any>> = new Map();

  constructor() {}

  /**
   * Get all available chart types based on registered visualizations
   */
  getAvailableChartTypes() {
    const availableChartTypes: ChartMetadata[] = [];
    for (const [, vis] of this.visualizations) {
      if (availableChartTypes.every((t) => t.type !== vis.type)) {
        availableChartTypes.push({
          type: vis.type,
          name: vis.name,
          icon: vis.icon ?? '',
        });
      }
    }
    return availableChartTypes;
  }

  getAxesMappingByRule(
    rule: VisRule<any>,
    numericalColumns: VisColumn[],
    categoricalColumns: VisColumn[],
    dateColumns: VisColumn[]
  ) {
    let result: Record<string, string> = {};
    const mapping = rule.mappings[0] || {};
    numericalColumns = [...numericalColumns];
    categoricalColumns = [...categoricalColumns];
    dateColumns = [...dateColumns];

    for (const [axisRole, { type }] of Object.entries(mapping)) {
      let column: VisColumn | undefined;
      if (type === VisFieldType.Categorical) {
        column = categoricalColumns.shift();
      }
      if (type === VisFieldType.Numerical) {
        column = numericalColumns.shift();
      }
      if (type === VisFieldType.Date) {
        column = dateColumns.shift();
      }
      // No available column fits the mapping, cannot create axis mapping for the given columns
      if (!column) {
        result = {};
        break;
      }
      result[axisRole] = column.name;
    }
    return result;
  }

  public findRuleByAxesMapping(
    chartType: string,
    axesMapping: Partial<Record<string, string>>,
    allColumns: VisColumn[]
  ) {
    const { numericalColumns, categoricalColumns, dateColumns } = getColumnsByAxesMapping(
      axesMapping,
      allColumns
    );
    const bestMatch = this.findBestMatch(
      numericalColumns,
      categoricalColumns,
      dateColumns,
      chartType
    );
    return bestMatch?.rule;
  }

  /**
   * Recomputes the axes-to-column mapping for a new chart type using the currently
   * mapped columns. Classifies columns by field type, finds the best-matching rule
   * for the target chart type via `findBestMatch`, then builds a new axis mapping
   * via `getAxesMappingByRule`. Returns an empty object if no rule matches.
   */
  public updateAxesMappingByChartType(
    chartType: string,
    axesMapping: Partial<Record<string, string>>,
    allColumns: VisColumn[]
  ): Record<string, string> {
    const { numericalColumns, categoricalColumns, dateColumns } = getColumnsByAxesMapping(
      axesMapping,
      allColumns
    );
    const bestMatch = this.findBestMatch(
      numericalColumns,
      categoricalColumns,
      dateColumns,
      chartType
    );

    if (!bestMatch) {
      return {};
    }
    return this.getAxesMappingByRule(
      bestMatch.rule,
      numericalColumns,
      categoricalColumns,
      dateColumns
    );
  }

  /**
   * Returns the highest-priority rule with an exact column-count match, optionally
   * scoped to a specific `chartType`. Returns `null` if no exact match exists.
   */
  public findBestMatch(
    numericalColumns: VisColumn[],
    categoricalColumns: VisColumn[],
    dateColumns: VisColumn[],
    chartType?: string
  ) {
    const { exact } = this.findRulesByColumns(
      numericalColumns,
      categoricalColumns,
      dateColumns,
      chartType
    );
    const matchedVisRules = chartType ? exact.filter((r) => r.visType === chartType) : exact;

    let bestRule: VisRule<any> | null = null;
    let bestChartType: string | null = null;
    for (const matched of matchedVisRules) {
      for (const r of matched.rules) {
        if (!bestRule) {
          bestRule = r;
          bestChartType = matched.visType;
        } else if (r.priority > bestRule?.priority) {
          bestRule = r;
          bestChartType = matched.visType;
        }
      }
    }

    if (bestRule && bestChartType) {
      return { rule: bestRule, chartType: bestChartType };
    }
    return null;
  }

  /**
   * Finds matching VisRules by comparing each mapping's required field counts against
   * the given column counts. Optionally filters by `chartType`. Results grouped by vis type:
   * - `all`: rules with at least one compatible mapping (required <= available per type).
   * - `exact`: subset of `all` with at least one exact-match mapping (required === available).
   */
  public findRulesByColumns(
    numericalColumns: VisColumn[],
    categoricalColumns: VisColumn[],
    dateColumns: VisColumn[],
    chartType?: string
  ): FindRulesByColumnsResult {
    const allMap = new Map<string, Array<VisRule<any>>>();
    const exactMap = new Map<string, Array<VisRule<any>>>();
    const numCount = numericalColumns.length;
    const catCount = categoricalColumns.length;
    const dateCount = dateColumns.length;

    for (const [type, config] of this.visualizations) {
      if (chartType && chartType !== type) {
        continue;
      }

      const rules = config.getRules();

      for (const rule of rules) {
        let compatibleMatch = false;
        let exactMatch = false;

        for (const mapping of rule.mappings) {
          const required = this.countMappingFieldTypes(mapping);

          const isExact =
            required.numerical === numCount &&
            required.categorical === catCount &&
            required.date === dateCount;

          const isCompatible =
            required.numerical <= numCount &&
            required.categorical <= catCount &&
            required.date <= dateCount;

          if (isExact) {
            exactMatch = true;
            compatibleMatch = true;
          }

          if (isCompatible && !compatibleMatch) {
            compatibleMatch = true;
          }
        }

        if (compatibleMatch) {
          if (!allMap.has(type)) allMap.set(type, []);
          allMap.get(type)!.push(rule);
        }
        if (exactMatch) {
          if (!exactMap.has(type)) exactMap.set(type, []);
          exactMap.get(type)!.push(rule);
        }
      }
    }

    const toArray = (map: Map<string, Array<VisRule<any>>>): MatchedVisRules[] =>
      Array.from(map.entries()).map(([visType, rules]) => ({ visType, rules }));

    return {
      all: toArray(allMap),
      exact: toArray(exactMap),
    };
  }

  private countMappingFieldTypes(
    mapping: Partial<Record<AxisRole, { type: VisFieldType }>>
  ): { numerical: number; categorical: number; date: number } {
    let numerical = 0;
    let categorical = 0;
    let date = 0;
    for (const entry of Object.values(mapping)) {
      if (!entry) continue;
      switch (entry.type) {
        case VisFieldType.Numerical:
          numerical++;
          break;
        case VisFieldType.Categorical:
          categorical++;
          break;
        case VisFieldType.Date:
          date++;
          break;
      }
    }
    return { numerical, categorical, date };
  }

  public registerVisualization(input: VisualizationType<any> | Array<VisualizationType<any>>) {
    const visualizations: Array<VisualizationType<any>> = [];
    if (Array.isArray(input)) {
      visualizations.push(...input);
    } else {
      visualizations.push(input);
    }
    for (const visConfig of visualizations) {
      if (!this.visualizations.has(visConfig.type)) {
        this.visualizations.set(visConfig.type, visConfig);
      }
    }
  }

  public getVisualization(visType: string) {
    return this.visualizations.get(visType);
  }
}

// Note: This singleton instance is kept for backward compatibility.
// New code should use the VisualizationRegistryService instead.
// TODO: refactor existing visualizationRegistry to use VisualizationRegistryService
export const visualizationRegistry = new VisualizationRegistry();
