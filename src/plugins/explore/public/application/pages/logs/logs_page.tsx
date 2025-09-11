/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '../explore_page.scss';

import React from 'react';
import { EuiErrorBoundary, EuiPage, EuiPageBody } from '@elastic/eui';
import { AppMountParameters, HeaderVariant } from 'opensearch-dashboards/public';
import { useDispatch } from 'react-redux';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { QueryPanel } from '../../../components/query_panel';
import { useInitialQueryExecution } from '../../utils/hooks/use_initial_query_execution';
import { useUrlStateSync } from '../../utils/hooks/use_url_state_sync';
import { useTimefilterSubscription } from '../../utils/hooks/use_timefilter_subscription';
import { useHeaderVariants } from '../../utils/hooks/use_header_variants';
import { NewExperienceBanner } from '../../../components/experience_banners/new_experience_banner';
import { useDatasetContext } from '../../context';
import { BottomContainer } from '../../../components/container/bottom_container';
import { TopNav } from '../../../components/top_nav/top_nav';
import { useInitPage } from '../../../application/utils/hooks/use_page_initialization';
import {
  EXPLORE_LOGS_TAB_ID,
  EXPLORE_PATTERNS_TAB_ID,
  EXPLORE_VISUALIZATION_TAB_ID,
} from '../../../../common';
import { setActiveTab } from '../../utils/state_management/slices';

/**
 * Main application component for the Explore plugin
 */
export const LogsPage: React.FC<Partial<Pick<AppMountParameters, 'setHeaderActionMenu'>>> = ({
  setHeaderActionMenu,
}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { dataset, isLoading } = useDatasetContext();
  const { savedExplore } = useInitPage();
  const { keyboardShortcut } = services;
  const dispatch = useDispatch();

  keyboardShortcut?.useKeyboardShortcut({
    id: 'switchToLogsTabLogs',
    pluginId: 'explore',
    name: i18n.translate('explore.logsPage.switchToLogsTabShortcut', {
      defaultMessage: 'Switch to logs tab',
    }),
    category: i18n.translate('explore.logsPage.navigationCategory', {
      defaultMessage: 'Navigation',
    }),
    keys: 'shift+l',
    execute: () => dispatch(setActiveTab(EXPLORE_LOGS_TAB_ID)),
  });

  keyboardShortcut?.useKeyboardShortcut({
    id: 'switchToPatternsTabLogs',
    pluginId: 'explore',
    name: i18n.translate('explore.logsPage.switchToPatternsTabShortcut', {
      defaultMessage: 'Switch to patterns tab',
    }),
    category: i18n.translate('explore.logsPage.navigationCategory', {
      defaultMessage: 'Navigation',
    }),
    keys: 'shift+p',
    execute: () => dispatch(setActiveTab(EXPLORE_PATTERNS_TAB_ID)),
  });

  keyboardShortcut?.useKeyboardShortcut({
    id: 'switchToVisualizationTabLogs',
    pluginId: 'explore',
    name: i18n.translate('explore.logsPage.switchToVisualizationTabShortcut', {
      defaultMessage: 'Switch to visualization tab',
    }),
    category: i18n.translate('explore.logsPage.navigationCategory', {
      defaultMessage: 'Navigation',
    }),
    keys: 'shift+v',
    execute: () => dispatch(setActiveTab(EXPLORE_VISUALIZATION_TAB_ID)),
  });

  useInitialQueryExecution(services);
  useUrlStateSync(services);
  useTimefilterSubscription(services);
  useHeaderVariants(services, HeaderVariant.APPLICATION);

  return (
    <EuiErrorBoundary>
      <div className="mainPage">
        <EuiPage className="explore-layout" paddingSize="none" grow={false}>
          <EuiPageBody className="explore-layout__page-body">
            <TopNav setHeaderActionMenu={setHeaderActionMenu} savedExplore={savedExplore} />
            <NewExperienceBanner />

            <div className="dscCanvas__queryPanel">
              {dataset && !isLoading ? <QueryPanel /> : null}
            </div>

            {/* Main content area with resizable panels under QueryPanel */}
            <BottomContainer />
          </EuiPageBody>
        </EuiPage>
      </div>
    </EuiErrorBoundary>
  );
};
