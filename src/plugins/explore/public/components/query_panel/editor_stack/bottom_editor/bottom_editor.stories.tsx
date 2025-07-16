/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BottomEditor } from './bottom_editor';
import { StorybookProviders } from '../../mock_provider.mocks';
import { EditorMode } from '../../../../application/utils/state_management/types';

const meta: Meta<typeof BottomEditor> = {
  title: 'src/plugins/explore/public/components/query_panel/editor_stack/bottom_editor',
  component: BottomEditor,
  decorators: [
    (Story, { args }) => (
      <StorybookProviders editorMode={args.editorMode}>
        <div style={{ padding: '20px', height: '300px', border: '1px solid #ccc' }}>
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
      description: 'Editor mode that controls visibility and readonly state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof BottomEditor>;

export const SingleQueryMode: Story = {
  args: {
    editorMode: EditorMode.SingleQuery,
  },
  parameters: {
    docs: {
      description: {
        story: 'Bottom editor in single query mode - hidden and readonly',
      },
    },
  },
};

export const DualQueryMode: Story = {
  args: {
    editorMode: EditorMode.DualQuery,
  },
  parameters: {
    docs: {
      description: {
        story: 'Bottom editor in dual query mode - visible and editable',
      },
    },
  },
};
