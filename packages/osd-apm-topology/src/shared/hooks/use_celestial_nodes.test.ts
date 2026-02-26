/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import type { GetServiceMapOutput } from '../types/sdk.types';
import { useCelestialNodes } from './use_celestial_nodes.hook';

jest.mock('@xyflow/react', () => require('../../test_utils/xyflow_mock'));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MarkerType } = require('@xyflow/react');

describe('useCelestialNodes', () => {
  const mockFixtureData: GetServiceMapOutput = {
    StartTime: new Date(0),
    EndTime: new Date(0),
    Nodes: [
      {
        NodeId: 'node-1',
        Name: 'Test Node 1',
        Type: 'AWS::CloudWatch::Service',
        AttributeMaps: [],
        KeyAttributes: { Name: 'Test Node 1', Type: 'AWS::CloudWatch::Service' },
        StatisticReferences: { MetricReferences: [] },
      },
      {
        NodeId: 'node-2',
        Name: 'Test Node 2',
        Type: 'AWS::Resource',
        AttributeMaps: [],
        KeyAttributes: { Name: 'Test Node 2', ResourceType: 'DynamoDB', Type: 'AWS::Resource' },
        StatisticReferences: { MetricReferences: [] },
      },
      {
        NodeId: 'node-3',
        Name: 'Test Node 3',
        Type: 'AWS::Service',
        AttributeMaps: [],
        KeyAttributes: { Name: 'AWS::S3', Type: 'AWS::Service' },
        StatisticReferences: { MetricReferences: [] },
      },
    ],
    Edges: [
      {
        EdgeId: 'edge-1',
        SourceNodeId: 'node-1',
        DestinationNodeId: 'node-2',
        StatisticReferences: { MetricReferences: [] },
      },
      {
        EdgeId: 'edge-3',
        SourceNodeId: 'node-1',
        DestinationNodeId: 'node-3',
        StatisticReferences: { MetricReferences: [] },
      },
    ],
    AggregatedNodes: [],
    NextToken: undefined,
    AwsAccountId: '12345678910',
  };
  it('returns nodes, edges with expected properties', () => {
    const { result } = renderHook(() => useCelestialNodes(mockFixtureData));
    const { nodes, edges } = result.current;
    // Validate nodes
    expect(nodes).toHaveLength(3);
    expect(nodes[0]).toMatchObject({ id: 'node-1', type: 'celestialNode' });
    expect(nodes[0].data).toMatchObject({ dependencyTypes: ['DynamoDB', 'AWS::S3'] });
    expect(nodes[1]).toMatchObject({ id: 'node-2', type: 'celestialNode' });
    // Validate edges
    expect(edges).toHaveLength(2);
    expect(edges[0]).toMatchObject({
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      sourceHandle: 'source-right',
      targetHandle: 'target-left',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { strokeWidth: 2 },
      type: 'bezier',
    });
  });
});
