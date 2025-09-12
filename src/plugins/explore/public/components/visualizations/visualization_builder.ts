/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BehaviorSubject, Subscription, combineLatest } from 'rxjs';
import { isEmpty } from 'lodash';
import { debounceTime } from 'rxjs/operators';

import { ChartType, StyleOptions } from './utils/use_visualization_types';
import { convertMappingsToStrings, isValidMapping } from './visualization_builder_utils';
import { getServices } from '../../services/services';
import { IOsdUrlStateStorage } from '../../../../opensearch_dashboards_utils/public';
import { OpenSearchSearchHit } from '../../types/doc_views_types';
import { isChartType } from './utils/is_chart_type';
import { visualizationRegistry } from './visualization_registry';
import { normalizeResultRows } from './utils/normalize_result_rows';
import { ChartConfig, VisData } from './visualization_builder.types';
import { ExecutionContextSearch } from '../../../../expressions/common/';
import { VisualizationRender } from './visualization_render';
import { ExpressionsStart } from '../../../../expressions/public';
import { StylePanelRender } from './style_panel_render';

interface VisState {
  styleOptions?: StyleOptions;
  chartType?: string;
  axesMapping?: Record<string, string>;
}

interface Options {
  getUrlStateStorage?: () => IOsdUrlStateStorage | undefined;
  getExpressions: () => ExpressionsStart;
}

export class VisualizationBuilder {
  private isInitialized = false;
  private getUrlStateStorage: Options['getUrlStateStorage'];
  private getExpression: Options['getExpressions'];
  private subscriptions = Array<Subscription>();

  visConfig$ = new BehaviorSubject<ChartConfig | undefined>(undefined);
  data$ = new BehaviorSubject<VisData | undefined>(undefined);

  constructor({ getUrlStateStorage, getExpressions }: Options) {
    if (getUrlStateStorage) {
      this.getUrlStateStorage = getUrlStateStorage;
    }
    this.getExpression = getExpressions;
  }

  init() {
    if (this.isInitialized) {
      return;
    }

    let state: VisState = {};

    // Read state from url
    const urlStateStorage = this.getUrlStateStorage?.();
    if (urlStateStorage) {
      const urlState = urlStateStorage.get<VisState>('_v');
      state = { ...state, ...urlState };
    }

    // update visualization state accordingly
    if (state.chartType && isChartType(state.chartType)) {
      const initialVisConfig: ChartConfig = { type: state.chartType };

      if (state.styleOptions) {
        initialVisConfig.styles = state.styleOptions;
      }

      if (state.axesMapping) {
        initialVisConfig.axesMapping = state.axesMapping;
      }
      this.setVisConfig(initialVisConfig);
    }

    // Subscribe to visualization state updates and sync the state to url
    this.subscriptions.push(
      combineLatest([this.visConfig$])
        .pipe(debounceTime(500))
        .subscribe(([visConfig]) =>
          this.syncToUrl({
            chartType: visConfig?.type,
            axesMapping: visConfig?.axesMapping,
            styleOptions: visConfig?.styles,
          })
        ),
      this.data$.subscribe((data) => this.onDataChange(data))
    );

    this.setIsInitialized(true);
  }

  setIsInitialized(isInitialized: boolean) {
    this.isInitialized = isInitialized;
  }

  onChartTypeChange(chartType?: ChartType) {
    if (!chartType || !isChartType(chartType)) {
      this.setVisConfig(undefined);
      return;
    }

    const currentVisConfig = this.visConfig$.value;
    const newVisConfig: ChartConfig = { type: chartType };

    const visConfig = visualizationRegistry.getVisualizationConfig(chartType);
    if (!visConfig) {
      this.setVisConfig(undefined);
      return;
    }

    // Always reset style after changing chart type
    if (currentVisConfig?.type !== chartType) {
      newVisConfig.styles = visConfig.ui.style.defaults;
    }

    // Table chart doesn't have axes mapping, but we need to keep current axes mapping, so when switch back to other types
    // of charts, the axes mapping can be reused
    if (chartType === 'table') {
      this.setVisConfig({ ...newVisConfig, axesMapping: currentVisConfig?.axesMapping });
      return;
    }

    // Reuse current axes mapping for the new chart type if possible
    const newAxesMapping = this.reuseCurrentAxesMapping(
      chartType,
      currentVisConfig?.axesMapping ?? {},
      this.data$.value
    );
    if (!isEmpty(newAxesMapping)) {
      newVisConfig.axesMapping = newAxesMapping;
      this.setVisConfig(newVisConfig);
      return;
    }

    // Auto create visualization for the new chart type based on the rules,
    // and use the new axes mapping from the matched rule.
    const autoVis = this.createAutoVis(this.data$.value, chartType);
    if (autoVis) {
      newVisConfig.axesMapping = autoVis.axesMapping;
      this.setVisConfig(newVisConfig);
      return;
    }

    // Lastly, for the given chart type, we cannot reuse current axes mapping, also we cannot find a rule to auto create the chart
    // Reset the axes mapping to empty and let user to choose the fields for the axes mapping
    this.setVisConfig(newVisConfig);
  }

  createAutoVis(data?: VisData, chartType?: ChartType) {
    const numericalColumns = data?.numericalColumns ?? [];
    const categoricalColumns = data?.categoricalColumns ?? [];
    const dateColumns = data?.dateColumns ?? [];
    const bestMatch = visualizationRegistry.findBestMatch(
      numericalColumns,
      categoricalColumns,
      dateColumns,
      chartType
    );
    if (!bestMatch) {
      return;
    }

    const axesColumnMapping = visualizationRegistry.getDefaultAxesMapping(
      bestMatch.rule,
      bestMatch.chartType.type,
      numericalColumns,
      categoricalColumns,
      dateColumns
    );

    return {
      chartType: bestMatch.chartType.type as ChartType,
      axesMapping: convertMappingsToStrings(axesColumnMapping),
    };
  }

  /**
   * For given chartType and data columns, try to reuse the current fields of axes mapping for the new chart type,
   * and return the axes mapping for the new chart type with the current fields. If fields cannot be reused, return undefined.
   */
  reuseCurrentAxesMapping(
    chartType: ChartType,
    axesMapping: Record<string, string>,
    data: VisData | undefined
  ) {
    const allColumns = [
      ...(data?.numericalColumns ?? []),
      ...(data?.categoricalColumns ?? []),
      ...(data?.dateColumns ?? []),
    ];
    const visConfig = visualizationRegistry.getVisualizationConfig(chartType);
    if (!visConfig) {
      return;
    }

    const currentRule = visualizationRegistry.findRuleByAxesMapping(axesMapping, allColumns);
    if (!isEmpty(axesMapping) && currentRule) {
      const columnMapping = visualizationRegistry.getDefaultAxesMapping(
        currentRule,
        chartType,
        data?.numericalColumns ?? [],
        data?.categoricalColumns ?? [],
        data?.dateColumns ?? []
      );
      const updatedAxesMapping: Record<string, string> = {};
      Object.entries(columnMapping).forEach(([role, value]) => {
        updatedAxesMapping[role] = value.name;
      });
      return updatedAxesMapping;
    }
  }

  /**
   * For the given data, we need to check if the current chart type and axes mapping can be applied
   */
  onDataChange(data?: VisData) {
    const currentChartType = this.visConfig$.value?.type;
    const axesMapping = this.visConfig$.value?.axesMapping;
    if (!data) {
      return;
    }

    // Do nothing for table, as any data can render with a table
    if (currentChartType === 'table') {
      return;
    }

    const columns = [...data.numericalColumns, ...data.categoricalColumns, ...data.dateColumns];

    // We cannot apply the current chart type and axes mapping if:
    // 1. It has axes mapping, but the mapping is incompatible with the received data
    // 2. No current axes mapping
    // For these cases, we will create auto vis based on the rules. If not auto vis can be created,
    // reset chart type and axes mapping to empty, this will let user to choose.
    if (isEmpty(axesMapping) || !isValidMapping(axesMapping ?? {}, columns)) {
      const autoVis = this.createAutoVis(data);
      if (autoVis) {
        const chartTypeConfig = visualizationRegistry.getVisualizationConfig(autoVis.chartType);
        if (chartTypeConfig) {
          const newVisConfig: ChartConfig = {
            type: autoVis.chartType,
            styles: chartTypeConfig.ui.style.defaults,
            axesMapping: autoVis.axesMapping,
          };
          this.setVisConfig(newVisConfig);
        }
      } else {
        const chartTypeConfig = visualizationRegistry.getVisualizationConfig('table');
        if (!chartTypeConfig) {
          this.setVisConfig(undefined);
        }
        // Default to show a table if no auto vis created
        const newVisConfig: ChartConfig = {
          type: 'table',
          styles: chartTypeConfig?.ui.style.defaults,
        };
        this.setVisConfig(newVisConfig);
      }
      return;
    }

    // The current axes mappings can be applied to the data,
    // it will just use the current chart type and axes mapping
    if (isValidMapping(axesMapping ?? {}, columns)) {
      return;
    }

    // All other cases will fallback to reset vis state and let user to choose
    this.setVisConfig(undefined);
  }

  handleData<T = unknown>(
    rows: Array<OpenSearchSearchHit<T>>,
    schema: Array<{ type?: string; name?: string }>
  ) {
    const {
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
    } = normalizeResultRows(rows, schema);
    this.data$.next({ transformedData, numericalColumns, categoricalColumns, dateColumns });
  }

  updateStyles(styles?: Partial<StyleOptions>) {
    const currentVisConfig = this.visConfig$.value;
    if (!currentVisConfig) {
      return;
    }
    if (currentVisConfig.styles) {
      this.visConfig$.next({
        ...currentVisConfig,
        styles: { ...currentVisConfig.styles, ...styles } as StyleOptions,
      });
    }
  }

  setVisConfig(config?: ChartConfig) {
    this.visConfig$.next(config);
  }

  setCurrentChartType(chartType?: ChartType) {
    if (this.visConfig$.value?.type !== chartType) {
      this.onChartTypeChange(chartType);
    }
  }

  setAxesMapping(mapping: Record<string, string>) {
    const config = this.visConfig$.value;
    if (config) {
      this.visConfig$.next({ ...config, axesMapping: mapping });
    }
  }

  syncToUrl<State>(visState: VisState) {
    const urlStateStorage = this.getUrlStateStorage?.();
    if (urlStateStorage) {
      urlStateStorage.set('_v', visState, { replace: true });
    }
  }

  dispose(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    this.visConfig$.complete();
    this.data$.complete();
  }

  reset(): void {
    this.dispose();

    this.visConfig$ = new BehaviorSubject<ChartConfig | undefined>(undefined);
    this.data$ = new BehaviorSubject<VisData | undefined>(undefined);
    this.isInitialized = false;
  }

  clearUrl() {
    this.syncToUrl({ axesMapping: {}, styleOptions: undefined, chartType: undefined });
  }

  renderVisualization({ searchContext }: { searchContext?: ExecutionContextSearch }) {
    const ExpressionRenderer = this.getExpression()?.ReactExpressionRenderer;
    if (!ExpressionRenderer) {
      return null;
    }

    return React.createElement(VisualizationRender, {
      data$: this.data$,
      visConfig$: this.visConfig$,
      searchContext,
      ExpressionRenderer,
    });
  }

  renderStylePanel({ className }: { className?: string }) {
    return React.createElement(StylePanelRender, {
      className,
      data$: this.data$,
      visConfig$: this.visConfig$,
      onStyleChange: this.updateStyles.bind(this),
      onAxesMappingChange: this.setAxesMapping.bind(this),
      onChartTypeChange: this.setCurrentChartType.bind(this),
    });
  }
}

let visualizationBuilder: VisualizationBuilder;

export const getVisualizationBuilder = () => {
  if (!visualizationBuilder) {
    visualizationBuilder = new VisualizationBuilder({
      getUrlStateStorage: () => getServices().osdUrlStateStorage,
      getExpressions: () => getServices().expressions,
    });
  }
  return visualizationBuilder;
};
