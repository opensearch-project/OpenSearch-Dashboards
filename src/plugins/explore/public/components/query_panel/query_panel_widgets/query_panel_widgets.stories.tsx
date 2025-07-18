/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryPanelWidgets } from './query_panel_widgets';
import { StorybookProviders } from '../mock_provider.mocks';
import { RECENT_QUERIES_TABLE_WRAPPER_EL } from '../utils/constants';

// Component wrapper to create the portal container
const QueryPanelWidgetsWrapper = () => {
  useEffect(() => {
    // Create the portal container element if it doesn't exist
    let portalContainer = document.getElementById(RECENT_QUERIES_TABLE_WRAPPER_EL);
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = RECENT_QUERIES_TABLE_WRAPPER_EL;
      document.body.appendChild(portalContainer);
    }

    return () => {
      // Clean up the portal container on unmount
      const existingContainer = document.getElementById(RECENT_QUERIES_TABLE_WRAPPER_EL);
      if (existingContainer) {
        document.body.removeChild(existingContainer);
      }
    };
  }, []);

  return <QueryPanelWidgets />;
};

const meta: Meta<typeof QueryPanelWidgets> = {
  title: 'src/plugins/explore/public/components/query_panel/query_panel_widgets',
  component: QueryPanelWidgets,
  decorators: [
    (Story) => (
      <StorybookProviders>
        <div style={{ padding: '20px', width: '100%' }}>
          <Story />
        </div>
      </StorybookProviders>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof QueryPanelWidgets>;

export const Default: Story = {
  render: () => <QueryPanelWidgetsWrapper />,
};
