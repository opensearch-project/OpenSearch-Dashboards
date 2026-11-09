/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { isEmpty, isEqual } from 'lodash';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { ChartStyles, ChartType, StyleOptions } from './utils/use_visualization_types';
import { isValidMapping, normalizeMapping } from './visualization_builder_utils';
import { getServices } from '../../services/services';
import { IOsdUrlStateStorage } from '../../../../opensearch_dashboards_utils/public';
import { OpenSearchSearchHit } from '../../types/doc_views_types';
import { isChartType } from './utils/is_chart_type';
import { visualizationRegistry } from './visualization_registry';
import { normalizeResultRows, normalizeSearchHits } from './utils/normalize_result_rows';
import { ChartConfig, SplitConfig, SplitLayout, VisData } from './visualization_builder.types';
import { VisualizationRender } from './visualization_render';
import { StylePanelRender } from './style_panel_render';
import { adaptLegacyData } from './visualization_builder_utils';
import { mergeStyles } from './utils/utils';
import { AxisFieldNameMappings, RenderChartConfig } from './types';
import { TimeRange } from '../../../../data/common';
import { TransformationService } from '../data_transformations/transformation_service';
import { registerAllTransformations } from '../data_transformations/register_all_transformations';
import type { VariableValue } from '../../../../dashboard/public';
import { toVisSnapshot, VisSnapshot } from './vis_snapshot';

interface VisState {
  title?: string;
  description?: string;
  styleOptions?: StyleOptions;
  chartType?: string;
  axesMapping?: AxisFieldNameMappings;
  splitField?: string;
  splitLayout?: SplitLayout;
  showSplitLabel?: boolean;
}

// create a transformation service with every transformation registered.
const createTransformationService = () => {
  const service = new TransformationService();
  registerAllTransformations(service);
  return service;
};

interface Options {
  getUrlStateStorage?: () => IOsdUrlStateStorage | undefined;
}

export class VisualizationBuilder {
  private isInitialized = false;
  private getUrlStateStorage: Options['getUrlStateStorage'];
  private subscriptions = Array<Subscription>();
  // The builder's own, for its whole life: reset() empties it rather than replacing it, so the
  // pipeline streams read here (dirty check, re-running handleData) never go stale.
  private readonly transformationService: TransformationService = createTransformationService();
  private lastRawRows: Array<OpenSearchSearchHit<unknown>> = [];
  private lastSchema: Array<{ type?: string; name?: string }> = [];
  private seriesDisplayNames?: Record<string, string> = {};

  visConfig$ = new BehaviorSubject<ChartConfig | undefined>(undefined);
  data$ = new BehaviorSubject<VisData | undefined>(undefined);
  showRawTable$ = new BehaviorSubject<boolean>(false);
  // which query's result the raw table shows (multi-query editor)
  rawTableRefId$ = new BehaviorSubject<string | undefined>(undefined);
  /** The dashboard's current variable values, when editing a dashboard panel. */
  variables$ = new BehaviorSubject<VariableValue[]>([]);
  // The vis as saved; the vis is dirty when its current snapshot differs
  savedVisSnapshot$ = new BehaviorSubject<VisSnapshot | undefined>(undefined);

  constructor({ getUrlStateStorage }: Options) {
    if (getUrlStateStorage) {
      this.getUrlStateStorage = getUrlStateStorage;
    }
    this.watchPipeline();
  }

  // A pipeline change re-runs the last data through it.
  private watchPipeline() {
    this.subscriptions.push(
      this.transformationService.getPipeline$().subscribe(() => {
        if (this.lastRawRows.length > 0) {
          this.handleData(this.lastRawRows, this.lastSchema, this.seriesDisplayNames);
        }
      })
    );
  }

  setVariables(variables: VariableValue[]) {
    if (!isEqual(variables, this.variables$.value)) {
      this.variables$.next(variables);
    }
  }

  /**
   * Starts the transformations for an editing session, when the editor mounts.
   * 1. restore saved states
   * 2. start url sync
   */
  startTransformations(urlStateStorage?: IOsdUrlStateStorage) {
    const saved = this.visConfig$.value?.dataTransformations;
    if (saved) {
      this.transformationService.restoreFromState(saved);
    }
    if (urlStateStorage) {
      this.transformationService.initUrlSync(urlStateStorage);
    }
  }

  /** Ends the session's URL sync (when the editor unmounts); the pipeline stays. */
  stopTransformations() {
    this.transformationService.stopUrlSync();
  }

  getTransformationService() {
    return this.transformationService;
  }

  /** The vis and its transformations as they'd be saved now, for the dirty check. */
  getVisSnapshot(): VisSnapshot {
    return toVisSnapshot({
      config: this.visConfig$.value,
      dataTransformations: this.transformationService.serializePipeline(),
    });
  }

  /**
   * Sets the dirty check's baseline, by default the vis as set now: call it right after
   * setVisConfig(saved) and before init() applies the URL's unsaved edits.
   */
  setSavedBaseline(
    snapshot: VisSnapshot = toVisSnapshot({
      config: this.visConfig$.value,
      dataTransformations: this.visConfig$.value?.dataTransformations,
    })
  ) {
    this.savedVisSnapshot$.next(snapshot);
  }

  confirmSaveSnapshot(snapshot: VisSnapshot = this.getVisSnapshot()) {
    this.savedVisSnapshot$.next(snapshot);
  }

  /** Whether the vis or its transformations differ from the saved baseline. */
  getIsDirty$(): Observable<boolean> {
    return combineLatest([
      this.visConfig$,
      this.transformationService.getPipeline$(),
      this.savedVisSnapshot$,
    ]).pipe(
      map(
        ([config, pipeline, saved]) =>
          !!saved &&
          !isEqual(
            toVisSnapshot({
              config,
              dataTransformations: this.transformationService.serializePipeline(pipeline),
            }),
            saved
          )
      ),
      distinctUntilChanged()
    );
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

      if (urlState) {
        state = { ...state, ...urlState };
      }
    }

    // update visualization state accordingly
    if (state.chartType && isChartType(state.chartType)) {
      const initialVisConfig: ChartConfig = { type: state.chartType };

      if (state.styleOptions) {
        initialVisConfig.styles = state.styleOptions;
      }

      if (state.title !== undefined) {
        initialVisConfig.title = state.title;
      }
      if (state.description !== undefined) {
        initialVisConfig.description = state.description;
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
      this.visConfig$.pipe(debounceTime(500)).subscribe((visConfig) =>
        this.syncToUrl({
          title: visConfig?.title,
          description: visConfig?.description,
          chartType: visConfig?.type,
          axesMapping: visConfig?.axesMapping,
          styleOptions: visConfig?.styles,
          splitField: visConfig?.splitField,
          splitLayout: visConfig?.splitLayout,
          showSplitLabel: visConfig?.showSplitLabel,
        })
      ),
      this.data$.subscribe((data) => this.onDataChange(data))
    );

    this.setIsInitialized(true);
  }

  setShowRawTable(on: boolean) {
    this.showRawTable$.next(on);
  }

  setRawTableRefId(refId?: string) {
    this.rawTableRefId$.next(refId);
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
    const newVisConfig: ChartConfig = {
      type: chartType,
      title: currentVisConfig?.title,
      description: currentVisConfig?.description,
    };

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
      title: currentConfig?.title,
      description: currentConfig?.description,
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
    schema: Array<{ type?: string; name?: string }>,
    seriesDisplayNames?: Record<string, string>
  ) {
    // when the pipeline changes, we need to re-apply the new pipeline against the previous raw data
    // cache the reference
    this.lastRawRows = rows;
    this.lastSchema = schema;
    this.seriesDisplayNames = seriesDisplayNames;

    const normalizedRows = normalizeSearchHits(rows);
    const { rows: transformedRows, finalSchema } = this.transformationService.applyPipeline(
      normalizedRows,
      schema
    );
    const { transformedData, numericalColumns, categoricalColumns, dateColumns, unknownColumns } =
      normalizeResultRows(transformedRows, finalSchema);

    this.data$.next({
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      unknownColumns,
      seriesDisplayNames: this.seriesDisplayNames,
    });
  }

  updateStyles(styles?: Partial<StyleOptions>) {
    const currentVisConfig = this.visConfig$.value;
    if (!currentVisConfig) {
      return;
    }
    if (currentVisConfig.styles) {
      this.visConfig$.next({
        ...currentVisConfig,
        styles: { ...currentVisConfig.styles, ...styles },
      });
    }
  }

  updatePanelSettings(settings: { title?: string; description?: string }) {
    const currentVisConfig = this.visConfig$.value;
    if (!currentVisConfig) {
      return;
    }

    const nextConfig = { ...currentVisConfig, ...settings };
    if (!isEqual(currentVisConfig, nextConfig)) {
      this.visConfig$.next(nextConfig);
    }
  }

  setVisConfig(config?: ChartConfig) {
    const newConfig = adaptLegacyData(config);
    this.visConfig$.next(newConfig);
  }

  setCurrentChartType(chartType?: ChartType) {
    if (this.visConfig$.value?.type !== chartType) {
      this.onChartTypeChange(chartType);
    }
  }

  setAxesMapping(mapping: AxisFieldNameMappings) {
    const config = this.visConfig$.value;
    if (config && !isEqual(normalizeMapping(config.axesMapping), normalizeMapping(mapping))) {
      this.visConfig$.next({ ...config, axesMapping: mapping });
    }
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

  syncToUrl(visState: VisState) {
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
    this.showRawTable$.complete();
    this.rawTableRefId$.complete();
    this.variables$.complete();
    this.savedVisSnapshot$.complete();
  }

  reset(): void {
    this.dispose();

    this.visConfig$ = new BehaviorSubject<ChartConfig | undefined>(undefined);
    this.data$ = new BehaviorSubject<VisData | undefined>(undefined);
    this.showRawTable$ = new BehaviorSubject<boolean>(false);
    this.rawTableRefId$ = new BehaviorSubject<string | undefined>(undefined);
    this.variables$ = new BehaviorSubject<VariableValue[]>([]);
    this.transformationService.reset();
    this.savedVisSnapshot$ = new BehaviorSubject<VisSnapshot | undefined>(undefined);
    this.lastRawRows = [];
    this.lastSchema = [];
    this.seriesDisplayNames = {};
    this.watchPipeline();
    this.isInitialized = false;
  }

  clearUrl() {
    this.syncToUrl({
      title: undefined,
      description: undefined,
      axesMapping: {},
      styleOptions: undefined,
      chartType: undefined,
    });
  }

  getRenderConfig$(): Observable<RenderChartConfig | undefined> {
    return this.visConfig$.pipe(
      map((config) => {
        if (config?.type) {
          const vis = visualizationRegistry.getVisualization(config.type);
          if (vis) {
            const styles: ChartStyles = mergeStyles(vis.ui.style.defaults, config.styles);
            return {
              title: config.title,
              description: config.description,
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

  private getVisualizationRenderConfig$(): Observable<RenderChartConfig | undefined> {
    return this.getRenderConfig$().pipe(
      map((config) => {
        if (!config) {
          return undefined;
        }

        // Panel metadata is persisted with the visualization but does not affect chart rendering.
        return {
          styles: config.styles,
          type: config.type,
          axesMapping: config.axesMapping,
          splitField: config.splitField,
          splitLayout: config.splitLayout,
          showSplitLabel: config.showSplitLabel,
        };
      }),
      distinctUntilChanged((previous, current) => isEqual(previous, current))
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
      config$: this.getVisualizationRenderConfig$(),
      showRawTable$: this.showRawTable$,
      variables$: this.variables$,
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
      onPanelSettingsChange: this.updatePanelSettings.bind(this),
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
