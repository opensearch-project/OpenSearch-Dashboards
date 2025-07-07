/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { DetectedLanguage } from './detected_language';
import { StorybookProviders } from '../../mock_provider.mocks';
import { EditorMode } from '../../../../application/utils/state_management/types';

const meta: Meta<typeof DetectedLanguage> = {
  title: 'src/plugins/explore/public/components/query_panel/footer/detected_language',
  component: DetectedLanguage,
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
          'DetectedLanguage component displays the current query language mode and reference information.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DetectedLanguage>;

export const Default: Story = {
  name: 'All Editor Modes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Single Query Mode</h3>
        <DetectedLanguage />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Single Prompt Mode</h3>
        <StorybookProviders editorMode={EditorMode.SinglePrompt}>
          <DetectedLanguage />
        </StorybookProviders>
      </div>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Dual Query Mode</h3>
        <StorybookProviders editorMode={EditorMode.DualQuery}>
          <DetectedLanguage />
        </StorybookProviders>
      </div>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Dual Prompt Mode</h3>
        <StorybookProviders editorMode={EditorMode.DualPrompt}>
          <DetectedLanguage />
        </StorybookProviders>
      </div>
    </div>
  ),
};
