/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { SubmitButton } from './submit-button';

const meta: Meta<typeof SubmitButton> = {
  title: 'src/plugins/chat/public/components/input-wrapper/submit-button',
  component: SubmitButton,
  decorators: [
    (Story) => (
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5', maxWidth: '200px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'SubmitButton is a small filled button icon component with configurable icon type. It can display different icons based on state (submit, stop, etc.).',
      },
    },
  },
  argTypes: {
    disabled: { control: 'boolean' },
    onClick: { action: 'clicked' },
    dataTestSubj: { control: 'text' },
    className: { control: 'text' },
    icon: {
      control: 'select',
      options: ['sortUp', 'stop', 'play', 'pause', 'refresh'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SubmitButton>;

export const Default: Story = {
  args: {
    disabled: false,
    icon: 'sortUp',
  },
};

export const StopIcon: Story = {
  args: {
    disabled: false,
    icon: 'stop',
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with stop icon, typically used when a request is in progress.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    icon: 'sortUp',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Button in disabled state, typically used when there is no content to submit or submission is not allowed.',
      },
    },
  },
};

export const DisabledStop: Story = {
  args: {
    disabled: true,
    icon: 'stop',
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled stop button state.',
      },
    },
  },
};

export const WithCustomClassName: Story = {
  args: {
    disabled: false,
    icon: 'sortUp',
    className: 'custom-submit-button',
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with a custom CSS class applied.',
      },
    },
  },
};

export const WithTestSubject: Story = {
  args: {
    disabled: false,
    icon: 'sortUp',
    dataTestSubj: 'chat-submit-button',
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with a data-test-subj attribute for testing purposes.',
      },
    },
  },
};

export const Interactive: Story = {
  render: function InteractiveRender(args) {
    const [clickCount, setClickCount] = React.useState(0);
    const [isDisabled, setIsDisabled] = React.useState(false);
    const [currentIcon, setCurrentIcon] = React.useState<'sortUp' | 'stop'>('sortUp');

    const handleClick = () => {
      setClickCount((prev) => prev + 1);
      // Toggle icon between sortUp and stop
      setCurrentIcon((prev) => (prev === 'sortUp' ? 'stop' : 'sortUp'));
      if (args.onClick) {
        args.onClick();
      }
    };

    const toggleDisabled = () => {
      setIsDisabled((prev) => !prev);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <SubmitButton {...args} disabled={isDisabled} icon={currentIcon} onClick={handleClick} />
        <div style={{ fontSize: '14px', color: '#666' }}>
          Click count: {clickCount} | Icon: {currentIcon}
        </div>
        <button
          onClick={toggleDisabled}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bb8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {isDisabled ? 'Enable' : 'Disable'} Submit Button
        </button>
      </div>
    );
  },
  args: {
    dataTestSubj: 'interactive-submit-button',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive version where you can click the submit button, toggle its disabled state, and see the icon change.',
      },
    },
  },
};

export const AllIcons: Story = {
  render: function AllIconsRender() {
    const icons = ['sortUp', 'stop', 'play', 'pause', 'refresh'] as const;

    return (
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        {icons.map((icon) => (
          <div key={icon} style={{ textAlign: 'center' }}>
            <SubmitButton disabled={false} icon={icon} />
            <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>{icon}</div>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Showcase of different icon types available for the submit button.',
      },
    },
  },
};

export const AllStates: Story = {
  render: function AllStatesRender() {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <SubmitButton disabled={false} icon="sortUp" />
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>Enabled Submit</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <SubmitButton disabled={true} icon="sortUp" />
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>Disabled Submit</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <SubmitButton disabled={false} icon="stop" />
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>Enabled Stop</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <SubmitButton disabled={true} icon="stop" />
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>Disabled Stop</div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all button states side by side.',
      },
    },
  },
};
