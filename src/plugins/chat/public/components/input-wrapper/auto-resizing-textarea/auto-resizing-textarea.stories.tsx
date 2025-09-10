/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { AutoResizingTextarea } from './auto-resizing-textarea';

const meta: Meta<typeof AutoResizingTextarea> = {
  title: 'src/plugins/chat/public/components/input-wrapper/auto-resizing-textarea',
  component: AutoResizingTextarea,
  decorators: [
    (Story) => (
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5', maxWidth: '600px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'AutoResizingTextarea is a textarea component that automatically adjusts its height based on content, with a configurable maximum number of rows.',
      },
    },
  },
  argTypes: {
    value: { control: 'text' },
    placeholder: { control: 'text' },
    maxRows: { control: { type: 'number', min: 1, max: 20 } },
    autoFocus: { control: 'boolean' },
    onChange: { action: 'changed' },
    onKeyDown: { action: 'key pressed' },
    onCompositionStart: { action: 'composition started' },
    onCompositionEnd: { action: 'composition ended' },
  },
};

export default meta;
type Story = StoryObj<typeof AutoResizingTextarea>;

export const Default: Story = {
  args: {
    value: '',
    placeholder: 'Type your message here...',
    maxRows: 5,
    onChange: () => {},
  },
};

export const WithValue: Story = {
  args: {
    value: 'This is some sample text in the auto-resizing textarea',
    placeholder: 'Type your message here...',
    maxRows: 5,
    onChange: () => {},
  },
};

export const SingleRow: Story = {
  args: {
    value: '',
    placeholder: 'Single row only',
    maxRows: 1,
    onChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Textarea limited to a single row, will not expand.',
      },
    },
  },
};

export const MultipleRows: Story = {
  args: {
    value:
      'This is a longer text that spans multiple lines.\nSecond line here.\nThird line to demonstrate auto-resizing behavior.',
    placeholder: 'Type your message here...',
    maxRows: 10,
    onChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Textarea with content spanning multiple lines, showing auto-resize behavior.',
      },
    },
  },
};

export const WithAutoFocus: Story = {
  args: {
    value: '',
    placeholder: 'This textarea will auto-focus when rendered',
    maxRows: 5,
    autoFocus: true,
    onChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Textarea that automatically receives focus when rendered.',
      },
    },
  },
};

export const Interactive: Story = {
  render: function InteractiveRender(args) {
    const [value, setValue] = React.useState('Start typing to see the auto-resize behavior...');

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(event.target.value);
      args.onChange?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        setValue(value + '\nNew line added via Enter key!');
      }
      args.onKeyDown?.(event);
    };

    return (
      <AutoResizingTextarea
        {...args}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    );
  },
  args: {
    placeholder: 'Start typing to see auto-resize behavior...',
    maxRows: 8,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive version where you can type and see the textarea automatically resize. Press Enter to add new lines.',
      },
    },
  },
};

export const LimitedRows: Story = {
  render: function LimitedRowsRender(args) {
    const [value, setValue] = React.useState(
      'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6 - This line and beyond should be scrollable'
    );

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(event.target.value);
      args.onChange?.(event);
    };

    return <AutoResizingTextarea {...args} value={value} onChange={handleChange} />;
  },
  args: {
    placeholder: 'Maximum 3 rows...',
    maxRows: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Textarea limited to 3 rows maximum. Content beyond this limit will be scrollable.',
      },
    },
  },
};
