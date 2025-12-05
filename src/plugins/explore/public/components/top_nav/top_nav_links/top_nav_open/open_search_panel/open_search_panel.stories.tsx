/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { OpenSearchPanel, OpenSearchPanelProps } from './open_search_panel';
import { OpenSearchDashboardsContextProvider } from '../../../../../../../opensearch_dashboards_react/public';

const mockServices = {
  core: {
    uiSettings: {},
    savedObjects: {},
    application: { navigateToApp: () => {} },
  },
  addBasePath: (path: string) => path,
  data: {
    query: { queryString: { clearQuery: () => {}, getLanguageService: () => {} } },
  },
  filterManager: { setAppFilters: () => {} },
  store: { dispatch: () => {} },
};

const meta: Meta<OpenSearchPanelProps> = {
  title:
    'src/plugins/explore/public/components/top_nav/top_nav_links/top_nav_open/open_search_panel',
  component: OpenSearchPanel,
  decorators: [
    (Story) => (
      <OpenSearchDashboardsContextProvider services={mockServices as any}>
        <Story />
      </OpenSearchDashboardsContextProvider>
    ),
  ],
  args: {
    onClose: () => alert('Closed'),
  },
};

export default meta;

type Story = StoryObj<OpenSearchPanelProps>;

export const Default: Story = {};
