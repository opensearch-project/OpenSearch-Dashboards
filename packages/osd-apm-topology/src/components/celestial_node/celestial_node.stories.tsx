/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { NodeProps, ReactFlowProvider } from '@xyflow/react';
import { Ec2Icon, LambdaIcon } from '../../shared/resources/services';
import { CelestialNodeActionsProvider } from '../../shared/contexts/node_actions_context';
import { CelestialStateProvider } from '../../shared/contexts/celestial_state_context';
import { CelestialCustomNode, CelestialNode } from './celestial_node';

const meta: Meta<typeof CelestialNode> = {
  title: 'Components/Celestial/Nodes',
  component: CelestialNode,
  argTypes: {
    data: {
      id: '1',
      onMenuClick: { action: 'onMenuClick' },
      onDashboardClick: { action: 'onDashboardClick' },
      onGroupToggle: { action: 'onGroupToggle' },
    },
  },
};

// eslint-disable-next-line import/no-default-export
export default meta;

type Story = StoryObj<typeof CelestialNode>;

const CelestialNodeTemplate = (props: NodeProps<CelestialCustomNode>) => (
  <div className="osd:flex osd:items-center osd:justify-center osd:min-h-screen">
    <ReactFlowProvider>
      <CelestialStateProvider>
        <CelestialNodeActionsProvider>
          <CelestialNode {...props} />
        </CelestialNodeActionsProvider>
      </CelestialStateProvider>
    </ReactFlowProvider>
  </div>
);

// Does not use react state
export const Group: Story = {
  args: {
    data: {
      id: '1',
      title: 'FraudDetector',
      subtitle: 'AWS::Lambda::Function',
      icon: <img src={LambdaIcon} className="osd:w-full osd:h-full osd:object-cover" alt="" />,
      isGroup: true,
      keyAttributes: { foo: 'bar' },
      isInstrumented: true,
      metrics: {
        requests: 100,
        faults5xx: 40, // 5% will show as red segment
        errors4xx: 20, // 10% will show as yellow segment
      },
    },
  },
  render: CelestialNodeTemplate,
};

export const AlarmingGroup: Story = {
  args: {
    data: {
      id: '1',
      title: 'Alarming Group',
      subtitle: 'AWS::EC2::Instance',
      icon: <img src={Ec2Icon} className="osd:w-full osd:h-full osd:object-cover" alt="" />,
      keyAttributes: { foo: 'bar' },
      isGroup: true,
      isInstrumented: true,
      health: {
        status: 'breached',
        breached: 1,
        recovered: 0,
        total: 1,
      },
      metrics: {
        requests: 1000,
        faults5xx: 100, // 10% will show as red segment
        errors4xx: 50, // 5% will show as yellow segment
      },
    },
  },
  render: CelestialNodeTemplate,
};

export const UninstrumentedGroup: Story = {
  args: {
    data: {
      id: '1',
      title: 'Node Title',
      subtitle: 'Node Subtitle',
      icon: <img src={Ec2Icon} className="osd:w-full osd:h-full osd:object-cover" alt="" />,
      keyAttributes: { foo: 'bar' },
      isGroup: true,
      isInstrumented: false,
    },
  },
  render: CelestialNodeTemplate,
};

export const AlarmingUninstrumentedGroup: Story = {
  args: {
    data: {
      id: '1',
      title: 'Alarming Uninstrumented Group',
      subtitle: 'AWS::EC2::Instance',
      icon: <img src={Ec2Icon} className="osd:w-full osd:h-full osd:object-cover" alt="" />,
      keyAttributes: { foo: 'bar' },
      isGroup: true,
      isInstrumented: false,
      health: {
        status: 'breached',
        breached: 1,
        recovered: 0,
        total: 1,
      },
      metrics: {
        requests: 800,
        faults5xx: 160, // 20% will show as red segment
        errors4xx: 40, // 5% will show as yellow segment
      },
    },
  },
  render: CelestialNodeTemplate,
};

export const Node: Story = {
  args: {
    data: {
      id: '1',
      title: 'Healthy Node',
      subtitle: 'AWS::EC2::Instance',
      icon: <img src={Ec2Icon} className="osd:w-full osd:h-full osd:object-cover" alt="" />,
      keyAttributes: { foo: 'bar' },
      isGroup: false,
      isInstrumented: true,
      metrics: {
        requests: 1000,
        faults5xx: 5, // 0.5% will show as red segment
        errors4xx: 10, // 1% will show as yellow segment
      },
    },
  },
  render: CelestialNodeTemplate,
};

export const AlarmingNode: Story = {
  args: {
    data: {
      id: '1',
      title: 'Alarming Node',
      subtitle: 'AWS::EC2::Instance',
      icon: <img src={Ec2Icon} className="osd:w-full osd:h-full osd:object-cover" alt="" />,
      keyAttributes: { foo: 'bar' },
      isGroup: false,
      isInstrumented: true,
      health: {
        status: 'breached',
        breached: 1,
        recovered: 0,
        total: 1,
      },
      metrics: {
        requests: 500,
        faults5xx: 75, // 15% will show as red segment
        errors4xx: 25, // 5% will show as yellow segment
      },
    },
  },
  render: CelestialNodeTemplate,
};

export const UninstrumentedNode: Story = {
  args: {
    data: {
      id: '1',
      title: 'Node Title',
      keyAttributes: { foo: 'bar' },
      subtitle: 'Node Subtitle',
      icon: <img src={Ec2Icon} className="osd:w-full osd:h-full osd:object-cover" alt="" />,
      isGroup: false,
      isInstrumented: false,
    },
  },
  render: CelestialNodeTemplate,
};

export const AlarmingUninstrumentedNode: Story = {
  args: {
    data: {
      id: '1',
      title: 'Alarming Uninstrumented Node',
      subtitle: 'Node Subtitle',
      icon: <img src={Ec2Icon} className="osd:w-full osd:h-full osd:object-cover" alt="" />,
      keyAttributes: { foo: 'bar' },
      isGroup: false,
      isInstrumented: false,
      health: {
        status: 'breached',
        breached: 1,
        recovered: 0,
        total: 1,
      },
      metrics: {
        requests: 600,
        faults5xx: 90, // 15% will show as red segment
        errors4xx: 30, // 5% will show as yellow segment
      },
    },
  },
  render: CelestialNodeTemplate,
};
