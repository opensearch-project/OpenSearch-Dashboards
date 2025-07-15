/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SaveQueryButton } from './save_query';
import { StorybookProviders } from '../../mock_provider.mocks';

const meta: Meta<typeof SaveQueryButton> = {
  title: 'src/plugins/explore/public/components/query_panel/footer/save_query',
  component: SaveQueryButton,
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
type Story = StoryObj<typeof SaveQueryButton>;

export const Default: Story = {
  render: () => <SaveQueryButton />,
};
