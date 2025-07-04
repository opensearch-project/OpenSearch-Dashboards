/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { EditorStack } from './editor_stack';
import { StorybookProviders } from '../mock_provider.mocks';
import { EditorMode } from '../../../application/utils/state_management/types';

const meta: Meta<typeof EditorStack> = {
  title: 'src/plugins/explore/public/components/query_panel/editor_stack',
  component: EditorStack,
  decorators: [
    (Story, { args }) => (
      <StorybookProviders editorMode={args.editorMode}>
        <div
          style={{
            padding: '20px',
            width: '100%',
            maxWidth: '800px',
            border: '1px solid #d3dae6',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
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
      description: 'Editor mode that controls the visibility of EditToolbar and editor behavior',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EditorStack>;

export const SingleQueryMode: Story = {
  args: {
    editorMode: EditorMode.SingleQuery,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Editor stack in single query mode - shows only top and bottom editors without toolbar',
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
        story: 'Editor stack in dual query mode - shows both editors with edit toolbar in between',
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
        story: 'Editor stack in single prompt mode - prompt styling without toolbar',
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
        story: 'Editor stack in dual prompt mode - prompt styling with edit toolbar',
      },
    },
  },
};
