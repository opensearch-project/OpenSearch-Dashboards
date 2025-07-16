/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ErrorCodeBlock } from './error_code_block';

const meta: Meta<typeof ErrorCodeBlock> = {
  title: 'src/plugins/explore/public/components/error_panel/error_code_block',
  component: ErrorCodeBlock,
  argTypes: {
    title: {
      control: 'text',
      description: 'Title text displayed above the code block',
    },
    text: {
      control: 'text',
      description: 'Text content displayed in the code block',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays error information with a title and copyable code block.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorCodeBlock>;

export const Default: Story = {
  args: {
    title: 'Query Error',
    text: 'Syntax error in query: unexpected token at line 5',
  },
};
