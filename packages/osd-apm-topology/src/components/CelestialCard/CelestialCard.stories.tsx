/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { ReactFlowProvider } from '@xyflow/react';
import * as Icons from '../../shared/resources/services';
import { CelestialStateProvider } from '../../shared/contexts/CelestialStateContext';
import { CelestialNodeActionsProvider } from '../../shared/contexts/NodeActionsContext';
import { CelestialCard } from './CelestialCard';
import { CelestialCardProps } from './types';

const meta: Meta<typeof CelestialCard> = {
  title: 'Components/Celestial/CelestialCard',
  component: CelestialCard,
  argTypes: {
    isInstrumented: { control: 'boolean' },
    isGroup: { control: 'boolean' },
  },
};

// eslint-disable-next-line import/no-default-export
export default meta;

type Story = StoryObj<typeof CelestialCard>;

const CelestialCardTemplate = (props: CelestialCardProps) => (
  <div className="osd:flex osd:items-center osd:justify-center osd:min-h-screen">
    <ReactFlowProvider>
      <CelestialStateProvider>
        <CelestialNodeActionsProvider>
          <CelestialCard {...props} />
        </CelestialNodeActionsProvider>
      </CelestialStateProvider>
    </ReactFlowProvider>
  </div>
);

// Helper function to create default metrics
const defaultMetrics = {
  requests: 100,
  faults5xx: 0,
  errors4xx: 0,
};

// Create a story for each icon
export const APIGateway: Story = {
  render: CelestialCardTemplate,
  args: {
    id: 'api-gateway-node',
    title: 'API Gateway',
    keyAttributes: { foo: 'bar' },
    subtitle: 'REST API Endpoint',
    icon: <img src={Icons.ApiGatewayIcon} alt="" />,
    metrics: defaultMetrics,
    isInstrumented: true,
  },
};

export const AppMesh: Story = {
  render: CelestialCardTemplate,
  args: {
    id: 'app-mesh-node',
    title: 'App Mesh',
    subtitle: 'Service Mesh',
    keyAttributes: { foo: 'bar' },
    icon: <img src={Icons.AppMeshIcon} alt="" />,
    metrics: defaultMetrics,
    isInstrumented: true,
  },
};

export const AppRunner: Story = {
  render: CelestialCardTemplate,
  args: {
    id: 'app-runner-node',
    title: 'App Runner',
    subtitle: 'Container Service',
    keyAttributes: { foo: 'bar' },
    icon: <img src={Icons.AppRunnerIcon} alt="" />,
    metrics: defaultMetrics,
    isInstrumented: true,
  },
};

export const AppSync: Story = {
  render: CelestialCardTemplate,
  args: {
    id: 'app-sync-node',
    title: 'AppSync',
    subtitle: 'GraphQL API',
    keyAttributes: { foo: 'bar' },
    icon: <img src={Icons.AppSyncIcon} alt="" />,
    metrics: defaultMetrics,
    isInstrumented: true,
  },
};

export const AutoScaling: Story = {
  render: CelestialCardTemplate,
  args: {
    id: 'auto-scaling-node',
    title: 'Auto Scaling',
    subtitle: 'EC2 Auto Scaling',
    keyAttributes: { foo: 'bar' },
    icon: <img src={Icons.AutoScalingIcon} alt="" />,
    metrics: defaultMetrics,
    isInstrumented: true,
  },
};

export const Client: Story = {
  render: CelestialCardTemplate,
  args: {
    id: 'client-node',
    title: 'Client',
    subtitle: 'External Client',
    keyAttributes: { foo: 'bar' },
    icon: <img src={Icons.ClientIcon} alt="" />,
    metrics: defaultMetrics,
    isInstrumented: true,
  },
};

export const CloudFormation: Story = {
  render: CelestialCardTemplate,
  args: {
    id: 'cloud-formation-node',
    title: 'CloudFormation',
    subtitle: 'Infrastructure as Code',
    keyAttributes: { foo: 'bar' },
    icon: <img src={Icons.CloudFormationIcon} alt="" />,
    metrics: defaultMetrics,
    isInstrumented: true,
  },
};

// Continue for each icon...

// Example with alarming state
export const AlarmingService: Story = {
  render: CelestialCardTemplate,
  args: {
    id: 'service-node',
    title: 'Alarming Service',
    subtitle: 'Service with Errors',
    keyAttributes: { foo: 'bar' },
    icon: <img src={Icons.ServiceIcon} alt="" />,
    metrics: {
      ...defaultMetrics,
      faults5xx: 5,
    },
    health: {
      status: 'breached',
      breached: 1,
      recovered: 0,
      total: 1,
    },
    isInstrumented: true,
  },
};

// Example of an uninstrumented service
export const UninstrumentedService: Story = {
  render: CelestialCardTemplate,
  args: {
    id: 'service-lens-node',
    title: 'Uninstrumented Service',
    subtitle: 'No Metrics Available',
    keyAttributes: { foo: 'bar' },
    icon: <img src={Icons.ServiceLensUnknownNodeIcon} alt="" />,
    isInstrumented: false,
  },
};

// Example of a group
export const GroupNode: Story = {
  render: CelestialCardTemplate,
  args: {
    id: 'service-group-node',
    title: 'Service Group',
    keyAttributes: { foo: 'bar' },
    subtitle: 'Collection of Services',
    icon: <img src={Icons.ApplicationIcon} alt="" />,
    isGroup: true,
    isInstrumented: true,
  },
};

// Grid view of all icons
export const AllIcons: Story = {
  render: () => (
    <div className="osd:grid osd:grid-cols-4 osd:gap-4 osd:p-4">
      <ReactFlowProvider>
        <CelestialStateProvider>
          <CelestialNodeActionsProvider>
            {Object.entries(Icons).map(([name, iconSrc]) => (
              <CelestialCard
                id={name}
                key={name}
                title={name.replace('Icon', '')}
                keyAttributes={{ Name: name }}
                subtitle={`AWS ${name.replace('Icon', '')}`}
                icon={<img src={iconSrc as string} alt="" />}
                metrics={defaultMetrics}
                isInstrumented={true}
              />
            ))}
          </CelestialNodeActionsProvider>
        </CelestialStateProvider>
      </ReactFlowProvider>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Displays all available AWS service icons in a grid layout.',
      },
    },
  },
};

// Add more stories for remaining icons following the same pattern...
