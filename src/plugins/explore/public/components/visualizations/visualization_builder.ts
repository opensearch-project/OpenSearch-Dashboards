/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { isEmpty, isEqual } from 'lodash';
import { debounceTime, map } from 'rxjs/operators';

import { ChartStyles, ChartType, StyleOptions } from './utils/use_visualization_types';
import { isValidMapping } from './visualization_builder_utils';
import { getServices } from '../../services/services';
import { IOsdUrlStateStorage } from '../../../../opensearch_dashboards_utils/public';
import { OpenSearchSearchHit } from '../../types/doc_views_types';
import { isChartType } from './utils/is_chart_type';
import { visualizationRegistry } from './visualization_registry';
import { normalizeResultRows } from './utils/normalize_result_rows';
import { ChartConfig, SplitConfig, SplitLayout, VisData } from './visualization_builder.types';
import { VisualizationRender } from './visualization_render';
import { StylePanelRender } from './style_panel_render';
import { adaptLegacyData } from './visualization_builder_utils';
import { mergeStyles } from './utils/utils';
import { AxisFieldNameMappings, RenderChartConfig } from './types';
import { TimeRange } from '../../../../data/common';
import { ITransformationService } from '../data_transformations/types';
import { createNoOpTransformationService } from '../data_transformations/transformation_service';

interface VisState {
  styleOptions?: StyleOptions;
  chartType?: string;
  axesMapping?: AxisFieldNameMappings;
  splitField?: string;
  splitLayout?: SplitLayout;
  showSplitLabel?: boolean;
}

interface Options {
  getUrlStateStorage?: () => IOsdUrlStateStorage | undefined;
}

export class VisualizationBuilder {
  private isInitialized = false;
  private getUrlStateStorage: Options['getUrlStateStorage'];
  private subscriptions = Array<Subscription>();
  private transformationService: ITransformationService = createNoOpTransformationService();
  private lastRawRows: Array<OpenSearchSearchHit<unknown>> = [];
  private lastSchema: Array<{ type?: string; name?: string }> = [];

  visConfig$ = new BehaviorSubject<ChartConfig | undefined>(undefined);
  data$ = new BehaviorSubject<VisData | undefined>(undefined);
  showRawTable$ = new BehaviorSubject<boolean>(false);
  isVisDirty$ = new BehaviorSubject<boolean>(false);

  constructor({ getUrlStateStorage }: Options) {
    if (getUrlStateStorage) {
      this.getUrlStateStorage = getUrlStateStorage;
    }
  }

  setTransformationService(service: ITransformationService) {
    this.transformationService = service;

    // subscribe pipeline change first
    this.subscriptions.push(
      service.getPipeline$().subscribe(() => {
        if (this.lastRawRows.length > 0) {
          this.handleData(this.lastRawRows, this.lastSchema);
        }
      })
    );

    // restore saved dataTransformations once
    if (this.visConfig$.value?.dataTransformations) {
      this.transformationService.restoreFromState(this.visConfig$.value.dataTransformations);
    }
  }

  getTransformationService() {
    return this.transformationService;
  }

  init() {
    if (this.isInitialized) {
      return;
    }

    let state: VisState = {};

    // Read state from url
    const urlStateStorage = this.getUrlStateStorage?.();
    if (urlStateStorage) {
      const urlState = urlStateStorage.get<VisState & { isVisDirty: boolean }>('_v');

      if (urlState) {
        const { isVisDirty, ...visState } = urlState;
        state = { ...state, ...visState };

        // sync url isVisDirty state to visualization builder
        // this is to track user's modification after reloading page
        if (typeof isVisDirty === 'boolean' && isVisDirty) this.isVisDirty$.next(isVisDirty);
      }
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

      if (state.splitField) {
        initialVisConfig.splitField = state.splitField;
      }

      if (state.splitLayout) {
        initialVisConfig.splitLayout = state.splitLayout;
      }

      if (state.showSplitLabel !== undefined) {
        initialVisConfig.showSplitLabel = state.showSplitLabel;
      }

      this.setVisConfig(initialVisConfig);

      // Validate restored splitField against current dataset columns.
      // If data is already available, validate immediately; otherwise,
      // validation will occur when data arrives via onDataChange -> validateSplitField.
      if (state.splitField && this.data$.value) {
        const data = this.data$.value;
        const allColumns = [...data.categoricalColumns, ...data.numericalColumns];
        const exists = allColumns.some((col) => col.name === state.splitField);
        if (!exists) {
          const config = this.visConfig$.value;
          if (config) {
            this.visConfig$.next({ ...config, splitField: undefined });
          }
        }
      }
    }

    // Subscribe to visualization state updates and sync the state to url
    this.subscriptions.push(
      combineLatest([this.visConfig$, this.isVisDirty$])
        .pipe(debounceTime(500))
        .subscribe(([visConfig, isVisDirty]) =>
          this.syncToUrl(
            {
              chartType: visConfig?.type,
              axesMapping: visConfig?.axesMapping,
              styleOptions: visConfig?.styles,
              splitField: visConfig?.splitField,
              splitLayout: visConfig?.splitLayout,
              showSplitLabel: visConfig?.showSplitLabel,
            },
            isVisDirty
          )
        ),
      this.data$.subscribe((data) => this.onDataChange(data))
    );

    this.setIsInitialized(true);
  }

  setShowRawTable(on: boolean) {
    this.showRawTable$.next(on);
  }

  setIsVisDirty(on: boolean) {
    this.isVisDirty$.next(on);
  }

  setIsInitialized(isInitialized: boolean) {
    this.isInitialized = isInitialized;
  }

  onChartTypeChange(chartType?: ChartType) {
    if (!chartType || !isChartType(chartType)) {
      this.setVisConfig(undefined);
      return;
    }

    if (chartType === 'table' && this.showRawTable$.value) {
      this.showRawTable$.next(false);
    }

    const currentVisConfig = this.visConfig$.value;
    const newVisConfig: ChartConfig = { type: chartType };

    const visConfig = visualizationRegistry.getVisualization(chartType);
    if (!visConfig) {
      this.setVisConfig(undefined);
      return;
    }

    // Always reset style after changing chart type
    if (currentVisConfig?.type !== chartType) {
      newVisConfig.styles = visConfig.ui.style.defaults;
    }

    // Preserve splitField and splitLayout across chart type changes
    if (currentVisConfig?.splitField) {
      newVisConfig.splitField = currentVisConfig.splitField;
    }
    if (currentVisConfig?.splitLayout) {
      newVisConfig.splitLayout = currentVisConfig.splitLayout;
    }
    if (currentVisConfig?.showSplitLabel !== undefined) {
      newVisConfig.showSplitLabel = currentVisConfig.showSplitLabel;
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

    const axesMapping = visualizationRegistry.getAxesMappingByRule(
      bestMatch.rule,
      numericalColumns,
      categoricalColumns,
      dateColumns
    );

    return {
      chartType: bestMatch.chartType as ChartType,
      axesMapping,
    };
  }

  /**
   * For given chartType and data columns, try to reuse the current fields of axes mapping for the new chart type,
   * and return the axes mapping for the new chart type with the current fields. If fields cannot be reused, return undefined.
   */
  reuseCurrentAxesMapping(
    chartType: ChartType,
    axesMapping: AxisFieldNameMappings,
    data: VisData | undefined
  ) {
    const allColumns = [
      ...(data?.numericalColumns ?? []),
      ...(data?.categoricalColumns ?? []),
      ...(data?.dateColumns ?? []),
    ];
    const visConfig = visualizationRegistry.getVisualization(chartType);
    if (!visConfig) {
      return;
    }
    return visualizationRegistry.updateAxesMappingByChartType(chartType, axesMapping, allColumns);
  }

  /**
   * Helper method to create a vis config with split fields and apply it.
   * Returns true if successful, false otherwise.
   */
  private applyVisConfig(
    chartType: ChartType,
    axesMapping: AxisFieldNameMappings,
    preserveStyles = false
  ): boolean {
    const chartTypeConfig = visualizationRegistry.getVisualization(chartType);
    if (!chartTypeConfig) {
      return false;
    }

    const currentConfig = this.visConfig$.value;
    const newVisConfig: ChartConfig = {
      type: chartType,
      styles:
        preserveStyles && currentConfig?.styles
          ? currentConfig.styles
          : chartTypeConfig.ui.style.defaults,
      axesMapping,
      splitField: currentConfig?.splitField,
      splitLayout: currentConfig?.splitLayout,
      showSplitLabel: currentConfig?.showSplitLabel,
    };

    this.setVisConfig(newVisConfig);
    return true;
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

    // Validate that the current split field still exists in the new data
    this.validateSplitField(data);

    // Do nothing for table, as any data can render with a table
    if (currentChartType === 'table') {
      return;
    }

    const columns = [...data.numericalColumns, ...data.categoricalColumns, ...data.dateColumns];

    // If current axes mapping is valid, no changes needed
    if (!isEmpty(axesMapping) && isValidMapping(axesMapping ?? {}, columns)) {
      return;
    }

    // Current axes mapping is invalid or empty - try different strategies to rebuild

    // Strategy 1: Try to reuse current axes mapping with the same chart type
    if (currentChartType && !isEmpty(axesMapping)) {
      const reusedMapping = visualizationRegistry.reuseAxesMapping(
        currentChartType,
        axesMapping ?? {},
        columns
      );
      if (reusedMapping && this.applyVisConfig(currentChartType, reusedMapping, true)) {
        return;
      }
    }

    // Strategy 2: Try to create auto vis for the current chart type
    if (currentChartType) {
      const autoVis = this.createAutoVis(data, currentChartType);
      if (autoVis && this.applyVisConfig(autoVis.chartType, autoVis.axesMapping, true)) {
        return;
      }
    }

    // Strategy 3: Try to create auto vis with any chart type
    const autoVis = this.createAutoVis(data);
    if (autoVis && this.applyVisConfig(autoVis.chartType, autoVis.axesMapping, false)) {
      return;
    }

    // Strategy 4: Fallback to table, or set undefined if table config unavailable
    if (!this.applyVisConfig('table', {}, false)) {
      this.setVisConfig(undefined);
    }
  }

  /**
   * Apply the current transformation pipeline against the given raw rows and
   * schema, then publish the result to data$
   */
  handleData<T = unknown>(
    rows: Array<OpenSearchSearchHit<T>>,
    schema: Array<{ type?: string; name?: string }>
  ) {
    // when the pipeline changes, we need to re-apply the new pipeline against the previous raw data
    // cache the reference
    this.lastRawRows = rows;
    this.lastSchema = schema;

    const { rows: transformedRows, finalSchema } = this.transformationService.applyPipeline(
      rows,
      schema
    );
    const {
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      unknownColumns,
    } = normalizeResultRows(transformedRows, finalSchema);

    this.data$.next({
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      unknownColumns,
    });
  }

  updateStyles(styles?: Partial<StyleOptions>) {
    const currentVisConfig = this.visConfig$.value;
    if (!currentVisConfig) {
      return;
    }
    if (currentVisConfig.styles) {
      this.setIsVisDirty(true);
      this.visConfig$.next({
        ...currentVisConfig,
        styles: { ...currentVisConfig.styles, ...styles },
      });
    }
  }

  setVisConfig(config?: ChartConfig) {
    const newConfig = adaptLegacyData(config);
    this.visConfig$.next(newConfig);
  }

  setCurrentChartType(chartType?: ChartType) {
    if (this.visConfig$.value?.type !== chartType) {
      this.setIsVisDirty(true);
      this.onChartTypeChange(chartType);
    }
  }

  setAxesMapping(mapping: AxisFieldNameMappings) {
    const config = this.visConfig$.value;
    if (
      config &&
      !isEqual(this.normalizeMapping(config.axesMapping), this.normalizeMapping(mapping))
    ) {
      this.setIsVisDirty(true);
      this.visConfig$.next({ ...config, axesMapping: mapping });
    }
  }

  private normalizeMapping(
    mapping: AxisFieldNameMappings | undefined
  ): Record<string, string[]> | undefined {
    if (!mapping) return undefined;
    const normalized: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(mapping)) {
      if (value) {
        normalized[key] = Array.isArray(value) ? value : [value];
      }
    }
    return normalized;
  }

  /**
   * Sets the split field. Validates that the field exists as a categorical or numerical column.
   * Marks vis as dirty and updates visConfig$.
   */
  updateSplitConfig(splitConfig: Partial<SplitConfig>): void {
    const config = this.visConfig$.value;
    if (!config) return;

    if ('splitField' in splitConfig && splitConfig.splitField) {
      const data = this.data$.value;
      const isValid =
        data?.categoricalColumns.some((col) => col.name === splitConfig.splitField) ||
        data?.numericalColumns.some((col) => col.name === splitConfig.splitField);
      if (!isValid) return;
    }

    this.setIsVisDirty(true);
    this.visConfig$.next({ ...config, ...splitConfig });
  }

  /**
   * On data change, validate that the current splitField still exists in the dataset.
   * If the field no longer exists, clear it from the config.
   */
  private validateSplitField(data: VisData): void {
    const currentSplitField = this.visConfig$.value?.splitField;
    if (!currentSplitField) return;

    const allColumns = [...data.categoricalColumns, ...data.numericalColumns];
    const exists = allColumns.some((col) => col.name === currentSplitField);
    if (!exists) {
      const config = this.visConfig$.value;
      if (config) {
        this.visConfig$.next({ ...config, splitField: undefined });
      }
    }
  }

  syncToUrl(visState: VisState, isVisDirty?: boolean) {
    const urlStateStorage = this.getUrlStateStorage?.();

    if (urlStateStorage) {
      urlStateStorage.set('_v', { ...visState, isVisDirty }, { replace: true });
    }
  }

  dispose(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    this.visConfig$.complete();
    this.data$.complete();
    this.showRawTable$.complete();
    this.isVisDirty$.complete();
  }

  reset(): void {
    this.dispose();

    this.visConfig$ = new BehaviorSubject<ChartConfig | undefined>(undefined);
    this.data$ = new BehaviorSubject<VisData | undefined>(undefined);
    this.showRawTable$ = new BehaviorSubject<boolean>(false);
    this.isVisDirty$ = new BehaviorSubject<boolean>(false);
    this.transformationService = createNoOpTransformationService();
    this.lastRawRows = [];
    this.lastSchema = [];
    this.isInitialized = false;
  }

  clearUrl() {
    this.syncToUrl({ axesMapping: {}, styleOptions: undefined, chartType: undefined });
  }

  getRenderConfig$(): Observable<RenderChartConfig | undefined> {
    return this.visConfig$.pipe(
      map((config) => {
        if (config?.type) {
          const vis = visualizationRegistry.getVisualization(config.type);
          if (vis) {
            const styles: ChartStyles = mergeStyles(vis.ui.style.defaults, config.styles);
            return {
              styles,
              type: config.type,
              axesMapping: config.axesMapping,
              splitField: config.splitField,
              splitLayout: config.splitLayout,
              showSplitLabel: config.showSplitLabel,
            };
          }
          return undefined;
        }
      })
    );
  }

  renderVisualization({
    timeRange,
    onSelectTimeRange,
  }: {
    timeRange?: TimeRange;
    onSelectTimeRange?: (range?: TimeRange) => void;
  }) {
    return React.createElement(VisualizationRender, {
      data$: this.data$,
      config$: this.getRenderConfig$(),
      showRawTable$: this.showRawTable$,
      timeRange,
      onSelectTimeRange,
      onStyleChange: this.updateStyles.bind(this),
    });
  }

  renderStylePanel({ className }: { className?: string }) {
    return React.createElement(StylePanelRender, {
      className,
      data$: this.data$,
      config$: this.getRenderConfig$(),
      onStyleChange: this.updateStyles.bind(this),
      onAxesMappingChange: this.setAxesMapping.bind(this),
      onChartTypeChange: this.setCurrentChartType.bind(this),
      onSplitConfigChange: this.updateSplitConfig.bind(this),
    });
  }
}

let visualizationBuilder: VisualizationBuilder;

export const getVisualizationBuilder = () => {
  if (!visualizationBuilder) {
    visualizationBuilder = new VisualizationBuilder({
      getUrlStateStorage: () => getServices().osdUrlStateStorage,
    });
  }
  return visualizationBuilder;
};
