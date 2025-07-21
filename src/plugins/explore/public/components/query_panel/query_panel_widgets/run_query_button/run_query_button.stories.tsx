/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RunQueryButton } from './run_query_button';
import { StorybookProviders } from '../../mock_provider.mocks';

const meta: Meta<typeof RunQueryButton> = {
  title: 'src/plugins/explore/public/components/query_panel/query_panel_widgets/run_query_button',
  component: RunQueryButton,
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
type Story = StoryObj<typeof RunQueryButton>;

export const Default: Story = {
  render: () => <RunQueryButton />,
};
