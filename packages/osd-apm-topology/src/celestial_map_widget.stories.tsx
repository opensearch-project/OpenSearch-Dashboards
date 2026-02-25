/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { Edge } from '@xyflow/react';
import { CelestialMapWidget, CelestialMapWidgetProps } from './celestial_map_widget';
import { WidgetNodeProps } from './components/widget_node/widget_node';

const meta: Meta<typeof CelestialMapWidget> = {
  title: 'Components/celestial/CelestialMapWidget',
  component: CelestialMapWidget,
};

// eslint-disable-next-line import/no-default-export
export default meta;
type Story = StoryObj<typeof CelestialMapWidget>;

const CelestialMapWidgetTemplate = (props: CelestialMapWidgetProps) => {
  // At the top of your application tree:
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <CelestialMapWidget {...props} />
    </div>
  );
};
// Sample data for the stories
const sampleNodes: WidgetNodeProps[] = [
  {
    id: 'rum-cp',
    title: 'RUM Control Plane',
    subtitle: 'AWS::ApiGateway',
    type: 'AWS::APIGateway',
    status: 'ok',
  },
  {
    id: 'get-app-monitor',
    title: 'GetAppMonitor',
    subtitle: 'AWS::Lambda',
    type: 'AWS::Lambda',
    status: 'ok',
  },
  {
    id: 'app-monitors',
    title: 'AppMonitors',
    subtitle: 'AWS::DynamoDB',
    type: 'AWS::DynamoDB::Table',
    status: 'ok',
  },
];

const sampleEdges: Edge[] = [
  {
    id: 'edge-api-lambda',
    source: 'rum-cp',
    target: 'get-app-monitor',
  },
  {
    id: 'edge-lambda-dynamodb',
    source: 'get-app-monitor',
    target: 'app-monitors',
  },
];

export const Default: Story = {
  args: {
    nodes: sampleNodes,
    edges: sampleEdges,
  },
  render: CelestialMapWidgetTemplate,
};

export const WithFaultAndErrorNodes: Story = {
  args: {
    nodes: [
      sampleNodes[0],
      {
        ...sampleNodes[1],
        status: 'fault',
      },
      {
        ...sampleNodes[2],
        status: 'error',
      },
    ],
    edges: sampleEdges,
  },
  render: CelestialMapWidgetTemplate,
};

export const WithIndirectEdges: Story = {
  args: {
    nodes: sampleNodes,
    edges: [
      sampleEdges[0],
      {
        ...sampleEdges[1],
        type: 'Indirect',
      },
    ],
  },
  render: CelestialMapWidgetTemplate,
};
