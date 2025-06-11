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
 * Licensed to Elasticexplore B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticexplore B.V. licenses this file to you under
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
  IndexPattern,
  ISearchSource,
} from '../../../data/public';
import { SavedExplore, SortOrder } from '../types/saved_explore_types';
import { DiscoverServices } from '../application/legacy/discover/build_services';
import { Container, Embeddable } from '../../../embeddable/public';
import { ExploreInput, ExploreOutput, IExploreEmbeddable } from './types';
import { EXPLORE_EMBEDDABLE_TYPE } from './constants';
import {
  DOC_HIDE_TIME_COLUMN_SETTING,
  SAMPLE_SIZE_SETTING,
  SORT_DEFAULT_ORDER_SETTING,
} from '../../common';
import { getRequestInspectorStats, getResponseInspectorStats } from '../../../data/common';
import { getSortForSearchSource } from '../application/legacy/discover/application/view_components/utils/get_sort_for_search_source';
import { ExploreEmbeddableComponent } from './explore_embeddable_component';
import { buildColumns } from '../application/legacy/discover/application/utils/columns';
import { getServices } from '../application/legacy/discover/opensearch_dashboards_services';
import * as columnActions from '../application/legacy/discover/application/utils/state_management/common';

export interface ExploreProps {
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
  onReorderColumn?: (col: string, source: number, destination: number) => void;
  onFilter?: (field: IFieldType, value: string[], operator: string) => void;
  rows?: any[];
  indexPattern?: IndexPattern;
  hits?: number;
  isLoading?: boolean;
  displayTimeColumn?: boolean;
  services: DiscoverServices;
  title?: string;
}

interface ExploreEmbeddableConfig {
  savedExplore: SavedExplore;
  editUrl: string;
  editPath: string;
  indexPatterns?: IndexPattern[];
  editable: boolean;
  filterManager: FilterManager;
  services: DiscoverServices;
}

export class ExploreEmbeddable
  extends Embeddable<ExploreInput, ExploreOutput>
  implements IExploreEmbeddable {
  private readonly savedExplore: SavedExplore;
  private inspectorAdaptors: Adapters;
  private exploreProps?: ExploreProps;
  private panelTitle: string = '';
  private filtersSearchSource?: ISearchSource;
  private autoRefreshFetchSubscription?: Subscription;
  private subscription?: Subscription;
  public readonly type = EXPLORE_EMBEDDABLE_TYPE;
  private services: DiscoverServices;
  private filterManager: FilterManager;
  private abortController?: AbortController;

  private prevTimeRange?: TimeRange;
  private prevFilters?: Filter[];
  private prevQuery?: Query;

  private node?: HTMLElement;

  constructor(
    {
      savedExplore,
      editUrl,
      editPath,
      indexPatterns,
      editable,
      filterManager,
      services,
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
        editApp: 'discover',
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
    this.initializeExploreProps();

    this.autoRefreshFetchSubscription = getServices()
      .timefilter.getAutoRefreshFetch$()
      .subscribe(this.fetch);

    this.subscription = Rx.merge(this.getOutput$(), this.getInput$()).subscribe(() => {
      this.panelTitle = this.output.title || '';

      if (this.exploreProps) {
        this.pushContainerStateParamsToProps(this.exploreProps);
      }
    });
  }

  public getInspectorAdapters() {
    return this.inspectorAdaptors;
  }

  public getSavedExplore() {
    return this.savedExplore;
  }

  /**
   *
   * @param {Element} domNode
   */
  public render(node: HTMLElement) {
    if (!this.exploreProps) {
      throw new Error('Explore scope not defined');
    }
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
    this.node = node;
  }

  public destroy() {
    super.destroy();
    if (this.exploreProps) {
      delete this.exploreProps;
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

  private initializeExploreProps() {
    const { searchSource } = this.savedExplore;
    const indexPattern = searchSource.getField('index');
    if (!indexPattern) {
      return;
    }

    const exploreProps: ExploreProps = {
      columns: this.savedExplore.columns,
      sort: [],
      inspectorAdapters: this.inspectorAdaptors,
      rows: [],
      description: this.savedExplore.description,
      title: this.savedExplore.title,
      services: this.services,
      indexPattern,
      isLoading: false,
      displayTimeColumn: !this.services.uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING, false),
    };

    const timeRangeSearchSource = searchSource.create();
    timeRangeSearchSource.setField('filter', () => {
      if (!this.exploreProps || !this.input.timeRange) return;
      return getTime(indexPattern, this.input.timeRange);
    });

    this.filtersSearchSource = searchSource.create();
    this.filtersSearchSource.setParent(timeRangeSearchSource);

    searchSource.setParent(this.filtersSearchSource);

    exploreProps.onSort = (newSort) => {
      this.updateInput({ sort: newSort });
    };

    exploreProps.onAddColumn = (columnName: string) => {
      if (!exploreProps.columns) {
        return;
      }
      const updatedColumns = buildColumns(
        columnActions.addColumn(exploreProps.columns, { column: columnName })
      );
      this.updateInput({ columns: updatedColumns });
    };

    exploreProps.onRemoveColumn = (columnName: string) => {
      if (!exploreProps.columns) {
        return;
      }
      const updatedColumns = columnActions.removeColumn(exploreProps.columns, columnName);
      const updatedSort =
        exploreProps.sort && exploreProps.sort.length
          ? exploreProps.sort.filter((s) => s[0] !== columnName)
          : [];
      this.updateInput({ sort: updatedSort, columns: updatedColumns });
    };

    exploreProps.onMoveColumn = (columnName, newIndex: number) => {
      if (!exploreProps.columns) {
        return;
      }
      const oldIndex = exploreProps.columns.indexOf(columnName);
      const updatedColumns = columnActions.reorderColumn(exploreProps.columns, oldIndex, newIndex);
      this.updateInput({ columns: updatedColumns });
    };

    exploreProps.onSetColumns = (columnNames: string[]) => {
      const columns = buildColumns(columnNames);
      this.updateInput({ columns });
    };

    exploreProps.onFilter = async (field, value, operator) => {
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

    this.pushContainerStateParamsToProps(exploreProps);
  }

  public reload() {
    if (this.exploreProps) {
      this.pushContainerStateParamsToProps(this.exploreProps, true);
    }
  }

  private fetch = async () => {
    if (!this.exploreProps) return;

    const { searchSource } = this.savedExplore;

    // Abort any in-progress requests
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();

    searchSource.setField('size', getServices().uiSettings.get(SAMPLE_SIZE_SETTING));
    searchSource.setField(
      'sort',
      getSortForSearchSource(
        this.exploreProps.sort,
        this.exploreProps.indexPattern,
        getServices().uiSettings.get(SORT_DEFAULT_ORDER_SETTING)
      )
    );

    // Log request to inspector
    this.inspectorAdaptors.requests.reset();
    const title = i18n.translate('explore.discover.embeddable.inspectorRequestDataTitle', {
      defaultMessage: 'Data',
    });
    const description = i18n.translate('explore.discover.embeddable.inspectorRequestDescription', {
      defaultMessage: 'This request queries OpenSearch to fetch the data for the explore.',
    });
    const inspectorRequest = this.inspectorAdaptors.requests.start(title, { description });
    inspectorRequest.stats(getRequestInspectorStats(searchSource));
    searchSource.getSearchRequestBody().then((body: Record<string, unknown>) => {
      inspectorRequest.json(body);
    });
    this.updateOutput({ loading: true, error: undefined });
    this.exploreProps!.isLoading = true;

    try {
      // Make the request
      console.log('explore embeddable fetch called', searchSource.getField('query'));
      const resp = await searchSource.fetch({
        abortSignal: this.abortController.signal,
      });
      this.updateOutput({ loading: false, error: undefined });

      // Log response to inspector
      inspectorRequest.stats(getResponseInspectorStats(resp, searchSource)).ok({ json: resp });

      this.exploreProps!.rows = resp.hits.hits;
      this.exploreProps!.hits = resp.hits.total;
      this.exploreProps!.isLoading = false;
    } catch (error) {
      this.updateOutput({ loading: false, error });
      this.exploreProps!.isLoading = false;
    }
  };

  private renderComponent(node: HTMLElement, exploreProps: ExploreProps) {
    if (!this.exploreProps) {
      return;
    }
    const props = {
      exploreProps,
    };

    const MemorizedExploreEmbeddableComponent = React.memo(ExploreEmbeddableComponent);
    ReactDOM.render(<MemorizedExploreEmbeddableComponent {...props} />, node);
  }

  private async pushContainerStateParamsToProps(
    exploreProps: ExploreProps,
    force: boolean = false
  ) {
    const isFetchRequired =
      force ||
      !opensearchFilters.onlyDisabledFiltersChanged(this.input.filters, this.prevFilters) ||
      !isEqual(this.prevQuery, this.input.query) ||
      !isEqual(this.prevTimeRange, this.input.timeRange) ||
      !isEqual(exploreProps.sort, this.input.sort || this.savedExplore.sort);

    // If there is column or sort data on the panel, that means the original columns or sort settings have
    // been overridden in a dashboard.
    exploreProps.columns = this.input.columns || this.savedExplore.columns;
    exploreProps.sort = this.input.sort || this.savedExplore.sort;
    exploreProps.sharedItemTitle = this.panelTitle;

    if (isFetchRequired) {
      this.filtersSearchSource!.setField('filter', this.input.filters);
      this.filtersSearchSource!.setField('query', this.input.query);
      this.prevFilters = this.input.filters;
      this.prevQuery = this.input.query;
      this.prevTimeRange = this.input.timeRange;
      this.exploreProps = exploreProps;

      await this.fetch();
    } else if (this.exploreProps) {
      this.exploreProps = exploreProps;
    }

    if (this.node) {
      this.renderComponent(this.node, this.exploreProps!);
    }
  }
}
