/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEqual } from 'lodash';
import moment from 'moment';
import { merge, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { createRoot, Root } from 'react-dom/client';
import { i18n } from '@osd/i18n';
import { RequestAdapter, DataAdapter, Adapters, FormattedData } from '../../../inspector/public';
import {
  opensearchFilters,
  Filter,
  TimeRange,
  FilterManager,
  getTime,
  Query,
  UI_SETTINGS,
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
import { SavedExplore } from '../saved_explore';
import { ExploreEmbeddableComponent } from './explore_embeddable_component';
import { ExploreServices } from '../types';
import { ExpressionRenderError } from '../../../expressions/public';
import { AxisFieldNameMappings, RenderChartConfig } from '../components/visualizations/types';
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
  isValidMapping,
} from '../components/visualizations/visualization_builder_utils';
import {
  normalizeResultRows,
  normalizeSearchHits,
} from '../components/visualizations/utils/normalize_result_rows';
import { visualizationRegistry } from '../components/visualizations/visualization_registry';
import { prepareQueryForLanguage } from '../application/utils/languages';
import { mergeStyles } from '../components/visualizations/utils/utils';
import { SplitLayout, VisData } from '../components/visualizations/visualization_builder.types';
import {
  TransformationService,
  registerAllTransformations,
} from '../components/data_transformations';
import { NormalizedRow, UrlTransformationState } from '../components/data_transformations/types';
import { PanelDataService } from './panel_data_service';
import {
  ExploreEmbeddableContent,
  ExploreEmbeddableError,
  ExploreEmbeddableState,
} from './explore_embeddable_state';
import { DocViewFilterFn } from '../types/doc_views_types';

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

interface VisualizationMetadata {
  title?: string;
  description?: string;
}

interface SavedVisualizationState extends VisualizationMetadata {
  chartType?: ChartType;
  params?: StyleOptions;
  axesMapping?: AxisFieldNameMappings;
  splitField?: string;
  splitLayout?: SplitLayout;
  showSplitLabel?: boolean;
  dataTransformations?: UrlTransformationState[];
}

const parseJson = <T extends object>(value?: string): T => {
  try {
    const parsed = value ? JSON.parse(value) : undefined;
    return parsed && typeof parsed === 'object' ? (parsed as T) : ({} as T);
  } catch {
    return {} as T;
  }
};

const UNSAVED_DASHBOARD_CROSSHAIR_GROUP = 'dashboard-unsaved';

export const getCrosshairGroup = (
  useSharedCrosshair: boolean | undefined,
  containerId: string | undefined
) => (useSharedCrosshair ? containerId || UNSAVED_DASHBOARD_CROSSHAIR_GROUP : undefined);

export class ExploreEmbeddable
  extends Embeddable<ExploreInput, ExploreOutput>
  implements IEmbeddable<ExploreInput, ExploreOutput>
{
  private abortController?: AbortController;
  // A data fetch was requested while not visible and must run once visible again.
  private pendingFetchOnResume: boolean = false;
  private readonly savedExplore: SavedExplore;
  private inspectorAdaptors: Adapters;
  private filtersSearchSource?: ISearchSource;
  private inputSubscription?: Subscription;
  private autoRefreshFetchSubscription?: Subscription;
  private panelMetadataVariableSubscription?: Subscription;
  public readonly type = EXPLORE_EMBEDDABLE_TYPE;
  private filterManager: FilterManager;
  private services: ExploreServices;
  private readonly indexPattern?: IndexPattern;
  private state?: ExploreEmbeddableState;
  private prevState = {
    filters: undefined as Filter[] | undefined,
    query: undefined as Query | undefined,
    timeRange: undefined as TimeRange | undefined,
  };
  private node?: HTMLElement;
  private root?: Root;

  // Variable interpolation support
  private interpolationService: IVariableInterpolationService =
    createNoOpVariableInterpolationService();
  private variableSubscription?: Subscription;
  public originalQuery?: string;
  private lastInterpolatedQuery?: string;

  // Data transformation support
  private transformationService: TransformationService;
  private readonly activeTab?: string;
  private readonly visualization: SavedVisualizationState;

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
    const activeTab = parseJson<{ activeTab?: string }>(savedExplore.uiState).activeTab;
    const visualization = parseJson<SavedVisualizationState>(savedExplore.visualization);
    super(
      initialInput,
      {
        defaultTitle: visualization.title || savedExplore.title,
        description: visualization.description,
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
    this.activeTab = activeTab;
    this.visualization = visualization;
    this.indexPattern = savedExplore.searchSource.getField('index') ?? undefined;
    // manage data adapters for CSV export
    this.inspectorAdaptors = {
      requests: new RequestAdapter(),
      data: new DataAdapter(),
    };
    // Initialize transformation service
    this.transformationService = new TransformationService();
    registerAllTransformations(this.transformationService);

    this.initializeTransformationPipeline();

    // Initialize variable support before SearchSource setup so the interpolation
    // service is available for the initial query.
    this.initializeVariableSubscription(parent);
    this.initializeSearchSource();

    this.inputSubscription = this.getInput$().subscribe(() => {
      this.handleInputChange();
    });
    this.autoRefreshFetchSubscription = getServices()
      .timefilter.getAutoRefreshFetch$()
      .subscribe(() => {
        this.handleInputChange(true);
      });
    // Must include output$ here: when a panel title is edited, the base Embeddable.onResetInput()
    // fires input$.next() (which triggers handlePanelMetadataVariables correctly) but then immediately
    // overwrites the output title with the raw un-interpolated input.title via getPanelTitle().
    // Subscribing to output$ ensures handlePanelMetadataVariables re-applies variable interpolation
    // after that overwrite. The isEqual guard in updateOutput() prevents infinite loops.
    if (parent && 'variableService' in parent) {
      const dashboardContainer = parent as unknown as DashboardContainer;
      this.panelMetadataVariableSubscription = merge(
        this.getInput$(),
        this.getOutput$().pipe(
          map(({ title }) => title),
          distinctUntilChanged()
        ),
        dashboardContainer.variableService.getVariables$()
      ).subscribe(this.handlePanelMetadataVariables);
    }
  }

  // initialize transformation pipeline from saved explore
  private initializeTransformationPipeline() {
    const { dataTransformations } = this.visualization;
    if (dataTransformations) {
      this.transformationService.restoreFromState(dataTransformations);
    }
  }

  private handlePanelMetadataVariables = () => {
    let panelTitle = this.output.title ?? '';
    if (this.input.title && this.interpolationService.hasVariables(this.input.title)) {
      panelTitle = this.interpolationService.interpolate(this.input.title);
    } else {
      const defaultTitle = this.visualization.title || this.savedExplore.title;
      if (this.interpolationService.hasVariables(defaultTitle)) {
        panelTitle = this.interpolationService.interpolate(defaultTitle);
      }
    }

    const description = this.visualization.description;
    const panelDescription =
      description && this.interpolationService.hasVariables(description)
        ? this.interpolationService.interpolate(description)
        : description;

    this.updateOutput({ title: panelTitle, description: panelDescription });
  };

  public getDescription() {
    return this.output.description;
  }

  /**
   * Initialize variable interpolation service and subscription
   * Variables are managed by the parent DashboardContainer
   */
  private initializeVariableSubscription(parent?: Container) {
    // Default to no-op interpolation service
    this.interpolationService = createNoOpVariableInterpolationService();

    if (parent && 'variableInterpolationService' in parent) {
      const dashboardContainer = parent as unknown as DashboardContainer;
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

    this.handleInputChange(true);
  }

  private initializeSearchSource() {
    const { searchSource } = this.savedExplore;
    const timeRangeSearchSource = searchSource.create();
    timeRangeSearchSource.setField('filter', () => {
      if (!this.input.timeRange) return;
      return getTime(this.indexPattern, this.input.timeRange);
    });
    this.filtersSearchSource = searchSource.create();
    this.filtersSearchSource.setParent(timeRangeSearchSource);
    searchSource.setParent(this.filtersSearchSource);
    const query = this.savedExplore.searchSource.getField('query');
    if (query) {
      // If the active tab is logs, we need to prepare the query for the logs tab
      if (this.activeTab === 'logs') {
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
      index: this.indexPattern,
      query,
      highlightAll: true,
      version: true,
    });
  }

  private getSelectedColumns() {
    return this.input.columns || this.savedExplore.columns;
  }

  private onAddColumn = (columnName: string) => {
    const columns = this.getSelectedColumns();
    if (!columns) {
      return;
    }

    const updatedColumns = buildColumns(columnActions.addColumn(columns, { column: columnName }));
    this.updateInput({ columns: updatedColumns });
  };

  private onRemoveColumn = (columnName: string) => {
    const columns = this.getSelectedColumns();
    if (!columns) {
      return;
    }

    const sort = this.input.sort || this.savedExplore.sort;
    const updatedColumns = columnActions.removeColumn(columns, columnName);
    const updatedSort = sort?.length ? sort.filter(([field]) => field !== columnName) : [];
    this.updateInput({ sort: updatedSort, columns: updatedColumns });
  };

  private onFilter: DocViewFilterFn = (mapping, value, mode) => {
    if (!this.indexPattern) {
      return;
    }

    const fieldName =
      typeof mapping === 'string'
        ? mapping
        : mapping && typeof mapping === 'object' && 'name' in mapping
          ? mapping.name
          : undefined;
    if (!fieldName) {
      return;
    }

    const field = this.indexPattern.getFieldByName(fieldName);
    if (!field) {
      return;
    }

    const values = Array.isArray(value) ? value.map(String) : [String(value)];
    let filters = opensearchFilters.generateFilters(
      this.filterManager,
      field,
      values,
      mode,
      this.indexPattern.id!
    );
    filters = filters.map((filter) => ({
      ...filter,
      $state: { store: opensearchFilters.FilterStateStore.APP_STATE },
    }));

    this.executeTriggerActions(APPLY_FILTER_TRIGGER, {
      embeddable: this,
      filters,
    });
  };

  private onSelectTimeRange = (range?: TimeRange) => {
    if (!range) {
      return;
    }

    this.executeTriggerActions(APPLY_FILTER_TRIGGER, {
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

  private async handleInputChange(force = false) {
    // Pause fetching while not visible (e.g. a collapsed section); record the
    // owed fetch and flush it once on resume. All fetch paths funnel through here.
    if (this.input.isVisible === false) {
      this.pendingFetchOnResume = true;
      return;
    }
    const resumeFetch = this.pendingFetchOnResume;
    this.pendingFetchOnResume = false;

    const { filters, query, timeRange } = this.input;
    // no fetch until the panel is mounted in the viewport and render(node) sets this.node.
    const needFetch = Boolean(
      this.node &&
      (force ||
        resumeFetch ||
        !opensearchFilters.onlyDisabledFiltersChanged(filters, this.prevState.filters) ||
        !isEqual(query, this.prevState.query) ||
        !isEqual(timeRange, this.prevState.timeRange))
    );

    if (needFetch) {
      this.prevState = { filters, query, timeRange };

      // Apply dashboard filters to the SearchSource (same as PPL)
      if (this.filtersSearchSource) {
        this.filtersSearchSource.setField('filter', filters || []);
      }

      await this.fetch();
      return;
    }

    this.renderComponent();
  }

  public reload() {
    this.handleInputChange(true);
  }

  private fetch = async () => {
    this.abortController?.abort();
    const abortController = new AbortController();
    this.abortController = abortController;

    this.updateOutput({ loading: true, error: undefined });

    try {
      const content = await this.fetchContent(abortController.signal, { ...this.input.timeRange });
      if (abortController.signal.aborted) {
        return;
      }
      this.transitionToReady(content);
    } catch (error) {
      if (abortController.signal.aborted || this.isAbortError(error)) {
        return;
      }
      this.transitionToError(this.normalizeError(error));
    } finally {
      if (this.abortController === abortController) {
        this.abortController = undefined;
      }
    }
  };

  private fetchContent = async (
    abortSignal: AbortSignal,
    timeRange: TimeRange
  ): Promise<ExploreEmbeddableContent> => {
    const { searchSource } = this.savedExplore;
    const sampleSize = this.services.uiSettings.get(SAMPLE_SIZE_SETTING);
    searchSource.setField('size', sampleSize);

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
    const query = searchSource.getField('query');
    const languageConfig = query
      ? this.services.data.query.queryString.getLanguageService().getLanguage(query.language)
      : undefined;
    const resp = await searchSource.fetch({
      abortSignal,
      withLongNumeralsSupport: await this.services.uiSettings.get(
        UI_SETTINGS.DATA_WITH_LONG_NUMERALS
      ),
      ...(languageConfig &&
        languageConfig.fields?.formatter && {
          formatter: languageConfig.fields.formatter,
        }),
    });

    const rawRows = resp.hits.hits;
    const dataFrame = searchSource.getDataFrame();
    const fieldSchema = dataFrame?.schema;
    const normalizedRows = normalizeSearchHits(rawRows);
    const { rows: transformedRows, finalSchema } = this.transformationService.applyPipeline(
      normalizedRows,
      fieldSchema ?? []
    );

    const visualizationData: VisData = {
      ...normalizeResultRows(transformedRows, finalSchema ?? []),
      seriesDisplayNames: dataFrame?.meta?.seriesDisplayNames as Record<string, string>,
    };

    const visualization = this.visualization;
    const selectedChartType = visualization.chartType ?? 'line';
    const { numericalColumns, categoricalColumns, dateColumns, unknownColumns } = visualizationData;
    const allColumns = [
      ...(numericalColumns ?? []),
      ...(categoricalColumns ?? []),
      ...(dateColumns ?? []),
      ...(unknownColumns ?? []),
    ];

    let content: ExploreEmbeddableContent;
    if (this.activeTab === 'logs') {
      if (!this.indexPattern) {
        throw new Error('Cannot render the Explore logs table without a data view');
      }

      content = {
        kind: 'logs',
        dataset: this.indexPattern,
        sampleSize,
        rows: rawRows,
        // NOTE: PPL response is not the same as an OpenSearch response, so resp.hits.total is 0.
        hits: rawRows.length,
      };
    } else if (selectedChartType === 'table') {
      content = {
        kind: 'table',
        rows: visualizationData.transformedData as NormalizedRow[],
        columns: allColumns,
        config: {
          type: 'table',
          axesMapping: visualization.axesMapping,
          styles: (visualization.params ?? {}) as RenderChartConfig['styles'],
          splitField: visualization.splitField,
          splitLayout: visualization.splitLayout ?? 'auto',
          showSplitLabel: visualization.showSplitLabel ?? false,
        },
      };
    } else {
      const savedAxesMapping = visualization.axesMapping ?? {};
      const styleOptions = visualization.params;
      let effectiveAxesMapping = savedAxesMapping;
      let styles = styleOptions;
      let splitField = visualization.splitField;

      if (visualizationData.transformedData.length > 0) {
        // Apply legacy migration (FACET→splitField, threshold conversions).
        const migratedConfig = adaptLegacyData({
          type: selectedChartType,
          styles: styleOptions,
          axesMapping: savedAxesMapping,
        });
        effectiveAxesMapping = migratedConfig?.axesMapping ?? savedAxesMapping;
        styles = migratedConfig?.styles;
        splitField = visualization.splitField ?? migratedConfig?.splitField;

        // Check if the axes mapping is still compatible with the current data columns.
        if (!isValidMapping(effectiveAxesMapping, allColumns)) {
          const reusedMapping = visualizationRegistry.reuseAxesMapping(
            selectedChartType,
            effectiveAxesMapping,
            allColumns
          );
          if (reusedMapping) {
            effectiveAxesMapping = reusedMapping;
          }
        }

        const matchedRule = visualizationRegistry.findRuleByAxesMapping(
          selectedChartType,
          effectiveAxesMapping,
          allColumns
        );
        if (!matchedRule) {
          throw new Error(
            `Cannot load saved visualization "${this.getTitle()}" with id ${this.savedExplore.id}`
          );
        }

        const vis = visualizationRegistry.getVisualization(selectedChartType);
        if (vis) {
          styles = mergeStyles(vis.ui.style.defaults, styles);
        }
      }

      const config: RenderChartConfig = {
        type: selectedChartType,
        axesMapping: effectiveAxesMapping,
        styles: (styles ?? styleOptions ?? {}) as RenderChartConfig['styles'],
        splitField,
        splitLayout: visualization.splitLayout ?? 'auto',
        showSplitLabel: visualization.showSplitLabel ?? false,
      };
      content = {
        kind: 'chart',
        // The panel's saved query picks the empty state's samples.
        query: { language: query?.language, dataset: query?.dataset },
        data: visualizationData,
        config,
        timeRange,
      };
    }

    inspectorRequest.stats(getResponseInspectorStats(resp, searchSource)).ok({ json: resp });

    // Update shared panel data store so the global fetch_panel_data tool returns fresh data
    const savedExploreId = this.savedExplore.id;
    if (savedExploreId) {
      PanelDataService.getInstance()?.setPanelData(savedExploreId, {
        rows: transformedRows,
        panelTitle: this.getTitle() || this.savedExplore.title,
      });
    }

    // set tabular for DataViewComponent to display via adapters.data.getTabular()
    if (this.inspectorAdaptors.data && visualizationData?.transformedData) {
      const tabularColumns = [
        ...(visualizationData.numericalColumns ?? []),
        ...(visualizationData.categoricalColumns ?? []),
        ...(visualizationData.dateColumns ?? []),
        ...(visualizationData.unknownColumns ?? []),
      ].sort((a, b) => a.id - b.id);
      const indexPattern = searchSource.getField('index');

      this.inspectorAdaptors.data.setTabularLoader(
        () => ({
          columns: tabularColumns.map((col) => ({
            name: col.name,
            field: col.column,
          })),

          // format data rows and transform into shape {raw, formatted}
          rows: visualizationData.transformedData.map((row) => {
            const formattedRow: Record<string, FormattedData> = {};
            for (const col of tabularColumns) {
              const value = row[col.column];
              const field = indexPattern?.fields.getByName(col.name);
              const formatted =
                field && indexPattern?.getFormatterForField
                  ? indexPattern.getFormatterForField(field).convert(value)
                  : String(value ?? '');
              formattedRow[col.column] = new FormattedData(value, formatted);
            }
            return formattedRow;
          }),
        }),
        { returnsFormattedValues: true }
      );
    }
    return content;
  };

  private isAbortError(error: unknown) {
    return Boolean(
      error && typeof error === 'object' && 'name' in error && error.name === 'AbortError'
    );
  }

  private normalizeError(error: unknown): ExploreEmbeddableError {
    const requestError = error as {
      name?: string;
      message?: string;
      body?: { error?: string; message?: string };
    };
    return {
      name: requestError?.body?.error || requestError?.name || 'Error',
      message: requestError?.body?.message || requestError?.message || 'An error occurred',
    };
  }

  private transitionToReady(content: ExploreEmbeddableContent) {
    this.state = { status: 'ready', content };
    this.renderComponent();
    this.updateOutput({ loading: false, error: undefined });
  }

  private transitionToError(error: ExploreEmbeddableError) {
    this.state = { status: 'error', error };
    this.renderComponent();
    this.updateOutput({ loading: false, error });
  }

  private renderComponent() {
    if (!this.state || !this.root) {
      return;
    }

    this.root.render(
      <ExploreEmbeddableComponent
        state={this.state}
        selectedColumns={this.getSelectedColumns()}
        hideTimeColumn={this.services.uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING, false)}
        onAddColumn={this.onAddColumn}
        onRemoveColumn={this.onRemoveColumn}
        onFilter={this.onFilter}
        onSelectTimeRange={this.onSelectTimeRange}
        crosshairGroup={getCrosshairGroup(
          this.input.useSharedCrosshair,
          this.parent?.getInput().id
        )}
      />
    );
  }

  public destroy() {
    super.destroy();
    if (this.inputSubscription) {
      this.inputSubscription.unsubscribe();
    }

    if (this.autoRefreshFetchSubscription) {
      this.autoRefreshFetchSubscription.unsubscribe();
    }

    // Cleanup variable subscription
    if (this.variableSubscription) {
      this.variableSubscription.unsubscribe();
    }

    if (this.panelMetadataVariableSubscription) {
      this.panelMetadataVariableSubscription.unsubscribe();
    }

    // Cleanup transformation service
    if (this.transformationService) {
      this.transformationService.destroy();
    }

    if (this.savedExplore.id) {
      PanelDataService.getInstance()?.removePanelData(this.savedExplore.id);
    }

    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.root) {
      this.root.unmount();
      this.root = undefined;
    }
    this.node = undefined;
  }

  onContainerError = (error: ExpressionRenderError) => {
    this.abortController?.abort();
    this.abortController = undefined;
    this.transitionToError(this.normalizeError(error));
  };

  public render(node: HTMLElement) {
    if (this.root) {
      this.root.unmount();
    }
    // TODO: Integrate with Embeddable's RenderCompleteDispatcher once DataTable, TableVis,
    // and CommonVisualizationRender expose reliable renderer-level completion signals.
    // Calling super.render(node) before then would leave the panel marked incomplete.
    this.node = node;
    this.node.style.height = '100%';
    this.root = createRoot(node);
    this.handleInputChange();
  }

  public getInspectorAdapters() {
    return this.inspectorAdaptors;
  }
}
