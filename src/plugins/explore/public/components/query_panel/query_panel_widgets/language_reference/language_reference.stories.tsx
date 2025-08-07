/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { LanguageReference } from './language_reference';
import { StorybookProviders } from '../../mock_provider.mocks';

const meta: Meta<typeof LanguageReference> = {
  title: 'src/plugins/explore/public/components/query_panel/query_panel_widgets/language_reference',
  component: LanguageReference,
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
        component: 'LanguageReference component displays the reference information.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LanguageReference>;

export const Default: Story = {
  name: 'All Editor Modes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Query Mode</h3>
        <LanguageReference />
      </div>
    </div>
  ),
};
