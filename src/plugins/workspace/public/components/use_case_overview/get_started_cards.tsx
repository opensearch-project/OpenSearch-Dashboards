/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiI18n } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';

interface GetStartCard {
  id: string;
  title: string;
  description: string;
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
    title: i18n.translate('workspace.essential_overview.discover.card.title', {
      defaultMessage: 'Explore data',
    }),
    description: i18n.translate('workspace.essential_overview.discover.card.description', {
      defaultMessage: 'Explore data to uncover insights.',
    }),
    footer: (
      <EuiI18n token="workspace.essential_overview.discover.card.footer" default="Discover" />
    ),
    navigateAppId: DISCOVER_APP_ID,
    order: 20,
  },
  {
    id: 'get_start_visualization',
    title: i18n.translate('workspace.essential_overview.visualize.card.title', {
      defaultMessage: 'Visualize data',
    }),
    description: i18n.translate('workspace.essential_overview.visualize.card.description', {
      defaultMessage: 'Gain deeper insights by visualizing and aggregating your data.',
    }),
    footer: (
      <EuiI18n token="workspace.essential_overview.visualize.card.footer" default="Visualize" />
    ),
    navigateAppId: VISUALIZE_APP_ID,
    order: 30,
  },
  {
    id: 'get_start_dashboards',
    title: i18n.translate('workspace.essential_overview.dashboards.card.title', {
      defaultMessage: 'Explore your data at a glance',
    }),
    description: i18n.translate('workspace.essential_overview.dashboards.card.description', {
      defaultMessage:
        'Monitor and understand your data connections using dynamic data visualization tools.',
    }),
    footer: (
      <EuiI18n token="workspace.essential_overview.dashboards.card.footer" default="Dashboards" />
    ),
    navigateAppId: DASHBOARDS_APP_ID,
    order: 40,
  },
];
