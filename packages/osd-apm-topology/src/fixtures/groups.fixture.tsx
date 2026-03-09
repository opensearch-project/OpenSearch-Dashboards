/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { Edge, Node } from '@xyflow/react';
import {
  ApiGatewayIcon,
  ClientIcon,
  DynamodbIcon,
  Ec2Icon,
  LambdaIcon,
  LoadBalancerIcon,
  RdsIcon,
  S3Icon,
} from '../shared/resources/services';
import type { CelestialCardProps } from '../components/celestial_card/types';

interface NodeMapItem {
  nodes: Array<Node<CelestialCardProps>>;
  edges: Edge[];
}

interface NodeMap {
  [groupId: string]: NodeMapItem;
}

// Top level nodes (5 groups)
// Constants for layout calculations
const NODE_WIDTH = 255;
const HORIZONTAL_PADDING = 45; // Space between nodes horizontally

// Helper function to check if any nodes in a group are alarming
const updateAlarmStates = (map: NodeMap): NodeMap => {
  // Create a map of group IDs to their alarm states
  const alarmStates: { [key: string]: boolean } = {};

  // First pass: Check all leaf nodes and immediate groups
  Object.entries(map).forEach(([groupId, group]) => {
    const hasAlarmingNodes = group.nodes.some(
      (node) =>
        node.data?.health?.status && ['recovered', 'breached'].includes(node.data.health?.status)
    );
    alarmStates[groupId] = hasAlarmingNodes;
  });

  // Second pass: Propagate alarms up through the hierarchy
  const propagateAlarms = (groupId: string) => {
    if (groupId.includes('-')) {
      // This is a nested group, update its parent
      const parentId = groupId.split('-').slice(0, -1).join('-');
      if (alarmStates[groupId]) {
        alarmStates[parentId] = true;
      }
    }
    // If this is a top-level group and it's alarming, update root alarm state
    else if (groupId !== 'root' && alarmStates[groupId]) {
      alarmStates.root = true;
    }
  };

  // Propagate alarms from bottom to top
  Object.keys(map)
    .sort((a, b) => b.length - a.length)
    .forEach(propagateAlarms);

  // Update the node map with new alarm states
  const updatedMap: NodeMap = {};
  Object.entries(map).forEach(([groupId, group]) => {
    updatedMap[groupId] = {
      edges: group.edges,
      nodes: group.nodes,
    };
  });

  return updatedMap;
};

// Calculate positions for top level nodes
const topLevelNodes: Array<Node<CelestialCardProps>> = [
  {
    id: 'group-001',
    type: 'celestialNode',
    position: { x: 50, y: 50 },
    data: {
      id: 'group-001',
      keyAttributes: { foo: 'bar1' },
      title: 'Compute Services',
      icon: <Ec2Icon />,
      subtitle: 'AWS Compute Resources',
      isGroup: true,
      isInstrumented: true,
    },
  },
  {
    id: 'group-002',
    type: 'celestialNode',
    position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING), y: 50 },
    data: {
      id: 'group-002',
      title: 'Storage Services',
      keyAttributes: { foo: 'bar2' },
      icon: <S3Icon />,
      subtitle: 'AWS Storage Resources',
      isGroup: true,
      isInstrumented: true,
    },
  },
  {
    id: 'group-003',
    type: 'celestialNode',
    position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING) * 2, y: 50 },
    data: {
      id: 'group-003',
      title: 'Database Services',
      keyAttributes: { foo: 'bar3' },
      icon: <img src={DynamodbIcon} alt="" />,
      subtitle: 'AWS Database Resources',
      isGroup: true,
      isInstrumented: true,
    },
  },
  {
    id: 'group-004',
    type: 'celestialNode',
    position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING) * 3, y: 50 },
    data: {
      id: 'group-004',
      title: 'Network Services',
      keyAttributes: { foo: 'bar4' },
      icon: <img src={ApiGatewayIcon} alt="" />,
      subtitle: 'AWS Network Resources',
      isGroup: true,
      isInstrumented: true,
    },
  },
  {
    id: 'group-005',
    type: 'celestialNode',
    position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING) * 4, y: 50 },
    data: {
      id: 'group-005',
      title: 'Security Services',
      keyAttributes: { foo: 'bar5' },
      icon: <img src={ClientIcon} alt="" />,
      subtitle: 'AWS Security Resources',
      isGroup: true,
      isInstrumented: true,
    },
  },
];

const initialNodeMap: NodeMap = {
  // Root level - no edges needed
  root: {
    nodes: topLevelNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
      },
    })),
    edges: [],
  },

  // Compute Services (group-001) contains subgroups
  'group-001': {
    nodes: [
      {
        id: 'group-001-001',
        type: 'celestialNode',
        position: { x: 50, y: 50 },
        data: {
          id: 'group-001-001',
          title: 'EC2 Instances',
          keyAttributes: { foo: 'bar6' },
          icon: <Ec2Icon />,
          subtitle: 'Virtual Servers',
          isGroup: true,
          isInstrumented: true,
        },
      },
      {
        id: 'group-001-002',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING), y: 50 },
        data: {
          id: 'group-001-002',
          title: 'Lambda Functions',
          keyAttributes: { foo: 'bar7' },
          icon: <img src={LambdaIcon} alt="" />,
          subtitle: 'Serverless Computing',
          isGroup: true,
          isInstrumented: true,
        },
      },
    ],
    edges: [
      {
        id: 'edge-001-001-to-001-002',
        source: 'group-001-001',
        target: 'group-001-002',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
    ],
  },

  // EC2 Instances subgroup
  'group-001-001': {
    nodes: [
      {
        id: 'node-001',
        type: 'celestialNode',
        position: { x: 50, y: 50 },
        data: {
          id: 'node-001',
          title: 'Web Server',
          icon: <Ec2Icon />,
          keyAttributes: { foo: 'bar8' },
          subtitle: 't3.large',
          isGroup: false,
          isInstrumented: true,
          metrics: {
            requests: 15000,
            faults5xx: 23,
            errors4xx: 156,
          },
        },
      },
      {
        id: 'node-002',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING), y: 50 },
        data: {
          id: 'node-002',
          title: 'Application Server',
          icon: <Ec2Icon />,
          keyAttributes: { foo: 'bar9' },
          subtitle: 'm5.xlarge',
          isGroup: false,
          isInstrumented: true,
          health: {
            status: 'breached',
            breached: 4,
            recovered: 0,
            total: 4,
          },
          metrics: {
            requests: 8500,
            faults5xx: 1442,
            errors4xx: 67,
          },
        },
      },
      {
        id: 'node-003',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING) * 2, y: 50 },
        data: {
          id: 'node-003',
          title: 'Database Server',
          icon: <Ec2Icon />,
          keyAttributes: { foo: 'bar10' },
          subtitle: 'r5.2xlarge',
          isGroup: false,
          isInstrumented: true,
          metrics: {
            requests: 12000,
            faults5xx: 5,
            errors4xx: 23,
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-001-to-002',
        source: 'node-001',
        target: 'node-002',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
      {
        id: 'edge-002-to-003',
        source: 'node-002',
        target: 'node-003',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
    ],
  },

  // Lambda Functions subgroup
  'group-001-002': {
    nodes: [
      {
        id: 'node-004',
        type: 'celestialNode',
        position: { x: 50, y: 50 },
        data: {
          id: 'node-004',
          title: 'Auth Function',
          keyAttributes: { foo: 'bar11' },
          icon: <img src={LambdaIcon} alt="" />,
          subtitle: 'User Authentication',
          isGroup: false,
          isInstrumented: true,
          metrics: {
            requests: 12000,
            faults5xx: 15,
            errors4xx: 89,
          },
        },
      },
      {
        id: 'node-005',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING), y: 50 },
        data: {
          id: 'node-005',
          title: 'Data Processing',
          keyAttributes: { foo: 'bar12' },
          icon: <img src={LambdaIcon} alt="" />,
          subtitle: 'ETL Pipeline',
          isGroup: false,
          isInstrumented: true,
          metrics: {
            requests: 8500,
            faults5xx: 34,
            errors4xx: 12,
          },
        },
      },
      {
        id: 'node-006',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING) * 2, y: 50 },
        data: {
          id: 'node-006',
          title: 'Notification',
          icon: <img src={LambdaIcon} alt="" />,
          keyAttributes: { foo: 'bar13' },
          subtitle: 'Push Notifications',
          isGroup: false,
          isInstrumented: true,
          health: {
            status: 'breached',
            breached: 2,
            recovered: 0,
            total: 4,
          },
          metrics: {
            requests: 2500,
            faults5xx: 156,
            errors4xx: 89,
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-004-to-005',
        source: 'node-004',
        target: 'node-005',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
      {
        id: 'edge-005-to-006',
        source: 'node-005',
        target: 'node-006',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
    ],
  },

  // Storage Services (group-002)
  'group-002': {
    nodes: [
      {
        id: 'node-007',
        type: 'celestialNode',
        position: { x: 50, y: 50 },
        data: {
          id: 'node-007',
          keyAttributes: { foo: 'bar14' },
          title: 'User Data Bucket',
          icon: <S3Icon />,
          subtitle: 'S3 Bucket',
          isGroup: false,
          isInstrumented: true,
          metrics: {
            requests: 25000,
            faults5xx: 0,
            errors4xx: 34,
          },
        },
      },
      {
        id: 'node-008',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING), y: 50 },
        data: {
          id: 'node-008',
          title: 'Backup Bucket',
          icon: <S3Icon />,
          keyAttributes: { foo: 'bar15' },
          subtitle: 'S3 Bucket',
          isGroup: false,
          isInstrumented: true,
          metrics: {
            requests: 5000,
            faults5xx: 0,
            errors4xx: 12,
          },
        },
      },
      {
        id: 'node-009',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING) * 2, y: 50 },
        data: {
          id: 'node-009',
          title: 'Static Assets',
          icon: <S3Icon />,
          subtitle: 'S3 Bucket',
          isGroup: false,
          keyAttributes: { foo: 'bar16' },
          isInstrumented: true,
          metrics: {
            requests: 45000,
            faults5xx: 0,
            errors4xx: 234,
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-007-to-008',
        source: 'node-007',
        target: 'node-008',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
      {
        id: 'edge-008-to-009',
        source: 'node-008',
        target: 'node-009',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
    ],
  },

  // Database Services groups
  'group-003': {
    nodes: [
      {
        id: 'group-003-001',
        type: 'celestialNode',
        position: { x: 50, y: 50 },
        data: {
          id: 'group-003-001',
          keyAttributes: { foo: 'bar17' },
          title: 'RDS Instances',
          icon: <img src={RdsIcon} alt="" />,
          subtitle: 'Relational Databases',
          isGroup: true,
          isInstrumented: true,
        },
      },
      {
        id: 'group-003-002',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING), y: 50 },
        data: {
          id: 'group-003-002',
          title: 'DynamoDB Tables',
          icon: <img src={DynamodbIcon} alt="" />,
          keyAttributes: { foo: 'bar18' },
          subtitle: 'NoSQL Databases',
          isGroup: true,
          isInstrumented: true,
        },
      },
    ],
    edges: [
      {
        id: 'edge-003-001-to-003-002',
        source: 'group-003-001',
        target: 'group-003-002',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
    ],
  },

  // RDS Instances subgroup
  'group-003-001': {
    nodes: [
      {
        id: 'node-010',
        type: 'celestialNode',
        position: { x: 50, y: 50 },
        data: {
          id: 'node-010',
          title: 'User Database',
          icon: <img src={RdsIcon} alt="" />,
          keyAttributes: { foo: 'bar19' },
          subtitle: 'db.r5.large',
          isGroup: false,
          isInstrumented: true,
          metrics: {
            requests: 18000,
            faults5xx: 12,
            errors4xx: 45,
          },
        },
      },
      {
        id: 'node-011',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING), y: 50 },
        data: {
          id: 'node-011',
          title: 'Analytics DB',
          icon: <img src={RdsIcon} alt="" />,
          keyAttributes: { foo: 'bar20' },
          subtitle: 'db.r5.2xlarge',
          isGroup: false,
          isInstrumented: true,
          health: {
            status: 'breached',
            breached: 4,
            recovered: 0,
            total: 4,
          },
          metrics: {
            requests: 2200,
            faults5xx: 67,
            errors4xx: 156,
          },
        },
      },
      {
        id: 'node-012',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING) * 2, y: 50 },
        data: {
          id: 'node-012',
          title: 'Reporting DB',
          icon: <img src={RdsIcon} alt="" />,
          keyAttributes: { foo: 'bar21' },
          subtitle: 'db.r5.large',
          isGroup: false,
          isInstrumented: true,
          metrics: {
            requests: 8500,
            faults5xx: 0,
            errors4xx: 23,
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-010-to-011',
        source: 'node-010',
        target: 'node-011',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
      {
        id: 'edge-011-to-012',
        source: 'node-011',
        target: 'node-012',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
    ],
  },

  // DynamoDB Tables subgroup
  'group-003-002': {
    nodes: [
      {
        id: 'node-019',
        type: 'celestialNode',
        position: { x: 50, y: 50 },
        data: {
          id: 'node-019',
          title: 'Users Table',
          icon: <img src={DynamodbIcon} alt="" />,
          keyAttributes: { foo: 'bar22' },
          subtitle: 'User Profiles',
          isGroup: false,
          isInstrumented: true,
          metrics: {
            requests: 28000,
            faults5xx: 12,
            errors4xx: 89,
          },
        },
      },
      {
        id: 'node-020',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING), y: 50 },
        data: {
          id: 'node-020',
          title: 'Sessions Table',
          icon: <img src={DynamodbIcon} alt="" />,
          keyAttributes: { foo: 'bar23' },
          subtitle: 'User Sessions',
          isGroup: false,
          isInstrumented: true,
          health: {
            status: 'breached',
            breached: 4,
            recovered: 0,
            total: 4,
          },
          metrics: {
            requests: 4500,
            faults5xx: 234,
            errors4xx: 567,
          },
        },
      },
      {
        id: 'node-021',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING) * 2, y: 50 },
        data: {
          id: 'node-021',
          title: 'Analytics Table',
          icon: <img src={DynamodbIcon} alt="" />,
          keyAttributes: { foo: 'bar24' },
          subtitle: 'User Analytics',
          isGroup: false,
          isInstrumented: true,
          metrics: {
            requests: 15000,
            faults5xx: 45,
            errors4xx: 123,
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-019-to-020',
        source: 'node-019',
        target: 'node-020',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
      {
        id: 'edge-020-to-021',
        source: 'node-020',
        target: 'node-021',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
    ],
  },

  // Network Services
  'group-004': {
    nodes: [
      {
        id: 'node-013',
        type: 'celestialNode',
        position: { x: 50, y: 50 },
        data: {
          id: 'node-013',
          title: 'Main API Gateway',
          keyAttributes: { foo: 'bar25' },
          icon: <img src={ApiGatewayIcon} alt="" />,
          subtitle: 'REST API',
          isGroup: false,
          isInstrumented: true,
          metrics: {
            requests: 35000,
            faults5xx: 45,
            errors4xx: 234,
          },
        },
      },
      {
        id: 'node-014',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING), y: 50 },
        data: {
          id: 'node-014',
          title: 'Load Balancer',
          icon: <img src={LoadBalancerIcon} alt="" />,
          keyAttributes: { foo: 'bar26' },
          subtitle: 'Application LB',
          isGroup: false,
          isInstrumented: true,
          metrics: {
            requests: 28000,
            faults5xx: 23,
            errors4xx: 156,
          },
        },
      },
      {
        id: 'node-015',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING) * 2, y: 50 },
        data: {
          id: 'node-015',
          title: 'VPC Gateway',
          keyAttributes: { foo: 'bar27' },
          icon: <img src={ApiGatewayIcon} alt="" />,
          subtitle: 'VPC Endpoint',
          isGroup: false,
          isInstrumented: true,
          metrics: {
            requests: 15000,
            faults5xx: 12,
            errors4xx: 78,
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-013-to-014',
        source: 'node-013',
        target: 'node-014',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
      {
        id: 'edge-014-to-015',
        source: 'node-014',
        target: 'node-015',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
    ],
  },

  // Security Services
  'group-005': {
    nodes: [
      {
        id: 'node-016',
        type: 'celestialNode',
        position: { x: 50, y: 50 },
        data: {
          id: 'node-016',
          title: 'WAF',
          icon: <img src={ClientIcon} alt="" />,
          subtitle: 'Web Application Firewall',
          keyAttributes: { foo: 'bar28' },
          isGroup: false,
          isInstrumented: true,
          metrics: {
            requests: 42000,
            faults5xx: 0,
            errors4xx: 1256,
          },
        },
      },
      {
        id: 'node-017',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING), y: 50 },
        data: {
          id: 'node-017',
          title: 'Shield',
          icon: <img src={ClientIcon} alt="" />,
          keyAttributes: { foo: 'bar29' },
          subtitle: 'DDoS Protection',
          isGroup: false,
          isInstrumented: true,
          health: {
            status: 'breached',
            breached: 4,
            recovered: 0,
            total: 4,
          },
          metrics: {
            requests: 5500,
            faults5xx: 234,
            errors4xx: 2345,
          },
        },
      },
      {
        id: 'node-018',
        type: 'celestialNode',
        position: { x: 50 + (NODE_WIDTH + HORIZONTAL_PADDING) * 2, y: 50 },
        data: {
          id: 'node-018',
          title: 'GuardDuty',
          icon: <img src={ClientIcon} alt="" />,
          keyAttributes: { foo: 'bar30' },
          subtitle: 'Threat Detection',
          isGroup: false,
          isInstrumented: true,
          metrics: {
            requests: 12000,
            faults5xx: 0,
            errors4xx: 45,
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-016-to-017',
        source: 'node-016',
        target: 'node-017',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
      {
        id: 'edge-017-to-018',
        source: 'node-017',
        target: 'node-018',
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        type: 'smoothstep',
      },
    ],
  },
};

const nodeMap = updateAlarmStates(initialNodeMap);

export { nodeMap };
export type { NodeMap };
