/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, Subscription, combineLatest, of } from 'rxjs';
import { isEmpty, isEqual } from 'lodash';
import { debounceTime } from 'rxjs/operators';

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
  // TODO: refactor to subscribe to changes$ from external
  changes$: Observable<
    [ChartType | undefined, ChartConfig | undefined, Record<string, string>]
  > = of([undefined, undefined, {}]);

  constructor({ urlStateStorage }: { urlStateStorage?: IOsdUrlStateStorage }) {
    this.urlStateStorage = urlStateStorage;
  }

  init() {
    if (this.isInitialized) {
      return;
    }

    let state: VisState = {};

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

      if (state.axesMapping) {
        this.setAxesMapping(state.axesMapping);
      }
    }

    // Subscribe to visualization state updates and sync the state to url
    this.subscriptions.push(
      combineLatest([
        this.currentChartType$,
        this.axesMapping$,
        this.styles$,
      ]).subscribe(([chartType, axesMapping, styles]) =>
        this.syncToUrl({ chartType, axesMapping, styleOptions: styles?.styles })
      ),
      this.currentChartType$.subscribe((chartType) => this.onChartTypeChange(chartType)),
      this.data$.subscribe((data) =>
        this.onDataChange(data, this.currentChartType$.value, this.axesMapping$.value)
      )
    );

    this.isInitialized = true;
  }

  onChartTypeChange(chartType?: ChartType) {
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

    // Table chart doesn't have axes mapping
    if (chartType === 'table') {
      this.setAxesMapping({});
      return;
    }

    // Reuse current axes mapping for the new chart type if possible
    const newAxesMapping = this.reuseCurrentAxesMapping(
      chartType,
      this.axesMapping$.value,
      this.data$.value
    );
    if (newAxesMapping) {
      this.setAxesMapping(newAxesMapping);
      return;
    }

    // Auto create visualization for the new chart type based on the rules,
    // and use the new axes mapping from the matched rule.
    const autoVis = this.createAutoVis(this.data$.value, chartType);
    if (autoVis) {
      this.setAxesMapping(autoVis.axesMapping);
      return;
    }

    // Lastly, for the given chart type, we cannot reuse current axes mapping, also we cannot find a rule to auto create the chart
    // Reset the axes mapping to empty and let user to choose the fields for the axes mapping
    this.setAxesMapping({});
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

    const currentRule = findRuleByIndex(axesMapping, allColumns);
    if (!isEmpty(axesMapping) && currentRule) {
      const isChartTypeInCurrentRule = currentRule.chartTypes.find(
        (chart) => chart.type === chartType
      );
      if (isChartTypeInCurrentRule) {
        const reusedMapping = visConfig.ui.availableMappings.find((obj) =>
          isEqual(getColumnMatchFromMapping(obj.mapping), currentRule.matchIndex)
        )?.mapping[0];
        if (reusedMapping) {
          const updatedMapping: Record<string, string> = {};
          const availableAxesMapping = new Map(Object.entries(axesMapping));
          Object.entries(reusedMapping).forEach(([key, config]) => {
            const matchingColumn = Array.from(availableAxesMapping.entries()).find(
              ([role, columnName]) => {
                const column = allColumns.find((col) => col.name === columnName);
                const found = column?.schema === config.type;
                if (found) {
                  availableAxesMapping.delete(role);
                  return found;
                }
              }
            );
            if (matchingColumn) {
              updatedMapping[key] = matchingColumn[1];
            }
          });
          return updatedMapping;
        }
      }
    }
  }

  /**
   * For the given data, we need to check if the current chart type and axes mapping can be applied
   */
  onDataChange(data?: VisData, currentChartType?: ChartType, axesMapping?: Record<string, string>) {
    if (!data) {
      return;
    }

    // Do nothing for table, as any data can render with a table
    if (currentChartType === 'table') {
      return;
    }

    const columns = [...data.numericalColumns, ...data.categoricalColumns, ...data.dateColumns];

    // Metric chart cannot be created from multiple data points
    const invalidMetricData =
      columns.length > 0 && columns[0].validValuesCount > 1 && currentChartType === 'metric';

    // We cannot apply the current chart type and axes mapping if:
    // 1. The current chart type if 'metric', but it has multiple data points
    // 2. It has axes mapping, but the mapping is incompatible with the received data
    // 3. No current axes mapping
    // For these cases, we will create auto vis based on the rules. If not auto vis can be created,
    // reset chart type and axes mapping to empty, this will let user to choose.
    if (invalidMetricData || isEmpty(axesMapping) || !isValidMapping(axesMapping ?? {}, columns)) {
      const autoVis = this.createAutoVis(data);
      if (autoVis) {
        const visConfig = visualizationRegistry.getVisualizationConfig(autoVis.chartType);
        if (visConfig) {
          this.setCurrentChartType(autoVis.chartType);
          this.setAxesMapping(autoVis.axesMapping);
          this.setStyles({ styles: visConfig?.ui.style.defaults, type: autoVis.chartType });
        }
      } else {
        this.setCurrentChartType(undefined);
        this.setAxesMapping({});
        this.setStyles(undefined);
      }
      return;
    }

    // The current axes mappings can be applied to the data,
    // it will just use the current chart type and axes mapping
    if (isValidMapping(axesMapping ?? {}, columns)) {
      return;
    }

    // All other cases will fallback to reset vis state and let user to choose
    this.setCurrentChartType(undefined);
    this.setAxesMapping({});
    this.setStyles(undefined);
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

  syncToUrl<State>(visState: VisState) {
    if (this.urlStateStorage) {
      this.urlStateStorage.set('_v', visState, { replace: true });
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
    this.changes$ = combineLatest([this.currentChartType$, this.styles$, this.axesMapping$]).pipe(
      debounceTime(500)
    );
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
