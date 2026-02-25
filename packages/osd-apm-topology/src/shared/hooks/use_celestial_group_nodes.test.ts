/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import type { ListServiceGroupingsOutput } from '../types/sdk.types';
import { useCelestialGroupNodes } from './use_celestial_group_nodes';
import { GROUP_NODE_TYPE } from '../constants/common.constants';

describe('useCelestialGroupNodes', () => {
  const mockGroupingsData: ListServiceGroupingsOutput = {
    ServiceGroupingSummaries: [
      {
        GroupingAttribute: {
          GroupingAttributeKey: 'Team',
          GroupingAttributeValue: 'team-1',
          GroupingAttributeIdentifier: 'group-1',
          isCustom: true,
        },
        AttributeMaps: [
          {
            'service.name': 'test-service-1',
            'aws.region': 'us-west-2',
          },
        ],
        MetricReferences: [
          {
            MetricName: 'Latency',
            MetricType: 'LATENCY',
            Namespace: 'ApplicationSignals',
            Dimensions: [
              {
                Name: 'Service',
                Value: 'test-service-1',
              },
            ],
          },
        ],
        DependencyTypes: ['AWS::S3', 'AWS::DynamoDB'],
      },
      {
        GroupingAttribute: {
          GroupingAttributeKey: 'Team',
          GroupingAttributeValue: 'team-2',
          GroupingAttributeIdentifier: 'group-2',
          isCustom: true,
        },
        AttributeMaps: [
          {
            'service.name': 'test-service-2',
            'aws.region': 'us-east-1',
          },
        ],
        MetricReferences: [
          {
            MetricName: 'Latency',
            MetricType: 'LATENCY',
            Namespace: 'ApplicationSignals',
            Dimensions: [
              {
                Name: 'Service',
                Value: 'test-service-2',
              },
            ],
          },
        ],
        DependencyTypes: [],
      },
    ],
    StartTime: new Date('2023-01-01T00:00:00Z'),
    EndTime: new Date('2023-01-01T01:00:00Z'),
    NextToken: undefined,
  };

  it('transforms ServiceGroupingSummaries to CelestialMapModel with nodes and empty edges', () => {
    const { result } = renderHook(() => useCelestialGroupNodes(mockGroupingsData));
    const { nodes, edges } = result.current;

    // Validate nodes
    expect(nodes).toHaveLength(2);

    // Validate first node
    expect(nodes[0]).toMatchObject({
      id: 'group-1',
      type: 'celestialNode',
      draggable: true,
      selectable: true,
      deletable: false,
    });
    expect(nodes[0].position).toBeDefined();
    expect(nodes[0].data).toMatchObject({
      title: 'team-1',
      type: 'Service Group',
      keyAttributes: {
        Name: 'team-1',
        Type: GROUP_NODE_TYPE,
        GroupType: 'Team',
      },
      isGroup: true,
      attributes: [
        {
          'service.name': 'test-service-1',
          'aws.region': 'us-west-2',
        },
      ],
      dependencyTypes: ['AWS::S3', 'AWS::DynamoDB'],
    });

    // Validate second node
    expect(nodes[1]).toMatchObject({
      id: 'group-2',
      type: 'celestialNode',
      draggable: true,
      selectable: true,
      deletable: false,
    });
    expect(nodes[1].position).toBeDefined();
    expect(nodes[1].data).toBeDefined();
    expect(nodes[1].data).toMatchObject({
      title: 'team-2',
      type: 'Service Group',
      keyAttributes: {
        Name: 'team-2',
        Type: GROUP_NODE_TYPE,
        GroupType: 'Team',
      },
      isGroup: true,
      attributes: [
        {
          'service.name': 'test-service-2',
          'aws.region': 'us-east-1',
        },
      ],
      dependencyTypes: [],
    });
    // Validate edges (should be empty for service groupings)
    expect(edges).toHaveLength(0);
    expect(edges).toEqual([]);
  });
});
