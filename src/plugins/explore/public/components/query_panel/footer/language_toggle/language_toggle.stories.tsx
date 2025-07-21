/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { LanguageToggle } from './language_toggle';
import { StorybookProviders } from '../../mock_provider.mocks';
import { EditorMode } from '../../../../application/utils/state_management/types';

const meta: Meta<typeof LanguageToggle> = {
  title: 'src/plugins/explore/public/components/query_panel/footer/language_toggle',
  component: LanguageToggle,
  decorators: [
    (Story) => (
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'LanguageToggle component provides a popover menu to switch between Query (PPL) and Prompt (Ask AI) editor modes.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LanguageToggle>;

export const Default: Story = {
  name: 'Query Mode (Default)',
  render: () => (
    <StorybookProviders editorMode={EditorMode.Query}>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
          In Query mode with prompt unavailable: Only PPL option shown (disabled)
        </p>
        <LanguageToggle />
      </div>
    </StorybookProviders>
  ),
};

export const PromptMode: Story = {
  name: 'Prompt Mode',
  render: () => (
    <StorybookProviders editorMode={EditorMode.Prompt}>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
          In Prompt mode with prompt unavailable: Only PPL option shown (enabled)
        </p>
        <LanguageToggle />
      </div>
    </StorybookProviders>
  ),
};
