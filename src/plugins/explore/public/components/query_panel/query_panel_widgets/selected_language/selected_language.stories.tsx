/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { SelectedLanguage } from './selected_language';
import { StorybookProviders } from '../../mock_provider.mocks';
import { EditorMode } from '../../../../application/utils/state_management/types';

const meta: Meta<typeof SelectedLanguage> = {
  title: 'src/plugins/explore/public/components/query_panel/query_panel_widgets/selected_language',
  component: SelectedLanguage,
  decorators: [
    (Story) => (
      <StorybookProviders>
        <div style={{ padding: '16px', backgroundColor: '#f5f5f5' }}>
          <Story />
        </div>
      </StorybookProviders>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'SelectedLanguage component displays the current query language mode and reference information.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SelectedLanguage>;

export const Default: Story = {
  name: 'All Editor Modes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Query Mode</h3>
        <SelectedLanguage />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Prompt Mode</h3>
        <StorybookProviders editorMode={EditorMode.Prompt}>
          <SelectedLanguage />
        </StorybookProviders>
      </div>
    </div>
  ),
};
