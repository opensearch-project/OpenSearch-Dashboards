/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RecentQueriesButton } from './recent_queries_button';
import { StorybookProviders } from '../../mock_provider.mocks';
import { RECENT_QUERIES_TABLE_WRAPPER_EL } from '../../utils/constants';

// Component wrapper to create the portal container
const RecentQueriesButtonWrapper = () => {
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

  return <RecentQueriesButton />;
};

const meta: Meta<typeof RecentQueriesButton> = {
  title: 'src/plugins/explore/public/components/query_panel/footer/recent_queries_button',
  component: RecentQueriesButton,
  decorators: [
    (Story) => (
      <StorybookProviders>
        <div style={{ padding: '20px' }}>
          <Story />
        </div>
      </StorybookProviders>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RecentQueriesButton>;

export const Default: Story = {
  render: () => <RecentQueriesButtonWrapper />,
};
