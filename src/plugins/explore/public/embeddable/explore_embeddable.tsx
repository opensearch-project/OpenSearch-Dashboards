/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEqual } from 'lodash';
import moment from 'moment';
import { merge, Subscription } from 'rxjs';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { i18n } from '@osd/i18n';
import { RequestAdapter, Adapters } from '../../../inspector/public';
import {
  opensearchFilters,
  Filter,
  TimeRange,
  FilterManager,
  getTime,
  Query,
  UI_SETTINGS,
  IFieldType,
} from '../../../data/public';
import { Container, Embeddable, IEmbeddable } from '../../../embeddable/public';
import {
  DashboardContainer,
  IVariableInterpolationService,
  createNoOpVariableInterpolationService,
} from '../../../dashboard/public';
import { ExploreInput, ExploreOutput } from './types';
import {
  getRequestInspectorStats,
  getResponseInspectorStats,
  getServices,
  IndexPattern,
  ISearchSource,
} from '../application/legacy/discover/opensearch_dashboards_services';
import { EXPLORE_EMBEDDABLE_TYPE } from './constants';
import { SortOrder } from '../types/saved_explore_types';
import { SavedExplore } from '../saved_explore';
import { ExploreEmbeddableComponent } from './explore_embeddable_component';
import { ExploreServices } from '../types';
import { ExpressionRendererEvent, ExpressionRenderError } from '../../../expressions/public';
import { AxisColumnMappings, VisColumn } from '../components/visualizations/types';
import { DOC_HIDE_TIME_COLUMN_SETTING, SAMPLE_SIZE_SETTING } from '../../common';
import * as columnActions from '../application/legacy/discover/application/utils/state_management/common';
import { buildColumns } from '../application/legacy/discover/application/utils/columns';
import { UiActionsStart, APPLY_FILTER_TRIGGER } from '../../../ui_actions/public';
import {
  ChartType,
  StyleOptions,
} from '../components/visualizations/utils/use_visualization_types';
import { defaultPrepareQueryString } from '../application/utils/state_management/actions/query_actions';
import {
  adaptLegacyData,
  convertStringsToMappings,
  isValidMapping,
} from '../components/visualizations/visualization_builder_utils';
import { normalizeResultRows } from '../components/visualizations/utils/normalize_result_rows';
import { visualizationRegistry } from '../components/visualizations/visualization_registry';
import { prepareQueryForLanguage } from '../application/utils/languages';
import { mergeStyles } from '../components/visualizations/utils/utils';

// TODO cleanup unused props
export interface SearchProps {
  description?: string;
  sort?: SortOrder[];
  inspectorAdapters?: Adapters;
  rows?: any[];
  indexPattern?: IndexPattern;
  hits?: number;
  isLoading?: boolean;
  services: ExploreServices;
  chartRender?: () => any;
  sharedItemTitle?: string;
  chartType?: ChartType;
  activeTab?: string;
  styleOptions?: StyleOptions;
  axisColumnMappings?: AxisColumnMappings;
  displayTimeColumn: boolean;
  title: string;
  columns?: string[];
  onSort?: (sort: SortOrder[]) => void;
  onAddColumn?: (column: string) => void;
  onRemoveColumn?: (column: string) => void;
  onReorderColumn?: (col: string, source: number, destination: number) => void;
  onMoveColumn?: (column: string, index: number) => void;
  onSetColumns?: (columns: string[]) => void;
  onFilter?: (field: IFieldType, value: string[], operator: string) => void;
  onExpressionEvent?: (e: ExpressionRendererEvent) => void;
  onSelectTimeRange?: (range: TimeRange) => void;
  tableData?: {
    rows: Array<Record<string, any>>;
    columns: VisColumn[];
  };
}

interface ExploreEmbeddableConfig {
  savedExplore: SavedExplore;
  editUrl: string;
  editPath: string;
  indexPatterns?: IndexPattern[];
  editable: boolean;
  filterManager: FilterManager;
  services: ExploreServices;
  editApp: string;
}

export class ExploreEmbeddable
  extends Embeddable<ExploreInput, ExploreOutput>
  implements IEmbeddable<ExploreInput, ExploreOutput> {
  private abortController?: AbortController;
  private readonly savedExplore: SavedExplore;
  private inspectorAdaptors: Adapters;
  private searchProps?: SearchProps;
  private filtersSearchSource?: ISearchSource;
  private subscription: Subscription;
  private autoRefreshFetchSubscription?: Subscription;
  public readonly type = EXPLORE_EMBEDDABLE_TYPE;
  private panelTitle: string = '';
  private filterManager: FilterManager;
  private services: ExploreServices;
  private prevState = {
    filters: undefined as Filter[] | undefined,
    query: undefined as Query | undefined,
    timeRange: undefined as TimeRange | undefined,
  };
  private node?: HTMLElement;
  private root?: Root;

  // Variable interpolation support
  private interpolationService: IVariableInterpolationService = createNoOpVariableInterpolationService();
  private variableSubscription?: Subscription;
  public originalQuery?: string;
  private lastInterpolatedQuery?: string;

  constructor(
    {
      savedExplore,
      editUrl,
      editPath,
      indexPatterns,
      editable,
      filterManager,
      services,
      editApp,
    }: ExploreEmbeddableConfig,
    initialInput: ExploreInput,
    private readonly executeTriggerActions: UiActionsStart['executeTriggerActions'],
    parent?: Container
  ) {
    super(
      initialInput,
      {
        defaultTitle: savedExplore.title,
        editUrl,
        editPath,
        editApp,
        indexPatterns,
        editable,
      },
      parent
    );
    this.services = services;
    this.filterManager = filterManager;
    this.savedExplore = savedExplore;
    this.inspectorAdaptors = {
      requests: new RequestAdapter(),
    };

    // Initialize variable support BEFORE search props so the interpolation
    // service is available for the initial query setup.
    this.initializeVariableSubscription(parent);
    this.initializeSearchProps();

    this.subscription = merge(this.getOutput$(), this.getInput$()).subscribe(() => {
      this.panelTitle = this.output.title || '';
      if (this.searchProps) {
        this.updateHandler(this.searchProps);
      }
    });
    this.autoRefreshFetchSubscription = getServices()
      .timefilter.getAutoRefreshFetch$()
      .subscribe(() => {
        if (this.searchProps) {
          this.updateHandler(this.searchProps, true);
        }
      });
  }

  /**
   * Initialize variable interpolation service and subscription
   * Variables are managed by the parent DashboardContainer
   */
  private initializeVariableSubscription(parent?: Container) {
    // Default to no-op interpolation service
    this.interpolationService = createNoOpVariableInterpolationService();

    if (parent && 'variableInterpolationService' in parent) {
      const dashboardContainer = (parent as unknown) as DashboardContainer;
      this.interpolationService = dashboardContainer.variableInterpolationService;

      if ('variableService' in dashboardContainer) {
        this.variableSubscription = dashboardContainer.variableService
          .getVariables$()
          .subscribe((variables) => {
            const hasLoading = variables.some((v) => 'loading' in v && v?.loading);
            if (hasLoading) return;

            this.handleVariablesChange();
          });
      }
    }
  }

  /**
   * Handle variable changes - interpolate query and refetch
   */
  private handleVariablesChange() {
    if (!this.originalQuery || !this.interpolationService.hasVariables(this.originalQuery)) {
      return;
    }

    const { searchSource } = this.savedExplore;
    const currentQuery = searchSource.getField('query');
    const interpolatedQuery = this.interpolationService.interpolate(
      this.originalQuery,
      currentQuery?.language
    );

    if (interpolatedQuery === this.lastInterpolatedQuery) {
      return;
    }
    this.lastInterpolatedQuery = interpolatedQuery;

    if (currentQuery) {
      searchSource.setField('query', {
        ...currentQuery,
        query: interpolatedQuery,
      });
    }

    if (this.searchProps) {
      this.updateHandler(this.searchProps, true);
    }
  }

  private initializeSearchProps() {
    const { searchSource } = this.savedExplore;
    const indexPattern = searchSource.getField('index');
    const searchProps: SearchProps = {
      inspectorAdapters: this.inspectorAdaptors,
      rows: [],
      description: this.savedExplore.description,
      services: this.services,
      indexPattern,
      isLoading: false,
      displayTimeColumn: this.services.uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING, false),
      title: this.savedExplore.title,
    };
    const timeRangeSearchSource = searchSource.create();
    timeRangeSearchSource.setField('filter', () => {
      if (!this.searchProps || !this.input.timeRange) return;
      return getTime(indexPattern, this.input.timeRange);
    });
    this.filtersSearchSource = searchSource.create();
    this.filtersSearchSource.setParent(timeRangeSearchSource);
    searchSource.setParent(this.filtersSearchSource);
    const query = this.savedExplore.searchSource.getField('query');
    const uiState = JSON.parse(this.savedExplore.uiState || '{}');
    const activeTab = uiState.activeTab;
    if (query) {
      // If the active tab is logs, we need to prepare the query for the logs tab
      if (activeTab === 'logs') {
        query.query = defaultPrepareQueryString(query);
      } else {
        query.query = prepareQueryForLanguage(query).query;
      }
    }

    // If the query contains variable placeholders, apply initial interpolation
    // using whatever current values are available (from saved state).
    const queryHasVariables =
      query?.query && this.interpolationService.hasVariables(String(query.query));
    if (queryHasVariables && query) {
      // Store the original (pre-interpolation) query for later use
      this.originalQuery = String(query.query);
      query.query = this.interpolationService.interpolate(this.originalQuery, query.language);
      this.lastInterpolatedQuery = String(query.query);
    }

    searchSource.setFields({
      index: indexPattern,
      query,
      highlightAll: true,
      version: true,
    });

    searchProps.onSort = (newSort) => {
      this.updateInput({ sort: newSort });
    };

    searchProps.onAddColumn = (columnName: string) => {
      if (!searchProps.columns) {
        return;
      }
      const updatedColumns = buildColumns(
        columnActions.addColumn(searchProps.columns, { column: columnName })
      );
      this.updateInput({ columns: updatedColumns });
    };

    searchProps.onRemoveColumn = (columnName: string) => {
      if (!searchProps.columns) {
        return;
      }
      const updatedColumns = columnActions.removeColumn(searchProps.columns, columnName);
      const updatedSort =
        searchProps.sort && searchProps.sort.length
          ? searchProps.sort.filter((s) => s[0] !== columnName)
          : [];
      this.updateInput({ sort: updatedSort, columns: updatedColumns });
    };

    searchProps.onMoveColumn = (columnName, newIndex: number) => {
      if (!searchProps.columns) {
        return;
      }
      const oldIndex = searchProps.columns.indexOf(columnName);
      const updatedColumns = columnActions.reorderColumn(searchProps.columns, oldIndex, newIndex);
      this.updateInput({ columns: updatedColumns });
    };

    searchProps.onSetColumns = (columnNames: string[]) => {
      const columns = buildColumns(columnNames);
      this.updateInput({ columns });
    };

    searchProps.onFilter = async (field, value, operator) => {
      let filters = opensearchFilters.generateFilters(
        this.filterManager,
        field,
        value,
        operator,
        indexPattern?.id!
      );
      filters = filters.map((filter) => ({
        ...filter,
        $state: { store: opensearchFilters.FilterStateStore.APP_STATE },
      }));
      await this.executeTriggerActions(APPLY_FILTER_TRIGGER, {
        embeddable: this,
        filters,
      });
    };

    searchProps.onExpressionEvent = async (e: ExpressionRendererEvent) => {
      if (e.name === 'applyFilter') {
        await this.executeTriggerActions(APPLY_FILTER_TRIGGER, {
          embeddable: this,
          ...e.data,
        });
      }
    };

    searchProps.onSelectTimeRange = async (range: TimeRange) => {
      await this.executeTriggerActions(APPLY_FILTER_TRIGGER, {
        embeddable: this,
        filters: [
          {
            // @ts-expect-error TS2353 TODO(ts-error): fixme
            range: {
              '*': {
                mode: 'absolute',
                gte: moment(range.from),
                lte: moment(range.to),
              },
            },
          },
        ],
        timeFieldName: '*',
      });
    };

    this.updateHandler(searchProps);
  }

  private async updateHandler(searchProps: SearchProps, force = false) {
    const { filters, query, timeRange } = this.input;
    const needFetch =
      force ||
      !opensearchFilters.onlyDisabledFiltersChanged(filters, this.prevState.filters) ||
      !isEqual(query, this.prevState.query) ||
      !isEqual(timeRange, this.prevState.timeRange);

    // If there is column or sort data on the panel, that means the original columns or sort settings have
    // been overridden in a dashboard.
    searchProps.columns = this.input.columns || this.savedExplore.columns;
    searchProps.sort = this.input.sort || this.savedExplore.sort;
    searchProps.sharedItemTitle = this.panelTitle;

    if (needFetch) {
      this.prevState = { filters, query, timeRange };
      this.searchProps = searchProps;
      try {
        await this.fetch();
      } catch (error: any) {
        this.updateOutput({
          loading: false,
          error: {
            name: error?.body?.error,
            message: error?.body?.message,
          },
        });
        throw error;
      }
    } else if (searchProps) {
      this.searchProps = searchProps;
    }
    if (this.node && this.searchProps) {
      this.renderComponent(this.node, this.searchProps);
    }
  }

  public reload() {
    if (this.searchProps) {
      this.updateHandler(this.searchProps, true);
    }
  }

  private fetch = async () => {
    if (!this.searchProps) return;
    const { searchSource } = this.savedExplore;
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();
    searchSource.setField('size', getServices().uiSettings.get(SAMPLE_SIZE_SETTING));

    this.inspectorAdaptors.requests.reset();
    const title = i18n.translate('explore.embeddable.inspectorRequestDataTitle', {
      defaultMessage: 'Data',
    });
    const description = i18n.translate('explore.embeddable.inspectorRequestDescription', {
      defaultMessage: 'This request queries OpenSearch to fetch the data for the explore.',
    });
    const inspectorRequest = this.inspectorAdaptors.requests.start(title, { description });
    inspectorRequest.stats(getRequestInspectorStats(searchSource));
    searchSource.getSearchRequestBody().then((body: Record<string, unknown>) => {
      inspectorRequest.json(body);
    });
    this.updateOutput({ loading: true, error: undefined });
    this.searchProps.isLoading = true;
    const query = searchSource.getField('query');
    const languageConfig = this.services.data.query.queryString
      .getLanguageService()
      .getLanguage(query!.language);
    const resp = await searchSource.fetch({
      abortSignal: this.abortController.signal,
      withLongNumeralsSupport: await getServices().uiSettings.get(
        UI_SETTINGS.DATA_WITH_LONG_NUMERALS
      ),
      ...(languageConfig &&
        languageConfig.fields?.formatter && {
          formatter: languageConfig.fields.formatter,
        }),
    });
    const rows = resp.hits.hits;
    const fieldSchema = searchSource.getDataFrame()?.schema;
    const visualizationData = normalizeResultRows(rows, fieldSchema ?? []);

    // TODO: Confirm if tab is in visualization but visualization is null, what to display?
    // const displayVis = rows?.length > 0 && visualizationData && visualizationData.ruleId;
    const visualization = JSON.parse(this.savedExplore.visualization || '{}');
    const uiState = JSON.parse(this.savedExplore.uiState || '{}');
    const selectedChartType = visualization.chartType ?? 'line';
    const vis = visualizationRegistry.getVisualization(selectedChartType);
    this.searchProps.chartType = selectedChartType;
    this.searchProps.activeTab = uiState.activeTab;
    this.searchProps.styleOptions = visualization.params;
    if (uiState.activeTab !== 'logs' && visualizationData) {
      const { numericalColumns, categoricalColumns, dateColumns } = visualizationData;
      const allColumns = [
        ...(numericalColumns ?? []),
        ...(categoricalColumns ?? []),
        ...(dateColumns ?? []),
      ];

      // Check if there's data to visualize
      if (visualizationData.transformedData && visualizationData.transformedData.length > 0) {
        if (selectedChartType === 'table') {
          this.searchProps.tableData = {
            columns: allColumns,
            rows: visualizationData.transformedData ?? [],
          };
        } else {
          const savedAxesMapping = visualization.axesMapping ?? {};
          let effectiveAxesMapping = savedAxesMapping;

          // Check if the saved axes mapping is still compatible with the current data columns.
          if (!isValidMapping(savedAxesMapping, allColumns)) {
            const reusedMapping = visualizationRegistry.reuseAxesMapping(
              selectedChartType,
              savedAxesMapping,
              allColumns
            );

            if (reusedMapping) {
              effectiveAxesMapping = reusedMapping;
            }
          }

          const axesMapping = convertStringsToMappings(effectiveAxesMapping, allColumns);
          this.searchProps.axisColumnMappings = axesMapping;
          const matchedRule = visualizationRegistry.findRuleByAxesMapping(
            selectedChartType,
            effectiveAxesMapping,
            allColumns
          );
          if (!matchedRule) {
            throw new Error(
              `Cannot load saved visualization "${this.panelTitle}" with id ${this.savedExplore.id}`
            );
          }
          const searchContext = {
            query: this.input.query,
            filters: this.input.filters,
            timeRange: this.input.timeRange,
          };
          const styleOptions = visualization.params;

          let styles = adaptLegacyData({
            type: selectedChartType,
            styles: styleOptions,
            axesMapping: effectiveAxesMapping,
          })?.styles;

          if (vis) {
            styles = mergeStyles(vis.ui.style.defaults, styles);
          }
          this.searchProps.styleOptions = styles;

          const chartRender = () =>
            matchedRule.render({
              transformedData: visualizationData.transformedData,
              styleOptions: styles || styleOptions,
              onSelectTimeRange: this.searchProps?.onSelectTimeRange,
              axisColumnMappings: axesMapping,
              timeRange: searchContext.timeRange,
            });
          this.searchProps.chartRender = chartRender;
        }
      }
    }
    this.updateOutput({ loading: false, error: undefined });
    inspectorRequest.stats(getResponseInspectorStats(resp, searchSource)).ok({ json: resp });
    this.searchProps.rows = rows;
    // NOTE: PPL response is not the same as OpenSearch response, resp.hits.total here is 0.
    this.searchProps.hits = resp.hits.hits.length;
    this.searchProps.isLoading = false;
  };

  private renderComponent(node: HTMLElement, searchProps: SearchProps) {
    if (!this.searchProps || !this.root) return;
    const MemorizedExploreEmbeddableComponent = React.memo(ExploreEmbeddableComponent);
    this.root.render(<MemorizedExploreEmbeddableComponent searchProps={searchProps} />);
  }

  public destroy() {
    super.destroy();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (this.autoRefreshFetchSubscription) {
      this.autoRefreshFetchSubscription.unsubscribe();
    }

    // Cleanup variable subscription
    if (this.variableSubscription) {
      this.variableSubscription.unsubscribe();
    }

    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.searchProps) {
      delete this.searchProps;
    }
    if (this.root) {
      this.root.unmount();
    }
  }

  onContainerError = (error: ExpressionRenderError) => {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.renderComplete.dispatchError();
    this.updateOutput({ loading: false, error });
  };

  public render(node: HTMLElement) {
    if (!this.searchProps) {
      throw new Error('Search scope not defined');
    }
    if (this.root) {
      this.root.unmount();
    }
    this.node = node;
    this.node.style.height = '100%';
    this.root = createRoot(node);
  }

  public getInspectorAdapters() {
    return this.inspectorAdaptors;
  }
}
