/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiI18n, EuiIcon, EuiTextColor } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';

interface GetStartCard {
  id: string;
  title: string;
  description: string;
  icon: React.JSX.Element;
  footer: React.JSX.Element;
  navigateAppId: string;
  order: number;
}

const DISCOVER_APP_ID = 'discover';
const VISUALIZE_APP_ID = 'visualize';
const DASHBOARDS_APP_ID = 'dashboards';

export const getStartedCards: GetStartCard[] = [
  {
    id: 'get_start_discover',
    icon: <EuiIcon type="compass" size="l" color="primary" />,
    title: '',
    description: i18n.translate('workspace.essential_overview.discover.card.description', {
      defaultMessage: 'Explore data to uncover and discover insights.',
    }),
    footer: (
      <EuiTextColor color="subdued">
        <EuiI18n token="workspace.essential_overview.discover.card.footer" default="Discover" />
      </EuiTextColor>
    ),
    navigateAppId: DISCOVER_APP_ID,
    order: 20,
  },
  {
    id: 'get_start_visualization',
    icon: <EuiIcon type="lineChart" size="l" color="primary" />,
    title: '',
    description: i18n.translate('workspace.essential_overview.visualize.card.description', {
      defaultMessage: 'Gain deeper insights by visualizing and aggregating your data.',
    }),
    footer: (
      <EuiTextColor color="subdued">
        <EuiI18n
          token="workspace.essential_overview.visualize.card.footer"
          default="Visualizations"
        />
      </EuiTextColor>
    ),
    navigateAppId: VISUALIZE_APP_ID,
    order: 30,
  },
  {
    id: 'get_start_dashboards',
    icon: <EuiIcon type="dashboard" size="l" color="primary" />,
    title: '',
    description: i18n.translate('workspace.essential_overview.dashboards.card.description', {
      defaultMessage: 'Monitor and explore your data using dynamic data visualization tools.',
    }),
    footer: (
      <EuiTextColor color="subdued">
        <EuiI18n token="workspace.essential_overview.dashboards.card.footer" default="Dashboards" />
      </EuiTextColor>
    ),
    navigateAppId: DASHBOARDS_APP_ID,
    order: 40,
  },
];
