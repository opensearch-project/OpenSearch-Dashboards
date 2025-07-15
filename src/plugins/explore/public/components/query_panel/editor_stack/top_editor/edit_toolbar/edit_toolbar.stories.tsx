/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { EditToolbar } from './edit_toolbar';
import { StorybookProviders } from '../../../mock_provider.mocks';
import { EditorMode } from '../../../../../application/utils/state_management/types';

const meta: Meta<typeof EditToolbar> = {
  title: 'src/plugins/explore/public/components/query_panel/editor_stack/edit_toolbar',
  component: EditToolbar,
  decorators: [
    (Story, { args }) => (
      <StorybookProviders editorMode={args.editorMode}>
        <div
          style={{
            padding: '20px',
            background: '#f5f5f5',
            border: '1px solid #d3dae6',
            borderRadius: '4px',
            width: '300px',
          }}
        >
          <Story />
        </div>
      </StorybookProviders>
    ),
  ],
  argTypes: {
    editorMode: {
      control: {
        type: 'select',
        options: [EditorMode.SingleQuery, EditorMode.DualQuery],
      },
      description: 'Editor mode that affects the button text and behavior',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EditToolbar>;

export const Default: Story = {
  args: {
    editorMode: EditorMode.DualPrompt,
  },
  parameters: {
    docs: {
      description: {
        story: 'Edit toolbar in single query mode - shows "Edit Query" button',
      },
    },
  },
};
