/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '../explore_page.scss';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  EuiErrorBoundary,
  EuiResizableContainer,
  EuiPage,
  EuiPageBody,
  EuiSpacer,
  useIsWithinBreakpoints,
} from '@elastic/eui';
import { AppMountParameters, HeaderVariant } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { RootState } from '../../utils/state_management/store';
import { QueryExecutionStatus } from '../../utils/state_management/types';
import { TopNav } from '../../../components/top_nav/top_nav';
import { DiscoverChartContainer } from '../../../components/chart/discover_chart_container';
import { QueryPanel } from '../../../components/query_panel';
import { DiscoverPanel } from '../../legacy/discover/application/view_components/panel';
import { HeaderDatasetSelector } from '../../components/header_dataset_selector';
import { useInitialQueryExecution } from '../../utils/hooks/use_initial_query_execution';
import { useUrlStateSync } from '../../utils/hooks/use_url_state_sync';
import { useTimefilterSubscription } from '../../utils/hooks/use_timefilter_subscription';
import { ExploreTabs } from '../../../components/tabs/tabs';
import { useHeaderVariants } from '../../utils/hooks/use_header_variants';
import { NewExperienceBanner } from '../../../components/experience_banners/new_experience_banner';
import { useIndexPatternContext } from '../../components/index_pattern_context';
import { DiscoverNoIndexPatterns } from '../../legacy/discover/application/components/no_index_patterns/no_index_patterns';
import { DiscoverUninitialized } from '../../legacy/discover/application/components/uninitialized/uninitialized';
import { LoadingSpinner } from '../../legacy/discover/application/components/loading_spinner/loading_spinner';
import { DiscoverNoResults } from '../../legacy/discover/application/components/no_results/no_results';
import {
  executeQueries,
  defaultPrepareQuery,
} from '../../utils/state_management/actions/query_actions';
import { CanvasPanel } from '../../legacy/discover/application/components/panel/canvas_panel';
import { selectShowDataSetFields } from '../../utils/state_management/selectors';
import { ResultsSummaryPanel } from '../../../components/results_summary/results_summary_panel';
import { useInitPage } from '../../utils/hooks/use_page_initialization';

/**
 * Main application component for the Explore plugin
 */
export const MetricsPage: React.FC<Partial<Pick<AppMountParameters, 'setHeaderActionMenu'>>> = ({
  setHeaderActionMenu,
}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { savedExplore } = useInitPage();
  const dispatch = useDispatch();
  const {
    indexPattern,
    isLoading: indexPatternLoading,
    error: indexPatternError,
  } = useIndexPatternContext();

  // Get status for conditional rendering
  const status = useSelector((state: RootState) => {
    return state.queryEditor.executionStatus || QueryExecutionStatus.UNINITIALIZED;
  });
  const rows = useSelector((state: RootState) => {
    const query = state.query;
    const results = state.results;

    // Use default cache key computation - pass query string only
    const queryString = typeof query.query === 'string' ? query.query : '';
    const cacheKey = defaultPrepareQuery(queryString);
    const rawResults = cacheKey ? results[cacheKey] : null;

    if (rawResults) {
      const hits = rawResults.hits?.hits || [];
      return hits;
    }

    return [];
  });

  const showDataSetFields = useSelector(selectShowDataSetFields);

  const isMobile = useIsWithinBreakpoints(['xs', 's', 'm']);

  useInitialQueryExecution(services);
  useUrlStateSync(services);
  useTimefilterSubscription(services);
  useHeaderVariants(services, HeaderVariant.APPLICATION);

  // Function to refresh data (for uninitialized state)
  const onRefresh = () => {
    if (services) {
      dispatch(executeQueries({ services }) as any);
    }
  };

  const renderBottomRightPanel = () => {
    if (indexPattern == null) {
      return (
        <CanvasPanel>
          <>
            <EuiSpacer size="xxl" />
            <DiscoverNoIndexPatterns />
          </>
        </CanvasPanel>
      );
    }

    if (status === QueryExecutionStatus.NO_RESULTS) {
      return (
        <CanvasPanel>
          <DiscoverNoResults
            queryString={services?.data?.query?.queryString}
            query={services?.data?.query?.queryString?.getQuery()}
            savedQuery={services?.data?.query?.savedQueries}
            timeFieldName={indexPattern.timeFieldName}
          />
        </CanvasPanel>
      );
    }

    if (status === QueryExecutionStatus.UNINITIALIZED) {
      return (
        <CanvasPanel>
          <DiscoverUninitialized onRefresh={onRefresh} />
        </CanvasPanel>
      );
    }

    if (status === QueryExecutionStatus.LOADING && !rows?.length) {
      return (
        <CanvasPanel>
          <LoadingSpinner />
        </CanvasPanel>
      );
    }

    if (status === QueryExecutionStatus.ERROR && !rows?.length) {
      return (
        <CanvasPanel>
          <DiscoverUninitialized onRefresh={onRefresh} />
        </CanvasPanel>
      );
    }

    if (
      status === QueryExecutionStatus.READY ||
      (status === QueryExecutionStatus.LOADING && !!rows?.length) ||
      (status === QueryExecutionStatus.ERROR && !!rows?.length)
    ) {
      return (
        <>
          <ResultsSummaryPanel />
          <CanvasPanel className="explore-chart-panel">
            <div className="dscCanvas__chart">
              <DiscoverChartContainer />
            </div>
          </CanvasPanel>
          <CanvasPanel>
            <ExploreTabs />
          </CanvasPanel>
        </>
      );
    }

    return null;
  };

  const BottomPanel = (
    <EuiResizableContainer
      direction={isMobile ? 'vertical' : 'horizontal'}
      className="explore-layout__bottom-panel"
    >
      {(EuiResizablePanel, EuiResizableButton) => (
        <>
          <EuiResizablePanel
            initialSize={20}
            minSize="260px"
            mode={['collapsible', { position: 'top' }]}
            paddingSize="none"
            style={{ display: showDataSetFields ? 'block' : 'none' }}
          >
            <CanvasPanel testId="dscBottomLeftCanvas">
              <DiscoverPanel />
            </CanvasPanel>
          </EuiResizablePanel>
          <EuiResizableButton style={{ display: showDataSetFields ? 'block' : 'none' }} />
          <EuiResizablePanel
            initialSize={showDataSetFields ? 80 : 100}
            minSize="65%"
            mode="main"
            paddingSize="none"
          >
            <EuiPageBody className="explore-layout__canvas">
              <TopNav setHeaderActionMenu={setHeaderActionMenu} savedExplore={savedExplore} />
              {renderBottomRightPanel()}
            </EuiPageBody>
          </EuiResizablePanel>
        </>
      )}
    </EuiResizableContainer>
  );

  return (
    <EuiErrorBoundary>
      <div className="mainPage">
        <EuiPage className="explore-layout" paddingSize="none" grow={false}>
          <EuiPageBody className="explore-layout__page-body">
            {/* TopNav component - configured like discover */}

            <HeaderDatasetSelector />

            <NewExperienceBanner />

            {/* QueryPanel component - only render when IndexPattern is loaded */}
            <div className="dscCanvas__queryPanel">
              {indexPatternLoading ? (
                <div>Loading IndexPattern...</div>
              ) : indexPatternError ? (
                <div>Error loading IndexPattern: {indexPatternError}</div>
              ) : indexPattern ? (
                <QueryPanel />
              ) : (
                <div>No IndexPattern available</div>
              )}
            </div>

            {/* Main content area with resizable panels under QueryPanel */}
            {BottomPanel}
          </EuiPageBody>
        </EuiPage>
      </div>
    </EuiErrorBoundary>
  );
};
