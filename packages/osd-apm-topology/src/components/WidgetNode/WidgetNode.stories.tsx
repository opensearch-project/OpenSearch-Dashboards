/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { NodeProps, ReactFlowProvider } from '@xyflow/react';
import { WidgetNode } from './WidgetNode';
import type { WidgetNodeType } from './WidgetNode';

const meta: Meta<typeof WidgetNode> = {
  title: 'Components/celestial/WidgetNode',
  component: WidgetNode,
  parameters: {
    layout: 'centered',
  },
};

// eslint-disable-next-line import/no-default-export
export default meta;
type Story = StoryObj<typeof WidgetNode>;

const WidgetNodeTemplate = (props: NodeProps<WidgetNodeType>) => (
  <div className="osd:w-300 osd:aspect-video osd:flex osd:justify-content osd:items-center">
    <ReactFlowProvider>
      <WidgetNode {...props} />
    </ReactFlowProvider>
  </div>
);

export const Default: Story = {
  args: {
    data: {
      id: 'node-1',
      title: 'pet-clinic-frontend',
      subtitle: 'AWS::EC2',
      type: 'AWS::EC2',
      status: 'ok',
    },
  },
  render: WidgetNodeTemplate,
};

export const WithError: Story = {
  args: {
    data: {
      id: 'node-2',
      title: 'ProcessPayment',
      subtitle: 'AWS::Lambda',
      type: 'AWS::Lambda',
      status: 'error',
    },
  },
  render: WidgetNodeTemplate,
};

export const WithFault: Story = {
  args: {
    data: {
      id: 'node-3',
      title: 'Users',
      subtitle: 'AWS::DynamoDB',
      type: 'AWS::DynamoDB::Table',
      status: 'fault',
    },
  },
  render: WidgetNodeTemplate,
};

export const NoSubtitle: Story = {
  args: {
    data: {
      id: 'widget-4',
      title: 'My service',
      type: 'AWS::Service',
      status: 'ok',
    },
  },
  render: WidgetNodeTemplate,
};
