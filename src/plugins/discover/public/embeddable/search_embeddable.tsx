/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { isEqual } from 'lodash';
import * as Rx from 'rxjs';
import { Subscription } from 'rxjs';
import React from 'react';
import ReactDOM from 'react-dom';
import { i18n } from '@osd/i18n';
import { UiActionsStart, APPLY_FILTER_TRIGGER } from '../../../ui_actions/public';
import { RequestAdapter, Adapters } from '../../../inspector/public';
import {
  opensearchFilters,
  Filter,
  TimeRange,
  FilterManager,
  getTime,
  Query,
  IFieldType,
} from '../../../data/public';
import { Container, Embeddable } from '../../../embeddable/public';
import { ISearchEmbeddable, SearchInput, SearchOutput } from './types';
import { getDefaultSort } from '../application/view_components/utils/get_default_sort';
import { getSortForSearchSource } from '../application/view_components/utils/get_sort_for_search_source';
import {
  getRequestInspectorStats,
  getResponseInspectorStats,
  getServices,
  IndexPattern,
  ISearchSource,
} from '../opensearch_dashboards_services';
import { SEARCH_EMBEDDABLE_TYPE } from './constants';
import { SortOrder } from '../saved_searches/types';
import { SavedSearch } from '../saved_searches';
import {
  SAMPLE_SIZE_SETTING,
  SORT_DEFAULT_ORDER_SETTING,
  DOC_HIDE_TIME_COLUMN_SETTING,
} from '../../common';
import { SearchEmbeddableComponent } from './search_embeddable_component';
import { DiscoverServices } from '../build_services';
import * as columnActions from '../application/utils/state_management/common';
import { buildColumns } from '../application/utils/columns';

export interface SearchProps {
  columns?: string[];
  description?: string;
  sort?: SortOrder[];
  onSort?: (sort: SortOrder[]) => void;
  sharedItemTitle?: string;
  inspectorAdapters?: Adapters;
  onSetColumns?: (columns: string[]) => void;
  onRemoveColumn?: (column: string) => void;
  onAddColumn?: (column: string) => void;
  onMoveColumn?: (column: string, index: number) => void;
  onFilter?: (field: IFieldType, value: string[], operator: string) => void;
  rows?: any[];
  indexPattern?: IndexPattern;
  totalHitCount?: number;
  isLoading?: boolean;
  displayTimeColumn?: boolean;
  services: DiscoverServices;
  title?: string;
}

interface SearchEmbeddableConfig {
  savedSearch: SavedSearch;
  editUrl: string;
  editPath: string;
  indexPatterns?: IndexPattern[];
  editable: boolean;
  filterManager: FilterManager;
  services: DiscoverServices;
}

export class SearchEmbeddable
  extends Embeddable<SearchInput, SearchOutput>
  implements ISearchEmbeddable {
  private readonly savedSearch: SavedSearch;
  private inspectorAdaptors: Adapters;
  private searchProps?: SearchProps;
  private panelTitle: string = '';
  private filtersSearchSource?: ISearchSource;
  private autoRefreshFetchSubscription?: Subscription;
  private subscription?: Subscription;
  public readonly type = SEARCH_EMBEDDABLE_TYPE;
  private services: DiscoverServices;
  private filterManager: FilterManager;
  private abortController?: AbortController;

  private prevTimeRange?: TimeRange;
  private prevFilters?: Filter[];
  private prevQuery?: Query;

  private node?: HTMLElement;

  constructor(
    {
      savedSearch,
      editUrl,
      editPath,
      indexPatterns,
      editable,
      filterManager,
      services,
    }: SearchEmbeddableConfig,
    initialInput: SearchInput,
    private readonly executeTriggerActions: UiActionsStart['executeTriggerActions'],
    parent?: Container
  ) {
    super(
      initialInput,
      {
        defaultTitle: savedSearch.title,
        editUrl,
        editPath,
        editApp: 'discover',
        indexPatterns,
        editable,
      },
      parent
    );

    this.services = services;
    this.filterManager = filterManager;
    this.savedSearch = savedSearch;
    this.inspectorAdaptors = {
      requests: new RequestAdapter(),
    };
    this.initializeSearchProps();

    this.autoRefreshFetchSubscription = getServices()
      .timefilter.getAutoRefreshFetch$()
      .subscribe(this.fetch);

    this.subscription = Rx.merge(this.getOutput$(), this.getInput$()).subscribe(() => {
      this.panelTitle = this.output.title || '';

      if (this.searchProps) {
        this.pushContainerStateParamsToProps(this.searchProps);
      }
    });
  }

  public getInspectorAdapters() {
    return this.inspectorAdaptors;
  }

  public getSavedSearch() {
    return this.savedSearch;
  }

  /**
   *
   * @param {Element} domNode
   */
  public render(node: HTMLElement) {
    if (!this.searchProps) {
      throw new Error('Search scope not defined');
    }
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
    this.node = node;
  }

  public destroy() {
    super.destroy();
    if (this.searchProps) {
      delete this.searchProps;
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
    if (this.autoRefreshFetchSubscription) {
      this.autoRefreshFetchSubscription.unsubscribe();
    }
    if (this.abortController) this.abortController.abort();
  }

  private initializeSearchProps() {
    const { searchSource } = this.savedSearch;
    const indexPattern = searchSource.getField('index');
    if (!indexPattern) {
      return;
    }

    const sort = getDefaultSort(
      indexPattern,
      this.services.uiSettings.get(SORT_DEFAULT_ORDER_SETTING, 'desc')
    );
    this.savedSearch.sort = sort;

    const searchProps: SearchProps = {
      columns: this.savedSearch.columns,
      sort: [],
      inspectorAdapters: this.inspectorAdaptors,
      rows: [],
      description: this.savedSearch.description,
      title: this.savedSearch.title,
      services: this.services,
      indexPattern,
      isLoading: false,
      displayTimeColumn: !this.services.uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING, false),
    };

    const timeRangeSearchSource = searchSource.create();
    timeRangeSearchSource.setField('filter', () => {
      if (!this.searchProps || !this.input.timeRange) return;
      return getTime(indexPattern, this.input.timeRange);
    });

    this.filtersSearchSource = searchSource.create();
    this.filtersSearchSource.setParent(timeRangeSearchSource);

    searchSource.setParent(this.filtersSearchSource);

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
        indexPattern.id!
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

    this.pushContainerStateParamsToProps(searchProps);
  }

  public reload() {
    if (this.searchProps) {
      this.pushContainerStateParamsToProps(this.searchProps, true);
    }
  }

  private fetch = async () => {
    if (!this.searchProps) return;

    const { searchSource } = this.savedSearch;

    // Abort any in-progress requests
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();

    searchSource.setField('size', getServices().uiSettings.get(SAMPLE_SIZE_SETTING));
    searchSource.setField(
      'sort',
      getSortForSearchSource(
        this.searchProps.sort,
        this.searchProps.indexPattern,
        getServices().uiSettings.get(SORT_DEFAULT_ORDER_SETTING)
      )
    );

    // Log request to inspector
    this.inspectorAdaptors.requests.reset();
    const title = i18n.translate('discover.embeddable.inspectorRequestDataTitle', {
      defaultMessage: 'Data',
    });
    const description = i18n.translate('discover.embeddable.inspectorRequestDescription', {
      defaultMessage: 'This request queries OpenSearch to fetch the data for the search.',
    });
    const inspectorRequest = this.inspectorAdaptors.requests.start(title, { description });
    inspectorRequest.stats(getRequestInspectorStats(searchSource));
    searchSource.getSearchRequestBody().then((body: Record<string, unknown>) => {
      inspectorRequest.json(body);
    });
    this.updateOutput({ loading: true, error: undefined });
    this.searchProps!.isLoading = true;

    try {
      // Make the request
      const resp = await searchSource.fetch({
        abortSignal: this.abortController.signal,
      });
      this.updateOutput({ loading: false, error: undefined });

      // Log response to inspector
      inspectorRequest.stats(getResponseInspectorStats(resp, searchSource)).ok({ json: resp });

      this.searchProps!.rows = resp.hits.hits;
      this.searchProps!.totalHitCount = resp.hits.total;
      this.searchProps!.isLoading = false;
    } catch (error) {
      this.updateOutput({ loading: false, error });
      this.searchProps!.isLoading = false;
    }
  };

  private renderComponent(node: HTMLElement, searchProps: SearchProps) {
    if (!this.searchProps) {
      return;
    }
    const props = {
      searchProps,
    };
    ReactDOM.render(<SearchEmbeddableComponent {...props} />, node);
  }

  private async pushContainerStateParamsToProps(searchProps: SearchProps, force: boolean = false) {
    const isFetchRequired =
      force ||
      !opensearchFilters.onlyDisabledFiltersChanged(this.input.filters, this.prevFilters) ||
      !isEqual(this.prevQuery, this.input.query) ||
      !isEqual(this.prevTimeRange, this.input.timeRange) ||
      !isEqual(searchProps.sort, this.input.sort || this.savedSearch.sort);

    // If there is column or sort data on the panel, that means the original columns or sort settings have
    // been overridden in a dashboard.
    searchProps.columns = this.input.columns || this.savedSearch.columns;
    searchProps.sort = this.input.sort || this.savedSearch.sort;
    searchProps.sharedItemTitle = this.panelTitle;

    if (isFetchRequired) {
      this.filtersSearchSource!.setField('filter', this.input.filters);
      this.filtersSearchSource!.setField('query', this.input.query);
      this.prevFilters = this.input.filters;
      this.prevQuery = this.input.query;
      this.prevTimeRange = this.input.timeRange;
      this.searchProps = searchProps;

      await this.fetch();
    } else if (this.searchProps) {
      this.searchProps = searchProps;
    }

    if (this.node) {
      this.renderComponent(this.node, this.searchProps!);
    }
  }
}
