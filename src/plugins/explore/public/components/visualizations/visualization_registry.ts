/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAreaConfig } from './area/area_vis_config';
import { createBarConfig } from './bar/bar_vis_config';
import { createBarGaugeConfig } from './bar_gauge/bar_gauge_vis_config';
import { createGaugeConfig } from './gauge/gauge_vis_config';
import { createHeatmapConfig } from './heatmap/heatmap_vis_config';
import { createHistogramConfig } from './histogram/histogram_vis_config';
import { createLineConfig } from './line/line_vis_config';
import { createMetricConfig } from './metric/metric_vis_config';
import { createPieConfig } from './pie/pie_vis_config';
import { createScatterConfig } from './scatter/scatter_vis_config';
import { createStateTimelineConfig } from './state_timeline/state_timeline_config';
import { createTableConfig } from './table/table_vis_config';
import { AxisRole, ChartMetadata, VisColumn, VisFieldType } from './types';
import { VisualizationType, VisRule } from './utils/use_visualization_types';
import { getColumnsByAxesMapping } from './visualization_builder_utils';

export interface MatchedVisRules {
  visType: string;
  rules: Array<VisRule<any>>;
}

export interface FindRulesByColumnsResult {
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
   * Recomputes the axes-to-column mapping when the user switches to a different
   * chart type while keeping the same set of selected data columns.
   *
   * Different chart types have different axis requirements. For example, a bar
   * chart may expect `{ x: categorical, y: numerical }` while a scatter plot
   * expects `{ x: numerical, y: numerical }`. When the chart type changes, the
   * previous mapping may no longer be valid or optimal for the new type.
   *
   * This method resolves that by:
   * 1. Extracting the currently mapped columns from `axesMapping` and classifying
   *    them by field type (numerical, categorical, date) via `getColumnsByAxesMapping`.
   * 2. Searching all registered visualization rules for the target `chartType` to
   *    find the best-matching rule whose field-type requirements exactly match the
   *    available columns, using `findBestMatch` (which prioritises exact column-count
   *    matches and higher-priority rules).
   * 3. Delegating to `getAxesMappingByRule` to produce a fresh axis mapping that
   *    assigns each column to the correct axis role as defined by the winning rule's
   *    first mapping template, consuming columns in order per field type.
   *
   * @param chartType  - The target chart type the user is switching to (e.g. "bar",
   *                     "line", "scatter").
   * @param axesMapping - The current axis-to-column-name mapping from the previous
   *                      chart type. Column names are resolved against `allColumns`.
   * @param allColumns  - The full list of available data columns with their metadata
   *                      (name, field type, etc.).
   * @returns A new `Record<string, string>` mapping axis roles to column names that
   *          is compatible with the target chart type, or an empty object if no
   *          matching rule could be found for the given columns and chart type.
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
   * Find all VisRules from registered visualizations whose mappings are satisfiable
   * by the given column counts. Returns two sets of results:
   *
   * - `all`: Rules where the mapping's required field type counts are <= the input counts
   *   (compatible matches — the data has enough columns, possibly with surplus).
   * - `exact`: Rules where the mapping's required field type counts === the input counts
   *   exactly (no surplus, no deficit — strongest signal for auto-detection).
   *
   * For each rule, all alternative mappings are checked. A rule appears in `exact` if any
   * of its mappings is an exact match; it appears in `all` if any mapping is compatible.
   * Results are grouped by visualization type. `exact` is always a subset of `all`.
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

visualizationRegistry.registerVisualization([
  createAreaConfig(),
  createBarConfig(),
  createBarGaugeConfig(),
  createGaugeConfig(),
  createHeatmapConfig(),
  createHistogramConfig(),
  createLineConfig(),
  createMetricConfig(),
  createPieConfig(),
  createScatterConfig(),
  createStateTimelineConfig(),
  createTableConfig(),
]);
