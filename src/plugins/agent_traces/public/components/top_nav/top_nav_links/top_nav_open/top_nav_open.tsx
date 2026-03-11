/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { TopNavMenuIconRun, TopNavMenuIconUIData } from '../types';
import { AgentTracesServices } from '../../../../types';
import {
  OpenSearchDashboardsContextProvider,
  toMountPoint,
} from '../../../../../../opensearch_dashboards_react/public';
import { OpenSearchPanel } from './open_search_panel';

export const openTopNavData: TopNavMenuIconUIData = {
  tooltip: i18n.translate('agentTraces.topNav.openTitle', {
    defaultMessage: 'Open',
  }),
  ariaLabel: i18n.translate('agentTraces.topNav.openAriaLabel', {
    defaultMessage: `Open Saved Search`,
  }),
  testId: 'discoverOpenButton',
  iconType: 'folderOpen',
  controlType: 'icon',
};

export const getOpenButtonRun = (services: AgentTracesServices): TopNavMenuIconRun => () => {
  const flyoutSession = services.overlays.openFlyout(
    toMountPoint(
      <OpenSearchDashboardsContextProvider services={services}>
        <OpenSearchPanel onClose={() => flyoutSession?.close?.().then()} />
      </OpenSearchDashboardsContextProvider>
    )
  );
};
