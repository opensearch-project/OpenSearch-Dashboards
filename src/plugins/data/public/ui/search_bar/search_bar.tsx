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

import { InjectedIntl, injectI18n } from '@osd/i18n/react';
import classNames from 'classnames';
import { cloneDeep, compact, get, isEqual } from 'lodash';
import React, { Component } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import {
  OpenSearchDashboardsReactContextValue,
  withOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';
import { Filter, IIndexPattern, Query, TimeRange, UI_SETTINGS } from '../../../common';
import { SavedQuery, SavedQueryAttributes, TimeHistoryContract, QueryStatus } from '../../query';
import { IDataPluginServices } from '../../types';
import { FilterBar } from '../filter_bar/filter_bar';
import { QueryEditorTopRow } from '../query_editor';
import QueryBarTopRow from '../query_string_input/query_bar_top_row';
import { SavedQueryMeta, SaveQueryForm } from '../saved_query_form';
import { FilterOptions } from '../filter_bar/filter_options';
import { getUseNewSavedQueriesUI } from '../../services';

interface SearchBarInjectedDeps {
  opensearchDashboards: OpenSearchDashboardsReactContextValue<IDataPluginServices>;
  intl: InjectedIntl;
  timeHistory: TimeHistoryContract;
  // Filter bar
  onFiltersUpdated?: (filters: Filter[]) => void;
  // Autorefresh
  onRefreshChange?: (options: { isPaused: boolean; refreshInterval: number }) => void;
}

export interface SearchBarOwnProps {
  indexPatterns?: IIndexPattern[];
  isLoading?: boolean;
  customSubmitButton?: React.ReactNode;
  screenTitle?: string;
  dataTestSubj?: string;
  // Togglers
  showQueryBar?: boolean;
  showQueryInput?: boolean;
  showFilterBar?: boolean;
  isFilterBarPortable?: boolean;
  showDatePicker?: boolean;
  showAutoRefreshOnly?: boolean;
  filters?: Filter[];
  // Date picker
  isRefreshPaused?: boolean;
  refreshInterval?: number;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  datasetSelectorRef?: React.RefObject<HTMLDivElement>;
  datePickerRef?: React.RefObject<HTMLDivElement>;
  // Query bar - should be in SearchBarInjectedDeps
  query?: Query;
  // Show when user has privileges to save
  showSaveQuery?: boolean;
  savedQuery?: SavedQuery;
  onQueryChange?: (payload: { dateRange: TimeRange; query?: Query }) => void;
  onQuerySubmit?: (payload: { dateRange: TimeRange; query?: Query }, isUpdate?: boolean) => void;
  // User has saved the current state as a saved query
  onSaved?: (savedQuery: SavedQuery) => void;
  // User has modified the saved query, your app should persist the update
  onSavedQueryUpdated?: (savedQuery: SavedQuery) => void;
  // User has cleared the active query, your app should clear the entire query bar
  onClearSavedQuery?: () => void;

  onRefresh?: (payload: { dateRange: TimeRange }) => void;
  indicateNoData?: boolean;
  queryStatus?: QueryStatus;
}

export type SearchBarProps = SearchBarOwnProps & SearchBarInjectedDeps;

// TODO: MQL: include query enhancement in state in case make adding data sources at runtime?
interface State {
  isFiltersVisible: boolean;
  showSaveQueryModal: boolean;
  showSaveNewQueryModal: boolean;
  showSavedQueryPopover: boolean;
  currentProps?: SearchBarProps;
  query?: Query;
  dateRangeFrom: string;
  dateRangeTo: string;
}

class SearchBarUI extends Component<SearchBarProps, State> {
  public static defaultProps = {
    showQueryBar: true,
    showFilterBar: true,
    showDatePicker: true,
    showAutoRefreshOnly: false,
  };

  private services = this.props.opensearchDashboards.services;
  private queryStringManager = this.services.data.query.queryString;
  private savedQueryService = this.services.data.query.savedQueries;
  public filterBarRef: Element | null = null;
  public filterBarWrapperRef: Element | null = null;
  private useNewHeader = Boolean(this.services.uiSettings.get(UI_SETTINGS.NEW_HOME_PAGE));

  public static getDerivedStateFromProps(nextProps: SearchBarProps, prevState: State) {
    if (isEqual(prevState.currentProps, nextProps)) {
      return null;
    }

    let nextQuery = null;
    if (nextProps.query && nextProps.query.query !== get(prevState, 'currentProps.query.query')) {
      nextQuery = {
        query: nextProps.query.query,
        language: nextProps.query.language,
        dataset: nextProps.query.dataset,
      };
    } else if (
      nextProps.query &&
      prevState.query &&
      nextProps.query.language !== prevState.query.language
    ) {
      nextQuery = {
        query: '',
        language: nextProps.query.language,
        dataset: nextProps.query.dataset,
      };
    } else if (
      nextProps.query &&
      prevState.query &&
      nextProps.query.dataset !== prevState.query.dataset
    ) {
      nextQuery = {
        query: nextProps.query.query,
        language: nextProps.query.language,
        dataset: nextProps.query.dataset,
      };
    }

    let nextDateRange = null;
    if (
      nextProps.dateRangeFrom !== get(prevState, 'currentProps.dateRangeFrom') ||
      nextProps.dateRangeTo !== get(prevState, 'currentProps.dateRangeTo')
    ) {
      nextDateRange = {
        dateRangeFrom: nextProps.dateRangeFrom,
        dateRangeTo: nextProps.dateRangeTo,
      };
    }

    const nextState: any = {
      currentProps: nextProps,
    };
    if (nextQuery) {
      nextState.query = nextQuery;
    }
    if (nextDateRange) {
      nextState.dateRangeFrom = nextDateRange.dateRangeFrom;
      nextState.dateRangeTo = nextDateRange.dateRangeTo;
    }
    return nextState;
  }

  /*
   Keep the "draft" value in local state until the user actually submits the query. There are a couple advantages:

    1. Each app doesn't have to maintain its own "draft" value if it wants to put off updating the query in app state
    until the user manually submits their changes. Most apps have watches on the query value in app state so we don't
    want to trigger those on every keypress. Also, some apps (e.g. dashboard) already juggle multiple query values,
    each with slightly different semantics and I'd rather not add yet another variable to the mix.

    2. Changes to the local component state won't trigger an Angular digest cycle. Triggering digest cycles on every
    keypress has been a major source of performance issues for us in previous implementations of the query bar.
    See https://github.com/elastic/kibana/issues/14086
  */
  public state = {
    isFiltersVisible: true,
    showSaveQueryModal: false,
    showSaveNewQueryModal: false,
    showSavedQueryPopover: false,
    currentProps: this.props,
    query: this.props.query ? { ...this.props.query } : undefined,
    dateRangeFrom: get(this.props, 'dateRangeFrom', 'now-15m'),
    dateRangeTo: get(this.props, 'dateRangeTo', 'now'),
  };

  public isDirty = () => {
    if (!this.props.showDatePicker && this.state.query && this.props.query) {
      return this.state.query.query !== this.props.query.query;
    }

    return (
      (this.state.query && this.props.query && this.state.query.query !== this.props.query.query) ||
      this.state.dateRangeFrom !== this.props.dateRangeFrom ||
      this.state.dateRangeTo !== this.props.dateRangeTo
    );
  };

  private shouldRenderQueryEditor(isEnhancementsEnabledOverride: boolean) {
    // TODO: MQL handle no index patterns?
    if (!isEnhancementsEnabledOverride) return false;
    const showDatePicker = this.props.showDatePicker || this.props.showAutoRefreshOnly;
    // TODO: MQL showQueryEditor should be a prop of it's own but using showQueryInput for now
    const showQueryEditor =
      (this.props.showQueryInput && this.props.indexPatterns && this.state.query) ||
      this.props.datasetSelectorRef?.current;
    return this.props.showQueryBar && (showDatePicker || showQueryEditor);
  }

  private shouldRenderQueryBar(isEnhancementsEnabledOverride: boolean) {
    // TODO: MQL handle no index patterns?
    if (isEnhancementsEnabledOverride) return false;
    const showDatePicker = this.props.showDatePicker || this.props.showAutoRefreshOnly;
    const showQueryInput =
      this.props.showQueryInput && this.props.indexPatterns && this.state.query;
    return this.props.showQueryBar && (showDatePicker || showQueryInput);
  }

  private isQueryLanguageFilterable() {
    return (
      this.queryStringManager.getLanguageService().getLanguage(this.state.query?.language!)?.fields
        ?.filterable ?? true // Render if undefined or true
    );
  }

  private shouldRenderFilterBar(isEnhancementsEnabledOverride: boolean) {
    return (
      this.props.showFilterBar &&
      this.props.filters &&
      (!this.useNewHeader || this.props.filters.length > 0) &&
      this.props.indexPatterns &&
      compact(this.props.indexPatterns).length > 0 &&
      (!isEnhancementsEnabledOverride ||
        (isEnhancementsEnabledOverride && this.isQueryLanguageFilterable))
    );
  }

  /*
   * This Function is here to show the toggle in saved query form
   * in case you the date range (from/to)
   */
  private shouldRenderTimeFilterInSavedQueryForm() {
    const { dateRangeFrom, dateRangeTo, showDatePicker } = this.props;
    return (
      showDatePicker ||
      (!showDatePicker && dateRangeFrom !== undefined && dateRangeTo !== undefined)
    );
  }

  public setFilterBarHeight = () => {
    requestAnimationFrame(() => {
      const height =
        this.filterBarRef && this.state.isFiltersVisible ? this.filterBarRef.clientHeight : 0;
      if (this.filterBarWrapperRef) {
        this.filterBarWrapperRef.setAttribute('style', `height: ${height}px`);
      }
    });
  };

  // member-ordering rules conflict with use-before-declaration rules
  public ro = new ResizeObserver(this.setFilterBarHeight);

  public onSave = async (savedQueryMeta: SavedQueryMeta, saveAsNew = false) => {
    if (!this.state.query) return;

    const query = cloneDeep(this.state.query);
    if (getUseNewSavedQueriesUI() && !savedQueryMeta.shouldIncludeDataSource) {
      delete query.dataset;
    }

    const savedQueryAttributes: SavedQueryAttributes = {
      title: savedQueryMeta.title,
      description: savedQueryMeta.description,
      query,
    };

    if (savedQueryMeta.shouldIncludeFilters) {
      savedQueryAttributes.filters = this.props.filters;
    }

    if (
      savedQueryMeta.shouldIncludeTimeFilter &&
      this.state.dateRangeTo !== undefined &&
      this.state.dateRangeFrom !== undefined &&
      this.props.refreshInterval !== undefined &&
      this.props.isRefreshPaused !== undefined
    ) {
      savedQueryAttributes.timefilter = {
        from: this.state.dateRangeFrom,
        to: this.state.dateRangeTo,
        refreshInterval: {
          value: this.props.refreshInterval,
          pause: this.props.isRefreshPaused,
        },
      };
    }

    try {
      let response;
      if (this.props.savedQuery && !saveAsNew) {
        response = await this.savedQueryService.saveQuery(savedQueryAttributes, {
          overwrite: true,
        });
      } else {
        response = await this.savedQueryService.saveQuery(savedQueryAttributes);
      }

      this.services.notifications.toasts.addSuccess(
        `Your query "${response.attributes.title}" was saved`
      );

      this.setState({
        showSaveQueryModal: false,
        showSaveNewQueryModal: false,
      });

      if (this.props.onSaved) {
        this.props.onSaved(response);
      }
    } catch (error: any) {
      this.services.notifications.toasts.addDanger(
        this.props.intl.formatMessage(
          {
            id: 'data.search_bar.save_query.failedToSaveQuery',
            defaultMessage: 'An error occured while saving your query{errorMessage}',
          },
          { errorMessage: error.message ? `: ${error.message}` : '' }
        )
      );
      throw error;
    }
  };

  public onInitiateSave = () => {
    this.setState({
      showSaveQueryModal: true,
    });
  };

  public onInitiateSaveNew = () => {
    this.setState({
      showSaveNewQueryModal: true,
    });
  };

  public onQueryBarChange = (queryAndDateRange: { dateRange: TimeRange; query?: Query }) => {
    this.setState({
      query: queryAndDateRange.query,
      dateRangeFrom: queryAndDateRange.dateRange.from,
      dateRangeTo: queryAndDateRange.dateRange.to,
    });
    if (this.props.onQueryChange) {
      this.props.onQueryChange(queryAndDateRange);
    }
  };

  public onQueryBarSubmit = (queryAndDateRange: { dateRange?: TimeRange; query?: Query }) => {
    this.setState(
      {
        query: queryAndDateRange.query,
        dateRangeFrom:
          (queryAndDateRange.dateRange && queryAndDateRange.dateRange.from) ||
          this.state.dateRangeFrom,
        dateRangeTo:
          (queryAndDateRange.dateRange && queryAndDateRange.dateRange.to) || this.state.dateRangeTo,
      },
      () => {
        if (this.props.onQuerySubmit) {
          this.props.onQuerySubmit({
            query: this.state.query,
            dateRange: {
              from: this.state.dateRangeFrom,
              to: this.state.dateRangeTo,
            },
          });
        }
      }
    );

    if (queryAndDateRange.query) {
      this.queryStringManager.addToQueryHistory(
        queryAndDateRange.query,
        queryAndDateRange.dateRange
      );
    }
  };

  public onLoadSavedQuery = (savedQuery: SavedQuery) => {
    const dateRangeFrom = get(savedQuery, 'attributes.timefilter.from', this.state.dateRangeFrom);
    const dateRangeTo = get(savedQuery, 'attributes.timefilter.to', this.state.dateRangeTo);

    this.setState({
      query: savedQuery.attributes.query,
      dateRangeFrom,
      dateRangeTo,
    });

    if (this.props.onSavedQueryUpdated) {
      this.props.onSavedQueryUpdated(savedQuery);
    }
  };

  public componentDidMount() {
    if (this.filterBarRef) {
      this.setFilterBarHeight();
      this.ro.observe(this.filterBarRef);
    }
  }

  public componentDidUpdate() {
    if (this.filterBarRef) {
      this.setFilterBarHeight();
      this.ro.unobserve(this.filterBarRef);
    }
  }

  public render() {
    const isEnhancementsEnabledOverride =
      this.services.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED) &&
      this.queryStringManager
        .getLanguageService()
        .getLanguage(this.state.query?.language!)
        ?.editorSupportedAppNames?.includes(this.services.appName);

    const searchBarMenu = (
      useSaveQueryMenu: boolean = false,
      isQueryEditorControl: boolean = false
    ) => {
      return (
        this.state.query &&
        this.props.onClearSavedQuery && (
          <FilterOptions
            filters={this.props.filters!}
            onFiltersUpdated={this.props.onFiltersUpdated}
            intl={this.props.intl}
            indexPatterns={this.props.indexPatterns!}
            showSaveQuery={this.props.showSaveQuery}
            loadedSavedQuery={this.props.savedQuery}
            onInitiateSave={this.onInitiateSave}
            onInitiateSaveAsNew={this.onInitiateSaveNew}
            onLoad={this.onLoadSavedQuery}
            savedQueryService={this.savedQueryService}
            onClearSavedQuery={this.props.onClearSavedQuery}
            useSaveQueryMenu={useSaveQueryMenu}
            isQueryEditorControl={isQueryEditorControl}
            saveQuery={this.onSave}
          />
        )
      );
    };

    let filterBar;
    if (this.shouldRenderFilterBar(isEnhancementsEnabledOverride)) {
      const filterGroupClasses = classNames('globalFilterGroup__wrapper', {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'globalFilterGroup__wrapper-isVisible': this.state.isFiltersVisible,
      });
      filterBar = (
        <div
          id="GlobalFilterGroup"
          ref={(node) => {
            this.filterBarWrapperRef = node;
          }}
          className={filterGroupClasses}
        >
          <div
            ref={(node) => {
              this.filterBarRef = node;
            }}
          >
            <FilterBar
              className="globalFilterGroup__filterBar"
              filters={this.props.filters!}
              onFiltersUpdated={this.props.onFiltersUpdated}
              indexPatterns={this.props.indexPatterns!}
              isFilterBarPortable={this.props.isFilterBarPortable}
            />
          </div>
        </div>
      );
    }

    let queryBar;

    if (this.shouldRenderQueryBar(isEnhancementsEnabledOverride)) {
      queryBar = (
        <QueryBarTopRow
          timeHistory={this.props.timeHistory}
          query={this.state.query}
          screenTitle={this.props.screenTitle}
          onSubmit={this.onQueryBarSubmit}
          indexPatterns={this.props.indexPatterns}
          isLoading={this.props.isLoading}
          prepend={this.props.showFilterBar ? searchBarMenu(!this.useNewHeader, false) : undefined}
          showDatePicker={this.props.showDatePicker}
          dateRangeFrom={this.state.dateRangeFrom}
          dateRangeTo={this.state.dateRangeTo}
          isRefreshPaused={this.props.isRefreshPaused}
          refreshInterval={this.props.refreshInterval}
          showAutoRefreshOnly={this.props.showAutoRefreshOnly}
          showQueryInput={this.props.showQueryInput}
          onRefresh={this.props.onRefresh}
          onRefreshChange={this.props.onRefreshChange}
          onChange={this.onQueryBarChange}
          isDirty={this.isDirty()}
          customSubmitButton={
            this.props.customSubmitButton ? this.props.customSubmitButton : undefined
          }
          dataTestSubj={this.props.dataTestSubj}
          indicateNoData={this.props.indicateNoData}
          datePickerRef={this.props.datePickerRef}
        />
      );
    }

    let queryEditor;
    if (this.shouldRenderQueryEditor(isEnhancementsEnabledOverride)) {
      queryEditor = (
        <QueryEditorTopRow
          timeHistory={this.props.timeHistory}
          query={this.state.query}
          screenTitle={this.props.screenTitle}
          onSubmit={this.onQueryBarSubmit}
          indexPatterns={this.props.indexPatterns}
          isLoading={this.props.isLoading}
          prepend={this.isQueryLanguageFilterable() ? searchBarMenu() : undefined}
          showDatePicker={this.props.showDatePicker}
          dateRangeFrom={this.state.dateRangeFrom}
          dateRangeTo={this.state.dateRangeTo}
          isRefreshPaused={this.props.isRefreshPaused}
          refreshInterval={this.props.refreshInterval}
          showAutoRefreshOnly={this.props.showAutoRefreshOnly}
          showQueryEditor={this.props.showQueryInput}
          onRefresh={this.props.onRefresh}
          onRefreshChange={this.props.onRefreshChange}
          onChange={this.onQueryBarChange}
          isDirty={this.isDirty()}
          customSubmitButton={
            this.props.customSubmitButton ? this.props.customSubmitButton : undefined
          }
          filterBar={filterBar}
          dataTestSubj={this.props.dataTestSubj}
          indicateNoData={this.props.indicateNoData}
          datasetSelectorRef={this.props.datasetSelectorRef}
          datePickerRef={this.props.datePickerRef}
          savedQueryManagement={searchBarMenu(false, true)}
          queryStatus={this.props.queryStatus}
        />
      );
    }

    const className = isEnhancementsEnabledOverride ? 'globalQueryEditor' : 'globalQueryBar';

    return (
      <div className={className} data-test-subj={className}>
        {queryBar}
        {queryEditor}
        {!isEnhancementsEnabledOverride && filterBar}

        {this.state.showSaveQueryModal ? (
          <SaveQueryForm
            formUiType="Modal"
            savedQuery={this.props.savedQuery ? this.props.savedQuery.attributes : undefined}
            savedQueryService={this.savedQueryService}
            onSave={this.onSave}
            onClose={() => this.setState({ showSaveQueryModal: false })}
            showFilterOption={this.props.showFilterBar}
            showTimeFilterOption={this.shouldRenderTimeFilterInSavedQueryForm()}
          />
        ) : null}
        {this.state.showSaveNewQueryModal ? (
          <SaveQueryForm
            formUiType="Modal"
            savedQueryService={this.savedQueryService}
            onSave={(savedQueryMeta) => this.onSave(savedQueryMeta, true)}
            onClose={() => this.setState({ showSaveNewQueryModal: false })}
            showFilterOption={this.props.showFilterBar}
            showTimeFilterOption={this.shouldRenderTimeFilterInSavedQueryForm()}
          />
        ) : null}
      </div>
    );
  }
}

// Needed for React.lazy
// eslint-disable-next-line import/no-default-export
export default injectI18n(withOpenSearchDashboards(SearchBarUI));
