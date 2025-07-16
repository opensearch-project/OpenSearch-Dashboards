/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TopEditor } from './top_editor';
import { StorybookProviders } from '../../mock_provider.mocks';
import { EditorMode } from '../../../../application/utils/state_management/types';
import '../editor_stack.scss';

const meta: Meta<typeof TopEditor> = {
  title: 'src/plugins/explore/public/components/query_panel/editor_stack/top_editor',
  component: TopEditor,
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
        options: [
          EditorMode.SingleQuery,
          EditorMode.DualQuery,
          EditorMode.SinglePrompt,
          EditorMode.DualPrompt,
        ],
      },
      description: 'Editor mode that controls styling, behavior, and placeholder text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TopEditor>;

export const SingleQueryMode: Story = {
  args: {
    editorMode: EditorMode.SingleQuery,
  },
  parameters: {
    docs: {
      description: {
        story: 'Top editor in single query mode - uses queryEditor styling with PPL placeholder',
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
        story: 'Top editor in dual query mode - readonly state with queryEditor styling',
      },
    },
  },
};

export const SinglePromptMode: Story = {
  args: {
    editorMode: EditorMode.SinglePrompt,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Top editor in single prompt mode - uses promptEditor styling with single placeholder',
      },
    },
  },
};

export const DualPromptMode: Story = {
  args: {
    editorMode: EditorMode.DualPrompt,
  },
  parameters: {
    docs: {
      description: {
        story: 'Top editor in dual prompt mode - uses promptEditor styling with dual placeholder',
      },
    },
  },
};
