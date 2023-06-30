/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './discover.scss';
import React, { useState, useCallback, useEffect } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiPageSideBar,
  EuiPageContent,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { IUiSettingsClient, MountPoint } from 'opensearch-dashboards/public';
import { HitsCounter } from './hits_counter';
import { TimechartHeader } from './timechart_header';
import { DiscoverSidebar } from './sidebar';
import { DataGridTable } from './data_grid/data_grid_table';
import { getServices, IndexPattern } from '../../opensearch_dashboards_services';
// @ts-ignore
import { DiscoverNoResults } from '../angular/directives/no_results';
import { DiscoverUninitialized } from '../angular/directives/uninitialized';
import { DiscoverHistogram } from '../angular/directives/histogram';
import { LoadingSpinner } from './loading_spinner/loading_spinner';
import { SkipBottomButton } from './skip_bottom_button';
import {
  IndexPatternField,
  search,
  ISearchSource,
  TimeRange,
  Query,
  IndexPatternAttributes,
} from '../../../../data/public';
import { Chart } from '../angular/helpers/point_series';
import { AppState } from '../angular/discover_state';
import { SavedSearch } from '../../saved_searches';

import { SavedObject } from '../../../../../core/types';
import { Vis } from '../../../../visualizations/public';
import { TopNavMenuData } from '../../../../navigation/public';
import { DocViewFilterFn } from '../doc_views/doc_views_types';

export interface DiscoverProps {
  addColumn: (column: string) => void;
  fetch: () => void;
  fetchCounter: number;
  fieldCounts: Record<string, number>;
  histogramData: Chart;
  hits: number;
  indexPattern: IndexPattern;
  onAddFilter: DocViewFilterFn;
  onChangeInterval: (interval: string) => void;
  onMoveColumn: (columns: string, newIdx: number) => void;
  onRemoveColumn: (column: string) => void;
  onSetColumns: (columns: string[]) => void;
  onSkipBottomButtonClick: () => void;
  onSort: (sort: string[][]) => void;
  opts: {
    savedSearch: SavedSearch;
    config: IUiSettingsClient;
    indexPatternList: Array<SavedObject<IndexPatternAttributes>>;
    timefield: string;
    sampleSize: number;
    fixedScroll: (el: HTMLElement) => void;
    setHeaderActionMenu: (menuMount: MountPoint | undefined) => void;
  };
  resetQuery: () => void;
  resultState: string;
  rows: Array<Record<string, unknown>>;
  searchSource: ISearchSource;
  setIndexPattern: (id: string) => void;
  showSaveQuery: boolean;
  state: AppState;
  timefilterUpdateHandler: (ranges: { from: number; to: number }) => void;
  timeRange?: { from: string; to: string };
  topNavMenu: TopNavMenuData[];
  updateQuery: (payload: { dateRange: TimeRange; query?: Query }, isUpdate?: boolean) => void;
  updateSavedQueryId: (savedQueryId?: string) => void;
  vis?: Vis;
}

export function Discover({
  addColumn,
  fetch,
  fetchCounter,
  fieldCounts,
  histogramData,
  hits,
  indexPattern,
  onAddFilter,
  onChangeInterval,
  onMoveColumn,
  onRemoveColumn,
  onSkipBottomButtonClick,
  onSetColumns,
  onSort,
  opts,
  resetQuery,
  resultState,
  rows,
  searchSource,
  setIndexPattern,
  showSaveQuery,
  state,
  timefilterUpdateHandler,
  timeRange,
  topNavMenu,
  updateQuery,
  updateSavedQueryId,
  vis,
}: DiscoverProps) {
  const [isSidebarClosed, setIsSidebarClosed] = useState(false);
  const services = getServices();
  const { TopNavMenu } = services.navigation.ui;
  const { savedSearch, indexPatternList, config } = opts;
  const bucketAggConfig = vis?.data?.aggs?.aggs[1];
  const bucketInterval =
    bucketAggConfig && search.aggs.isDateHistogramBucketAggConfig(bucketAggConfig)
      ? bucketAggConfig.buckets?.getInterval()
      : undefined;
  const [fixedScrollEl, setFixedScrollEl] = useState<HTMLElement | undefined>();

  useEffect(() => (fixedScrollEl ? opts.fixedScroll(fixedScrollEl) : undefined), [
    fixedScrollEl,
    opts,
  ]);
  const fixedScrollRef = useCallback(
    (node: HTMLElement) => {
      if (node !== null) {
        setFixedScrollEl(node);
      }
    },
    [setFixedScrollEl]
  );
  const displayTimeColumn = Boolean(
    !config.get('doc_table:hideTimeColumn', false) && indexPattern.timeFieldName
  );

  return (
    <I18nProvider>
      <EuiPage className="dscAppContainer" data-fetch-counter={fetchCounter}>
        <h1 className="euiScreenReaderOnly">{savedSearch.title}</h1>

        <TopNavMenu
          appName="discover"
          config={topNavMenu}
          indexPatterns={[indexPattern]}
          onQuerySubmit={updateQuery}
          onSavedQueryIdChange={updateSavedQueryId}
          query={state.query}
          setMenuMountPoint={opts.setHeaderActionMenu}
          savedQueryId={state.savedQuery}
          screenTitle={savedSearch.title}
          showDatePicker={indexPattern.isTimeBased()}
          showSaveQuery={showSaveQuery}
          showSearchBar={true}
          useDefaultBehaviors={true}
        />

        <EuiPageBody className="dscPageBody" component="div">
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiPageSideBar>
                {!isSidebarClosed && (
                  <div className="dscFieldChooser">
                    <DiscoverSidebar
                      columns={state.columns || []}
                      fieldCounts={fieldCounts}
                      hits={rows}
                      indexPatternList={indexPatternList}
                      onAddField={addColumn}
                      onAddFilter={onAddFilter}
                      onRemoveField={onRemoveColumn}
                      selectedIndexPattern={searchSource && searchSource.getField('index')}
                      setIndexPattern={setIndexPattern}
                    />
                  </div>
                )}
                <EuiButtonIcon
                  iconType={isSidebarClosed ? 'menuRight' : 'menuLeft'}
                  iconSize="m"
                  size="s"
                  onClick={() => setIsSidebarClosed(!isSidebarClosed)}
                  data-test-subj="collapseSideBarButton"
                  aria-controls="discover-sidebar"
                  aria-expanded={isSidebarClosed ? 'false' : 'true'}
                  aria-label="Toggle sidebar"
                  className="dscCollapsibleSidebar__collapseButton euiButtonIcon--auto"
                />
              </EuiPageSideBar>
            </EuiFlexItem>

            <EuiFlexItem>
              <EuiPageContent>
                {resultState === 'none' && (
                  <DiscoverNoResults
                    timeFieldName={opts.timefield}
                    queryLanguage={state.query ? state.query.language : ''}
                  />
                )}
                {resultState === 'uninitialized' && <DiscoverUninitialized onRefresh={fetch} />}

                {/* Loading State */}
                {resultState === 'loading' && (
                  <div className="dscOverlay">
                    <LoadingSpinner />
                  </div>
                )}

                {/* Ready State */}
                {resultState === 'ready' && (
                  <div className="dscWrapper__content">
                    <SkipBottomButton onClick={onSkipBottomButtonClick} />
                    <HitsCounter
                      hits={hits > 0 ? hits : 0}
                      showResetButton={!!(savedSearch && savedSearch.id)}
                      onResetQuery={resetQuery}
                    />
                    {opts.timefield && (
                      <TimechartHeader
                        dateFormat={opts.config.get('dateFormat')}
                        timeRange={timeRange}
                        options={search.aggs.intervalOptions}
                        onChangeInterval={onChangeInterval}
                        stateInterval={state.interval || ''}
                        bucketInterval={bucketInterval}
                      />
                    )}

                    {opts.timefield && (
                      <section
                        aria-label={i18n.translate('discover.histogramOfFoundDocumentsAriaLabel', {
                          defaultMessage: 'Histogram of found documents',
                        })}
                        className="dscTimechart"
                      >
                        {vis && rows.length !== 0 && (
                          <div className="dscHistogram" data-test-subj="discoverChart">
                            <DiscoverHistogram
                              chartData={histogramData}
                              timefilterUpdateHandler={timefilterUpdateHandler}
                            />
                          </div>
                        )}
                      </section>
                    )}

                    <div className="dscResults">
                      <section
                        className="dscTable dscTableFixedScroll"
                        aria-labelledby="documentsAriaLabel"
                        ref={fixedScrollRef}
                      >
                        <h2 className="euiScreenReaderOnly" id="documentsAriaLabel">
                          <FormattedMessage
                            id="discover.documentsAriaLabel"
                            defaultMessage="Documents"
                          />
                        </h2>
                        {rows && rows.length && (
                          <div className="dscDiscoverGrid">
                            <DataGridTable
                              columns={state.columns || []}
                              indexPattern={indexPattern}
                              rows={rows}
                              sort={(state.sort as Array<[any, any]>) || []}
                              onAddColumn={addColumn}
                              onFilter={onAddFilter}
                              onRemoveColumn={onRemoveColumn}
                              onSetColumns={onSetColumns}
                              onSort={onSort}
                              displayTimeColumn={displayTimeColumn}
                              services={services}
                            />
                            <a tabIndex={0} id="discoverBottomMarker">
                              &#8203;
                            </a>
                            {rows.length === opts.sampleSize && (
                              <div
                                className="dscTable__footer"
                                data-test-subj="discoverDocTableFooter"
                              >
                                <FormattedMessage
                                  id="discover.howToSeeOtherMatchingDocumentsDescription"
                                  defaultMessage="These are the first {sampleSize} documents matching
                  your search, refine your search to see others."
                                  values={{ sampleSize: opts.sampleSize }}
                                />

                                <EuiButtonEmpty onClick={() => window.scrollTo(0, 0)}>
                                  <FormattedMessage
                                    id="discover.backToTopLinkText"
                                    defaultMessage="Back to top."
                                  />
                                </EuiButtonEmpty>
                              </div>
                            )}
                          </div>
                        )}
                      </section>
                    </div>
                  </div>
                )}
              </EuiPageContent>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageBody>
      </EuiPage>
    </I18nProvider>
  );
}
