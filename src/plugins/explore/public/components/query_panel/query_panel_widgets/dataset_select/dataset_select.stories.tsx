/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DatasetSelectWidget } from './dataset_select';
import { StorybookProviders } from '../../mock_provider.mocks';

const meta: Meta<typeof DatasetSelectWidget> = {
  title: 'src/plugins/explore/public/components/query_panel/query_panel_widgets/dataset_select',
  component: DatasetSelectWidget,
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
type Story = StoryObj<typeof DatasetSelectWidget>;

export const Default: Story = {
  render: () => <DatasetSelectWidget />,
};
