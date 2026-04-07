/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisFieldNameMappings, AxisRole, ChartMetadata, VisColumn, VisFieldType } from './types';
import { VisualizationType, VisRule, AxisTypeMapping } from './utils/use_visualization_types';
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
  ): AxisFieldNameMappings {
    for (const mapping of rule.mappings) {
      const result: AxisFieldNameMappings = {};
      const numCols = [...numericalColumns];
      const categoricalCols = [...categoricalColumns];
      const dateCols = [...dateColumns];
      let failed = false;

      for (const [axisRole, { type, multi }] of Object.entries(mapping)) {
        const pool =
          type === VisFieldType.Categorical
            ? categoricalCols
            : type === VisFieldType.Numerical
            ? numCols
            : type === VisFieldType.Date
            ? dateCols
            : undefined;

        if (!pool || pool.length === 0) {
          failed = true;
          break;
        }

        if (multi) {
          result[axisRole] = pool.splice(0).map((col) => col.name);
        } else {
          result[axisRole] = pool.shift()!.name;
        }
      }
      // Only return if we successfully mapped ALL axes
      if (!failed && Object.keys(result).length === Object.keys(mapping).length) {
        return result;
      }
    }
    return {};
  }

  /**
   * Finds the first rule for a chart type whose mapping exactly matches the given
   * axes mapping in both axis roles and field types.
   */
  public findRuleByAxesMapping(
    chartType: string,
    axesMapping: AxisFieldNameMappings,
    allColumns: VisColumn[]
  ) {
    const rules = this.getVisualization(chartType)?.getRules();
    if (!rules) {
      return;
    }

    // Convert axesMapping to AxisTypeMapping type
    const axisTypeMapping: AxisTypeMapping = {};
    for (const [role, field] of Object.entries(axesMapping)) {
      const names = Array.isArray(field) ? field : [field];
      const columns = names.map((name) => allColumns.find((col) => col.name === name));
      if (columns.some((col) => col === undefined)) return undefined;
      const type = columns[0]!.schema;
      if (columns.some((col) => col!.schema !== type)) return undefined;
      axisTypeMapping[role as AxisRole] = { type, ...(names.length > 1 && { multi: true }) };
    }

    const found = rules.find((rule) => {
      return rule.mappings.some((mapping) => {
        const mappingKeys = Object.keys(mapping) as AxisRole[];
        const inputKeys = Object.keys(axisTypeMapping) as AxisRole[];

        if (mappingKeys.length !== inputKeys.length) return false;

        return inputKeys.every((key) => {
          const mappingEntry = mapping[key];
          const inputEntry = axisTypeMapping[key];
          if (!mappingEntry || !inputEntry) return false;
          if (mappingEntry.type !== inputEntry.type) return false;
          // A multi rule axis accepts both single and multiple fields.
          // A non-multi rule axis only accepts a single field.
          if (!mappingEntry.multi && inputEntry.multi) return false;
          return true;
        });
      });
    });
    return found;
  }

  /**
   * Recomputes the axes-to-column mapping for a new chart type using the currently
   * mapped columns. Classifies columns by field type, finds the best-matching rule
   * for the target chart type via `findBestMatch`, then builds a new axis mapping
   * via `getAxesMappingByRule`. Returns an empty object if no rule matches.
   */
  public updateAxesMappingByChartType(
    chartType: string,
    axesMapping: AxisFieldNameMappings,
    allColumns: VisColumn[]
  ): AxisFieldNameMappings {
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
    const { exact: matchedVisRules } = this.findRulesByColumns(
      numericalColumns,
      categoricalColumns,
      dateColumns,
      chartType
    );

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
   * - `exact`: subset of `all` with at least one unambiguous mapping where all columns are consumed.
   *
   * For multi-field axes (`multi: true`), compatibility requires at least `fixed + 1` columns
   * of that type (the multi axis needs at least one). Exact matching additionally requires that
   * no other fixed axis competes for the same type pool — otherwise the assignment is ambiguous
   * and should be left to the user.
   */
  public findRulesByColumns(
    numericalColumns: VisColumn[],
    categoricalColumns: VisColumn[],
    dateColumns: VisColumn[],
    chartType?: string
  ): FindRulesByColumnsResult {
    const allMap = new Map<string, Array<VisRule<any>>>();
    const exactMap = new Map<string, Array<VisRule<any>>>();
    const counts = {
      numerical: numericalColumns.length,
      categorical: categoricalColumns.length,
      date: dateColumns.length,
    };
    const fieldTypes = ['numerical', 'categorical', 'date'] as const;

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

          // Compatible: enough columns for all fixed axes, plus at least 1 for any multi axis
          const isCompatible = fieldTypes.every(
            (ft) => counts[ft] >= required[ft].fixed + (required[ft].hasMulti ? 1 : 0)
          );

          // Exact: all columns are consumed with no ambiguity.
          // - Non-multi types: available must equal fixed (no leftovers).
          // - Multi types with fixed > 0: ambiguous (which columns go to fixed vs multi),
          //   so never exact.
          // - Multi types with fixed === 0: the multi axis is the sole consumer,
          //   exact if available >= 1.
          const isExact = fieldTypes.every((ft) => {
            const { fixed, hasMulti } = required[ft];
            if (hasMulti && fixed > 0) return false;
            if (hasMulti) return counts[ft] >= 1;
            return counts[ft] === fixed;
          });

          compatibleMatch ||= isCompatible;
          exactMatch ||= isExact;
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
    mapping: Partial<Record<AxisRole, { type: VisFieldType; multi?: boolean }>>
  ): {
    numerical: { fixed: number; hasMulti: boolean };
    categorical: { fixed: number; hasMulti: boolean };
    date: { fixed: number; hasMulti: boolean };
  } {
    const result = {
      numerical: { fixed: 0, hasMulti: false },
      categorical: { fixed: 0, hasMulti: false },
      date: { fixed: 0, hasMulti: false },
    };
    for (const entry of Object.values(mapping)) {
      if (!entry) continue;
      const key =
        entry.type === VisFieldType.Numerical
          ? 'numerical'
          : entry.type === VisFieldType.Categorical
          ? 'categorical'
          : entry.type === VisFieldType.Date
          ? 'date'
          : undefined;
      if (!key) continue;
      if (entry.multi) {
        result[key].hasMulti = true;
      } else {
        result[key].fixed++;
      }
    }
    return result;
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
