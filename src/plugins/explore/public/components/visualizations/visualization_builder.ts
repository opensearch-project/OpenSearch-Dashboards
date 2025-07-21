/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Subscription } from 'rxjs';
import { isEmpty, isEqual } from 'lodash';
import { ChartType, StyleOptions } from './utils/use_visualization_types';
import {
  convertMappingsToStrings,
  findRuleByIndex,
  getColumnMatchFromMapping,
  isValidMapping,
} from './visualization_container_utils';
import { getServices } from '../../services/services';
import { IOsdUrlStateStorage } from '../../../../opensearch_dashboards_utils/public';
import { OpenSearchSearchHit } from '../../types/doc_views_types';
import { isChartType } from './utils/is_chart_type';
import { visualizationRegistry } from './visualization_registry';
import { VisColumn } from './types';
import { normalizeResultRows } from './utils/normalize_result_rows';

interface VisState {
  styleOptions?: StyleOptions;
  chartType?: string;
  axesMapping?: Record<string, string>;
}

export interface VisData {
  transformedData: Array<Record<string, any>>;
  dateColumns: VisColumn[];
  numericalColumns: VisColumn[];
  categoricalColumns: VisColumn[];
}

interface ChartConfig {
  type: ChartType;
  styles: StyleOptions;
}

export class VisualizationBuilder {
  private isInitialized = false;
  private urlStateStorage?: IOsdUrlStateStorage;
  private subscriptions = Array<Subscription>();

  // TODO: we also store chart type in styles$, consider to refactor this to get rid of one of them
  currentChartType$ = new BehaviorSubject<ChartType | undefined>(undefined);
  styles$ = new BehaviorSubject<ChartConfig | undefined>(undefined);
  axesMapping$ = new BehaviorSubject<Record<string, string>>({});
  data$ = new BehaviorSubject<VisData | undefined>(undefined);

  constructor({ urlStateStorage }: { urlStateStorage?: IOsdUrlStateStorage }) {
    this.urlStateStorage = urlStateStorage;
  }

  init(initialState: VisState) {
    if (this.isInitialized) {
      return;
    }

    let state = { ...initialState };

    // Read state from url
    if (this.urlStateStorage) {
      const urlState = this.urlStateStorage.get<VisState>('_v');
      state = { ...state, ...urlState };
    }

    // update visualization state accordingly
    if (state.chartType && isChartType(state.chartType)) {
      this.setCurrentChartType(state.chartType);

      if (state.styleOptions) {
        this.setStyles({ styles: state.styleOptions, type: state.chartType });
      }
    }

    if (state.axesMapping) {
      this.setAxesMapping(state.axesMapping);
    }

    // Subscribe to visualization state updates and sync the state to url
    this.subscriptions.push(
      this.currentChartType$.subscribe((v) => this.syncToUrl('chartType', v)),
      this.axesMapping$.subscribe((v) => this.syncToUrl('axesMapping', v)),
      this.styles$.subscribe((v) => this.syncToUrl('styleOptions', v?.styles))
    );

    const chartTypeSub = this.currentChartType$.subscribe((chartType) => {
      if (!chartType || !isChartType(chartType)) {
        return;
      }

      const visConfig = visualizationRegistry.getVisualizationConfig(chartType);
      if (!visConfig) {
        return;
      }

      // Always reset style after changing chart type
      const currentStyleConfig = this.styles$.value;
      if (currentStyleConfig?.type !== chartType) {
        this.setStyles({ styles: visConfig.ui.style.defaults, type: chartType });
      }

      const data = this.data$.value;
      const allColumns = [
        ...(data?.numericalColumns ?? []),
        ...(data?.categoricalColumns ?? []),
        ...(data?.dateColumns ?? []),
      ];
      const currentRule = findRuleByIndex(this.axesMapping$.value, allColumns);

      // Table chart doesn't have axes mapping
      if (chartType === 'table') {
        this.setAxesMapping({});
        return;
      }

      // Try to reuse the current fields(from axes mapping) for the new chart type
      if (!isEmpty(this.axesMapping$.value) && currentRule) {
        const isChartTypeInCurrentRule = currentRule.chartTypes.find(
          (chart) => chart.type === chartType
        );
        if (isChartTypeInCurrentRule) {
          const reusedMapping = visConfig.ui.availableMappings.find((obj) =>
            isEqual(getColumnMatchFromMapping(obj.mapping), currentRule.matchIndex)
          )?.mapping[0];
          if (reusedMapping) {
            const updatedMapping: Record<string, string> = {};
            Object.entries(reusedMapping).forEach(([key, config]) => {
              const matchingColumn = Object.values(this.axesMapping$.value).find((columnName) => {
                const column = allColumns.find((col) => col.name === columnName);
                return column?.schema === config.type;
              });
              if (matchingColumn) {
                updatedMapping[key] = matchingColumn;
              }
            });
            this.setAxesMapping(updatedMapping);
            return;
          }
        }
      }
    });
    this.subscriptions.push(chartTypeSub);

    const dataSub = this.data$.subscribe((data) => {
      if (!data) {
        return;
      }

      const { numericalColumns, categoricalColumns, dateColumns } = data;
      const columns = [...numericalColumns, ...categoricalColumns, ...dateColumns];

      // Do nothing for table, as any data can render with a table
      if (this.currentChartType$.value === 'table') {
        return;
      }

      // Metric chart cannot be created from multiple data points
      const invalidMetricData =
        columns.length > 0 &&
        columns[0].validValuesCount > 1 &&
        this.currentChartType$.value === 'metric';

      // Try to create auto-chart based on the received data if:
      // 1. it has multiple data points, but the current chart type if 'metric'
      // 2. no current axes mapping
      // 3. has axes mapping, but the mapping is incompatible with the received data
      if (
        invalidMetricData ||
        isEmpty(this.axesMapping$.value) ||
        !isValidMapping(this.axesMapping$.value, columns)
      ) {
        const isApplied = this.applyBestMatchedRule(
          numericalColumns,
          categoricalColumns,
          dateColumns
        );
        // If auto-chart cannot be created, reset vis state so that user will start by selecting a chart type first
        if (!isApplied) {
          this.setCurrentChartType(undefined);
          this.setAxesMapping({});
          this.setStyles(undefined);
        }
        return;
      }

      // The current axes mappings can be applied to the data,
      // it will just use the current chart type and axes mapping
      if (isValidMapping(this.axesMapping$.value, columns)) {
        return;
      }

      // All other cases will fallback to reset vis state and let user to choose
      this.setCurrentChartType(undefined);
      this.setAxesMapping({});
      this.setStyles(undefined);
    });
    this.subscriptions.push(dataSub);

    this.isInitialized = true;
  }
  /**
   * Infer a chart type based on the provided data
   * If a chart can be created automatically, update the chart type and its styles and axes mapping accordingly
   */
  applyBestMatchedRule(
    numericalColumns: VisColumn[],
    categoricalColumns: VisColumn[],
    dateColumns: VisColumn[]
  ) {
    const bestMatch = visualizationRegistry.findBestMatch(
      numericalColumns,
      categoricalColumns,
      dateColumns
    );

    if (!bestMatch) {
      return false;
    }

    const mappingObj = visualizationRegistry.getDefaultAxesMapping(
      bestMatch.rule,
      bestMatch.chartType.type,
      numericalColumns,
      categoricalColumns,
      dateColumns
    );
    const visConfig = visualizationRegistry.getVisualizationConfig(bestMatch.chartType.type);
    this.setCurrentChartType(bestMatch.chartType.type as ChartType);
    this.setAxesMapping(convertMappingsToStrings(mappingObj));
    this.updateStyles(visConfig?.ui.style.defaults);
    return true;
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
    const currentStyles = this.styles$.value;
    if (!currentStyles) {
      return;
    }
    if (currentStyles.styles) {
      this.styles$.next({
        type: currentStyles.type,
        styles: { ...currentStyles.styles, ...styles } as StyleOptions,
      });
    }
  }

  setStyles(styles?: ChartConfig) {
    this.styles$.next(styles);
  }

  setCurrentChartType(chartType?: ChartType) {
    if (this.currentChartType$.value !== chartType) {
      this.currentChartType$.next(chartType);
    }
  }

  setAxesMapping(mapping: Record<string, string>) {
    this.axesMapping$.next(mapping);
  }

  syncToUrl<State>(key: string, value: State) {
    if (this.urlStateStorage) {
      const current = this.urlStateStorage.get<VisState>('_v');
      this.urlStateStorage.set('_v', { ...current, [key]: value }, { replace: true });
    }
  }

  dispose(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    this.currentChartType$.complete();
    this.styles$.complete();
    this.axesMapping$.complete();
    this.data$.complete();
  }

  reset(): void {
    this.dispose();

    this.currentChartType$ = new BehaviorSubject<ChartType | undefined>(undefined);
    this.styles$ = new BehaviorSubject<ChartConfig | undefined>(undefined);
    this.axesMapping$ = new BehaviorSubject<Record<string, string>>({});
    this.data$ = new BehaviorSubject<VisData | undefined>(undefined);
    this.isInitialized = false;
  }
}

let visualizationBuilder: VisualizationBuilder;

export const getVisualizationBuilder = () => {
  if (!visualizationBuilder) {
    const services = getServices();
    visualizationBuilder = new VisualizationBuilder({
      urlStateStorage: services.osdUrlStateStorage,
    });
  }
  return visualizationBuilder;
};
