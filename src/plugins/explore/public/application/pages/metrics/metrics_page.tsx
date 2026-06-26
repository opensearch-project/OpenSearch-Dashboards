/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '../explore_page.scss';
import './metrics_page.scss';

import React, { useEffect } from 'react';
import rison from 'rison-node';
import { EuiErrorBoundary, EuiPage, EuiPageBody } from '@elastic/eui';
import { AppMountParameters, HeaderVariant } from 'opensearch-dashboards/public';
import { useDispatch } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { useInitialQueryExecution } from '../../utils/hooks/use_initial_query_execution';
import { useUrlStateSync } from '../../utils/hooks/use_url_state_sync';
import { useTimefilterSubscription } from '../../utils/hooks/use_timefilter_subscription';
import { useHeaderVariants } from '../../utils/hooks/use_header_variants';
import { useInitializeMetricsDataset } from '../../utils/hooks/use_initialize_metrics_dataset';
import { NewExperienceBanner } from '../../../components/experience_banners/new_experience_banner';
import { TopNav } from '../../../components/top_nav/top_nav';
import { useInitPage } from '../../../application/utils/hooks/use_page_initialization';
import { MetricsPageTabs } from './metrics_page_tabs';
import { setMetricsPageMode } from '../../utils/state_management/slices/ui/ui_slice';

/**
 * Main application component for the Explore plugin
 */
export const MetricsPage: React.FC<Partial<Pick<AppMountParameters, 'setHeaderActionMenu'>>> = ({
  setHeaderActionMenu,
}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { savedExplore } = useInitPage();
  const dispatch = useDispatch();
  useInitializeMetricsDataset({ services, savedExplore });

  // Switch to query tab when loading a saved search
  useEffect(() => {
    if (savedExplore?.id) {
      dispatch(setMetricsPageMode('query'));
    }
  }, [savedExplore?.id, dispatch]);

  // Apply the metrics page mode from the URL hash `_a.ui.metricsPageMode`. The
  // side-nav "Query metrics" / "Explore metrics" popover actions navigate with
  // this in the hash. On a cross-app arrival the store preloads it, but when the
  // user is ALREADY on Metrics the navigation only updates the hash (no remount,
  // no store reload), so we read it here and dispatch on mount + every
  // hashchange so the tab actually switches.
  useEffect(() => {
    const applyModeFromUrl = () => {
      const hash = window.location.hash;
      const qIndex = hash.indexOf('?');
      if (qIndex === -1) return;
      const aParam = new URLSearchParams(hash.slice(qIndex + 1)).get('_a');
      if (!aParam) return;
      // Rison-decode `_a` and read `ui.metricsPageMode` as a structured field.
      // A substring match on the serialized blob would false-positive when the
      // token appears inside user data (e.g. a saved query/filter value),
      // wrongly flipping the page mode against the user's actual selection.
      let mode: unknown;
      try {
        const decoded = rison.decode(aParam) as { ui?: { metricsPageMode?: unknown } };
        mode = decoded?.ui?.metricsPageMode;
      } catch {
        return; // malformed _a — leave the current mode untouched
      }
      if (mode === 'query' || mode === 'explore') {
        dispatch(setMetricsPageMode(mode));
      }
    };
    applyModeFromUrl();
    window.addEventListener('hashchange', applyModeFromUrl);
    return () => window.removeEventListener('hashchange', applyModeFromUrl);
  }, [dispatch]);

  useInitialQueryExecution(services);
  useUrlStateSync(services);
  useTimefilterSubscription(services);
  useHeaderVariants(services, HeaderVariant.APPLICATION);

  return (
    <EuiErrorBoundary>
      <div className="mainPage metricsPage">
        <EuiPage className="explore-layout" paddingSize="none" grow={false}>
          <EuiPageBody className="explore-layout__page-body">
            <TopNav setHeaderActionMenu={setHeaderActionMenu} savedExplore={savedExplore} />
            <NewExperienceBanner />

            <MetricsPageTabs />
          </EuiPageBody>
        </EuiPage>
      </div>
    </EuiErrorBoundary>
  );
};
