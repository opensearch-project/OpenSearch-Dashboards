/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEqual } from 'lodash';
import { merge, Subscription } from 'rxjs';
import React from 'react';
import ReactDOM from 'react-dom';
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
} from '../../../data/public';
import { Container, Embeddable, IEmbeddable } from '../../../embeddable/public';
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
import { SAMPLE_SIZE_SETTING } from '../../common/legacy/discover';
import { ExploreEmbeddableComponent } from './explore_embeddable_component';
import { ExploreServices } from '../types';
import { ExpressionRenderError } from '../../../expressions/public';
import { getVisualizationType } from '../components/visualizations/utils/use_visualization_types';
import { VisColumn } from '../components/visualizations/types';
import { toExpression } from '../components/visualizations/utils/to_expression';

export interface SearchProps {
  description?: string;
  sort?: SortOrder[];
  inspectorAdapters?: Adapters;
  rows?: any[];
  indexPattern?: IndexPattern;
  hits?: number;
  isLoading?: boolean;
  services: ExploreServices;
  expression?: string;
  searchContext?: {
    query: Query | undefined;
    filters: Filter[] | undefined;
    timeRange: TimeRange | undefined;
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
  private services: ExploreServices;
  private prevState = {
    filters: undefined as Filter[] | undefined,
    query: undefined as Query | undefined,
    timeRange: undefined as TimeRange | undefined,
  };
  private node?: HTMLElement;

  constructor(
    { savedExplore, editUrl, editPath, indexPatterns, editable, services }: ExploreEmbeddableConfig,
    initialInput: ExploreInput,
    parent?: Container
  ) {
    super(
      initialInput,
      {
        defaultTitle: savedExplore.title,
        editUrl,
        editPath,
        editApp: 'explore',
        indexPatterns,
        editable,
      },
      parent
    );
    this.services = services;
    this.savedExplore = savedExplore;
    this.inspectorAdaptors = {
      requests: new RequestAdapter(),
    };
    this.initializeSearchProps();

    this.subscription = merge(this.getOutput$(), this.getInput$()).subscribe(() => {
      this.updateHandler();
    });
    this.autoRefreshFetchSubscription = getServices()
      .timefilter.getAutoRefreshFetch$()
      .subscribe(() => {
        this.updateHandler(true);
      });
  }

  private initializeSearchProps() {
    const { searchSource } = this.savedExplore;
    const indexPattern = searchSource.getField('index');
    if (!indexPattern) return;
    this.searchProps = {
      inspectorAdapters: this.inspectorAdaptors,
      rows: [],
      description: this.savedExplore.description,
      services: this.services,
      indexPattern,
      isLoading: false,
    };
    const timeRangeSearchSource = searchSource.create();
    timeRangeSearchSource.setField('filter', () => {
      if (!this.searchProps || !this.input.timeRange) return;
      return getTime(indexPattern, this.input.timeRange);
    });
    this.filtersSearchSource = searchSource.create();
    this.filtersSearchSource.setParent(timeRangeSearchSource);
    searchSource.setParent(this.filtersSearchSource);
    searchSource.setFields({
      index: indexPattern,
      query: this.savedExplore.searchSource.getField('query'),
      highlightAll: true,
      version: true,
    });
  }

  private async updateHandler(force = false) {
    const { filters, query, timeRange } = this.input;
    const needFetch =
      force ||
      !opensearchFilters.onlyDisabledFiltersChanged(filters, this.prevState.filters) ||
      !isEqual(query, this.prevState.query) ||
      !isEqual(timeRange, this.prevState.timeRange);
    if (needFetch) {
      this.prevState = { filters, query, timeRange };
      await this.fetch();
    }
    if (this.node && this.searchProps) {
      this.renderComponent(this.node, this.searchProps);
    }
  }

  public reload() {
    this.updateHandler(true);
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
    this.searchProps.rows = rows;
    const fieldSchema = searchSource.getDataFrame()?.schema;
    const visualizationData = getVisualizationType(rows, fieldSchema);
    const displayVis = rows?.length > 0 && visualizationData && visualizationData.ruleId;
    if (displayVis) {
      const selectedChartType =
        JSON.parse(this.savedExplore.visualization || '{}').chartType ?? 'line';
      const rule = this.services.visualizationRegistry
        .start()
        .getRules()
        .find((r) => r.id === visualizationData.ruleId);
      const ruleBasedToExpressionFn = (
        transformedData: Array<Record<string, any>>,
        numericalColumns: VisColumn[],
        categoricalColumns: VisColumn[],
        dateColumns: VisColumn[],
        styleOpts: any
      ) => {
        return rule.toExpression!(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOpts,
          selectedChartType
        );
      };
      const searchContext = {
        query: this.input.query,
        filters: this.input.filters,
        timeRange: this.input.timeRange,
      };
      this.searchProps.searchContext = searchContext;
      const indexPattern = this.savedExplore.searchSource.getField('index');
      const styleOptions = JSON.parse(this.savedExplore.visualization || '{}').params;
      const exp = await toExpression(
        searchContext,
        indexPattern!,
        ruleBasedToExpressionFn,
        visualizationData.transformedData,
        visualizationData.numericalColumns,
        visualizationData.categoricalColumns,
        visualizationData.dateColumns,
        styleOptions
      );
      this.searchProps.expression = exp;
    }
    this.updateOutput({ loading: false, error: undefined });
    inspectorRequest.stats(getResponseInspectorStats(resp, searchSource)).ok({ json: resp });
    this.searchProps.rows = rows;
    this.searchProps.hits = resp.hits.total;
    this.searchProps.isLoading = false;
  };

  private renderComponent(node: HTMLElement, searchProps: SearchProps) {
    if (!this.searchProps) return;
    const MemorizedExploreEmbeddableComponent = React.memo(ExploreEmbeddableComponent);
    ReactDOM.render(<MemorizedExploreEmbeddableComponent searchProps={searchProps} />, node);
  }

  public destroy() {
    super.destroy();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (this.autoRefreshFetchSubscription) {
      this.autoRefreshFetchSubscription.unsubscribe();
    }

    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.searchProps) {
      delete this.searchProps;
    }
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
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
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
    this.node = node;
    this.renderComponent(node, this.searchProps);
  }
}
