/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { TopNavMenuIconRun, TopNavMenuIconUIData } from '../types';
import { AgentTracesServices } from '../../../../types';
import {
  OpenSearchDashboardsContextProvider,
  toMountPoint,
} from '../../../../../../opensearch_dashboards_react/public';
import { OpenSearchPanel } from './open_search_panel';

// One label for both the tooltip and the aria-label. "Browse" rather than "Open" so it reads
// distinctly from the query panel's "Open query".
const browseSearchesLabel = i18n.translate('agentTraces.topNav.openAriaLabel', {
  defaultMessage: 'Browse searches',
});

export const openTopNavData: TopNavMenuIconUIData = {
  tooltip: browseSearchesLabel,
  ariaLabel: browseSearchesLabel,
  testId: 'discoverOpenButton',
  iconType: 'folderOpen',
  controlType: 'icon',
};

export const getOpenButtonRun =
  (services: AgentTracesServices): TopNavMenuIconRun =>
  () => {
    const flyoutSession = services.overlays.openFlyout(
      toMountPoint(
        <OpenSearchDashboardsContextProvider services={services}>
          <OpenSearchPanel onClose={() => flyoutSession?.close?.().then()} />
        </OpenSearchDashboardsContextProvider>
      )
    );
  };
