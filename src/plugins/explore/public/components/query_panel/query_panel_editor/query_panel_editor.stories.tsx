/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryPanelEditor } from './query_panel_editor';
import { StorybookProviders } from '../mock_provider.mocks';
import { EditorMode } from '../../../application/utils/state_management/types';

const meta: Meta<typeof QueryPanelEditor> = {
  title: 'src/plugins/explore/public/components/query_panel/query_panel_editor',
  component: QueryPanelEditor,
  decorators: [
    (Story, { args }) => (
      <StorybookProviders editorMode={args.editorMode}>
        <div
          style={{
            padding: '20px',
            height: '300px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: '#fafbfd',
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
        options: [EditorMode.Query, EditorMode.Prompt],
      },
      description: 'Editor mode that controls styling, behavior, and placeholder text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof QueryPanelEditor>;

export const QueryMode: Story = {
  args: {
    editorMode: EditorMode.Query,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Query panel editor in query mode - allows PPL queries with autocomplete and space-to-prompt functionality',
      },
    },
  },
};

export const PromptMode: Story = {
  args: {
    editorMode: EditorMode.Prompt,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Query panel editor in prompt mode - AI assistant mode with natural language input and escape-to-query functionality',
      },
    },
  },
};
