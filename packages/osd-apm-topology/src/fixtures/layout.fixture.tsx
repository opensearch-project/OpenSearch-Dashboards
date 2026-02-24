/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { Edge, MarkerType, Node } from '@xyflow/react';
import {
  ApiGatewayIcon,
  ClientIcon,
  DynamodbIcon,
  Ec2Icon,
  LambdaIcon,
  LoadBalancerIcon,
  RdsIcon,
  S3Icon,
  SyntheticsIcon,
} from '../shared/resources/services';
import type { CelestialCardProps } from '../components/CelestialCard';

interface NodeMapItem {
  nodes: Array<Node<CelestialCardProps>>;
  edges: Edge[];
}

interface NodeMap {
  [groupId: string]: NodeMapItem;
}

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
    id: 'group-frontend',
    type: 'celestialNode',
    position: { x: 0, y: 0 },
    data: {
      id: 'group-frontend',
      title: 'Frontend Services',
      subtitle: 'User Interface Layer',
      keyAttributes: { foo: 'bar1' },
      isGroup: true,
      icon: <img src={ClientIcon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 2450,
        faults5xx: 0,
        errors4xx: 12,
      },
    },
  },
  {
    id: 'group-api',
    type: 'celestialNode',
    position: { x: NODE_WIDTH + HORIZONTAL_PADDING, y: 0 },
    data: {
      id: 'group-api',
      title: 'API Layer',
      keyAttributes: { foo: 'bar2' },
      subtitle: 'Service Gateway',
      isGroup: true,
      icon: <img src={ApiGatewayIcon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 1850,
        faults5xx: 5,
        errors4xx: 23,
      },
    },
  },
  {
    id: 'group-compute',
    type: 'celestialNode',
    position: { x: (NODE_WIDTH + HORIZONTAL_PADDING) * 2, y: 0 },
    data: {
      id: 'group-compute',
      title: 'Compute Layer',
      keyAttributes: { foo: 'bar3' },
      subtitle: 'Processing Services',
      isGroup: true,
      icon: <img src={Ec2Icon} alt="" />,
      isInstrumented: true,
      health: {
        status: 'breached',
        breached: 4,
        recovered: 0,
        total: 4,
      },
      metrics: {
        requests: 1200,
        faults5xx: 15,
        errors4xx: 8,
      },
    },
  },
  {
    id: 'group-data',
    type: 'celestialNode',
    position: { x: (NODE_WIDTH + HORIZONTAL_PADDING) * 3, y: 0 },
    data: {
      id: 'group-data',
      title: 'Data Layer',
      subtitle: 'Storage Services',
      keyAttributes: { foo: 'bar4' },
      isGroup: true,
      icon: <img src={DynamodbIcon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 3200,
        faults5xx: 0,
        errors4xx: 5,
      },
    },
  },
  {
    id: 'group-analytics',
    type: 'celestialNode',
    position: { x: (NODE_WIDTH + HORIZONTAL_PADDING) * 4, y: 0 },
    data: {
      id: 'group-analytics',
      title: 'Analytics Layer',
      subtitle: 'Data Processing',
      keyAttributes: { foo: 'bar5' },
      isGroup: true,
      icon: <img src={LambdaIcon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 850,
        faults5xx: 2,
        errors4xx: 3,
      },
    },
  },
];

// Top level edges connecting the groups
const topLevelEdges: Edge[] = [
  {
    id: 'edge-frontend-api',
    source: 'group-frontend',
    target: 'group-api',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
  {
    id: 'edge-api-compute',
    source: 'group-api',
    target: 'group-compute',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
  {
    id: 'edge-compute-data',
    source: 'group-compute',
    target: 'group-data',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
  {
    id: 'edge-compute-analytics',
    source: 'group-compute',
    target: 'group-analytics',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
  {
    id: 'edge-data-analytics',
    source: 'group-data',
    target: 'group-analytics',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
];

// Frontend Group Contents
const frontendNodes: Array<Node<CelestialCardProps>> = [
  {
    id: 'web-app',
    type: 'celestialNode',
    position: { x: 0, y: 0 },
    data: {
      id: 'web-app',
      title: 'Web Application',
      subtitle: 'React SPA',
      keyAttributes: { foo: 'bar6' },
      icon: <img src={ClientIcon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 1500,
        faults5xx: 0,
        errors4xx: 8,
      },
    },
  },
  {
    id: 'mobile-app',
    type: 'celestialNode',
    position: { x: NODE_WIDTH + HORIZONTAL_PADDING, y: 0 },
    data: {
      id: 'mobile-app',
      title: 'Mobile Application',
      subtitle: 'React Native',
      keyAttributes: { foo: 'bar7' },
      icon: <img src={ClientIcon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 950,
        faults5xx: 0,
        errors4xx: 4,
      },
    },
  },
  {
    id: 'cdn',
    type: 'celestialNode',
    position: { x: (NODE_WIDTH + HORIZONTAL_PADDING) * 2, y: 0 },
    data: {
      id: 'cdn',
      title: 'Content Delivery',
      subtitle: 'CloudFront',
      icon: <img src={S3Icon} alt="" />,
      keyAttributes: { foo: 'bar8' },
      isInstrumented: true,
      metrics: {
        requests: 3200,
        faults5xx: 0,
        errors4xx: 15,
      },
    },
  },
];

const frontendEdges: Edge[] = [
  {
    id: 'edge-web-cdn',
    source: 'web-app',
    target: 'cdn',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
  {
    id: 'edge-mobile-cdn',
    source: 'mobile-app',
    target: 'cdn',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
];

// API Layer Contents
const apiNodes: Array<Node<CelestialCardProps>> = [
  {
    id: 'api-gateway',
    type: 'celestialNode',
    position: { x: 0, y: 0 },
    data: {
      id: 'api-gateway',
      title: 'API Gateway',
      subtitle: 'REST API',
      keyAttributes: { foo: 'bar9' },
      icon: <img src={ApiGatewayIcon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 1850,
        faults5xx: 5,
        errors4xx: 23,
      },
    },
  },
  {
    id: 'load-balancer',
    type: 'celestialNode',
    position: { x: NODE_WIDTH + HORIZONTAL_PADDING, y: 0 },
    data: {
      id: 'load-balancer',
      title: 'Load Balancer',
      subtitle: 'Application LB',
      keyAttributes: { foo: 'bar10' },
      icon: <img src={LoadBalancerIcon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 1850,
        faults5xx: 0,
        errors4xx: 0,
      },
    },
  },
  {
    id: 'auth-service',
    type: 'celestialNode',
    position: { x: (NODE_WIDTH + HORIZONTAL_PADDING) * 2, y: 0 },
    data: {
      id: 'auth-service',
      title: 'Auth Service',
      subtitle: 'Cognito',
      icon: <img src={LambdaIcon} alt="" />,
      isInstrumented: true,
      keyAttributes: { foo: 'bar11' },
      metrics: {
        requests: 1200,
        faults5xx: 0,
        errors4xx: 18,
      },
    },
  },
];

const apiEdges: Edge[] = [
  {
    id: 'edge-api-lb',
    source: 'api-gateway',
    target: 'load-balancer',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
  {
    id: 'edge-api-auth',
    source: 'api-gateway',
    target: 'auth-service',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
];

// Compute Layer Contents with nested group
const computeNodes: Array<Node<CelestialCardProps>> = [
  {
    id: 'group-compute-microservices',
    type: 'celestialNode',
    position: { x: 0, y: 0 },
    data: {
      id: 'group-compute-microservices',
      title: 'Microservices',
      keyAttributes: { foo: 'bar12' },
      subtitle: 'Service Cluster',
      isGroup: true,
      icon: <img src={Ec2Icon} alt="" />,
      isInstrumented: true,
      health: {
        status: 'breached',
        breached: 4,
        recovered: 0,
        total: 4,
      },
      metrics: {
        requests: 850,
        faults5xx: 15,
        errors4xx: 5,
      },
    },
  },
  {
    id: 'batch-processor',
    type: 'celestialNode',
    position: { x: NODE_WIDTH + HORIZONTAL_PADDING, y: 0 },
    data: {
      id: 'batch-processor',
      title: 'Batch Processor',
      keyAttributes: { foo: 'bar13' },
      subtitle: 'ECS Cluster',
      icon: <img src={Ec2Icon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 350,
        faults5xx: 0,
        errors4xx: 3,
      },
    },
  },
];

const computeEdges: Edge[] = [
  {
    id: 'edge-microservices-batch',
    source: 'group-compute-microservices',
    target: 'batch-processor',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
];

// Microservices Group Contents (nested under compute)
const microservicesNodes: Array<Node<CelestialCardProps>> = [
  {
    id: 'user-service',
    type: 'celestialNode',
    position: { x: 0, y: 0 },
    data: {
      id: 'user-service',
      title: 'User Service',
      keyAttributes: { foo: 'bar14' },
      subtitle: 'ECS Service',
      icon: <img src={Ec2Icon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 320,
        faults5xx: 0,
        errors4xx: 2,
      },
    },
  },
  {
    id: 'order-service',
    type: 'celestialNode',
    position: { x: NODE_WIDTH + HORIZONTAL_PADDING, y: 0 },
    data: {
      id: 'order-service',
      title: 'Order Service',
      keyAttributes: { foo: 'bar15' },
      subtitle: 'ECS Service',
      icon: <img src={Ec2Icon} alt="" />,
      isInstrumented: true,
      health: {
        status: 'breached',
        breached: 4,
        recovered: 0,
        total: 4,
      },
      metrics: {
        requests: 280,
        faults5xx: 15,
        errors4xx: 3,
      },
    },
  },
  {
    id: 'payment-service',
    type: 'celestialNode',
    position: { x: 0, y: 100 },
    data: {
      id: 'payment-service',
      title: 'Payment Service',
      keyAttributes: { foo: 'bar16' },
      subtitle: 'ECS Service',
      icon: <img src={Ec2Icon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 250,
        faults5xx: 0,
        errors4xx: 0,
      },
    },
  },
];

const microservicesEdges: Edge[] = [
  {
    id: 'edge-user-order',
    source: 'user-service',
    target: 'order-service',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
  {
    id: 'edge-order-payment',
    source: 'order-service',
    target: 'payment-service',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
  {
    id: 'edge-user-payment',
    source: 'user-service',
    target: 'payment-service',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
];

// Data Layer Contents with nested group
const dataNodes: Array<Node<CelestialCardProps>> = [
  {
    id: 'group-data-databases',
    type: 'celestialNode',
    position: { x: 0, y: 0 },
    data: {
      id: 'group-data-databases',
      title: 'Databases',
      keyAttributes: { foo: 'bar17' },
      subtitle: 'Persistent Storage',
      isGroup: true,
      icon: <img src={RdsIcon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 2200,
        faults5xx: 0,
        errors4xx: 3,
      },
    },
  },
  {
    id: 'object-storage',
    type: 'celestialNode',
    position: { x: NODE_WIDTH + HORIZONTAL_PADDING, y: 0 },
    data: {
      id: 'object-storage',
      title: 'Object Storage',
      keyAttributes: { foo: 'bar18' },
      subtitle: 'S3 Buckets',
      icon: <img src={S3Icon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 1000,
        faults5xx: 0,
        errors4xx: 2,
      },
    },
  },
];

const dataEdges: Edge[] = [
  {
    id: 'edge-databases-storage',
    source: 'group-data-databases',
    target: 'object-storage',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
];

// Databases Group Contents (nested under data)
const databasesNodes: Array<Node<CelestialCardProps>> = [
  {
    id: 'relational-db',
    type: 'celestialNode',
    position: { x: 0, y: 0 },
    data: {
      id: 'relational-db',
      title: 'Relational DB',
      keyAttributes: { foo: 'bar19' },
      subtitle: 'Aurora PostgreSQL',
      icon: <img src={RdsIcon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 1200,
        faults5xx: 0,
        errors4xx: 1,
      },
    },
  },
  {
    id: 'nosql-db',
    type: 'celestialNode',
    position: { x: NODE_WIDTH + HORIZONTAL_PADDING, y: 0 },
    data: {
      id: 'nosql-db',
      title: 'NoSQL Database',
      subtitle: 'DynamoDB',
      keyAttributes: { foo: 'bar20' },
      icon: <img src={DynamodbIcon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 1000,
        faults5xx: 0,
        errors4xx: 2,
      },
      aggregatedNodeId: 'stacked-database',
    },
  },
  {
    id: 'cache',
    type: 'celestialNode',
    position: { x: 0, y: 100 },
    data: {
      id: 'cache',
      title: 'Cache Layer',
      keyAttributes: { foo: 'bar21' },
      subtitle: 'ElastiCache',
      icon: <img src={DynamodbIcon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 3500,
        faults5xx: 0,
        errors4xx: 0,
      },
      aggregatedNodeId: 'stacked-database',
    },
  },
];

const databasesEdges: Edge[] = [
  {
    id: 'edge-relational-nosql',
    source: 'relational-db',
    target: 'nosql-db',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
  {
    id: 'edge-relational-cache',
    source: 'relational-db',
    target: 'cache',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
  {
    id: 'edge-nosql-cache',
    source: 'nosql-db',
    target: 'cache',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
];

// Analytics Layer Contents
const analyticsNodes: Array<Node<CelestialCardProps>> = [
  {
    id: 'data-lake',
    type: 'celestialNode',
    position: { x: 0, y: 0 },
    data: {
      id: 'data-lake',
      title: 'Data Lake',
      keyAttributes: { foo: 'bar22' },
      subtitle: 'S3 + Athena',
      icon: <img src={S3Icon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 450,
        faults5xx: 0,
        errors4xx: 1,
      },
    },
  },
  {
    id: 'etl-pipeline',
    type: 'celestialNode',
    position: { x: NODE_WIDTH + HORIZONTAL_PADDING, y: 0 },
    data: {
      id: 'etl-pipeline',
      title: 'ETL Pipeline',
      subtitle: 'Glue',
      keyAttributes: { foo: 'bar23' },
      icon: <img src={LambdaIcon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 200,
        faults5xx: 2,
        errors4xx: 1,
      },
    },
  },
  {
    id: 'ml-processing',
    type: 'celestialNode',
    position: { x: (NODE_WIDTH + HORIZONTAL_PADDING) * 2, y: 0 },
    data: {
      id: 'ml-processing',
      title: 'ML Processing',
      subtitle: 'SageMaker',
      keyAttributes: { foo: 'bar24' },
      icon: <img src={Ec2Icon} alt="" />,
      isInstrumented: true,
      metrics: {
        requests: 200,
        faults5xx: 0,
        errors4xx: 1,
      },
    },
  },
];

const analyticsEdges: Edge[] = [
  {
    id: 'edge-lake-etl',
    source: 'data-lake',
    target: 'etl-pipeline',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
  {
    id: 'edge-etl-ml',
    source: 'etl-pipeline',
    target: 'ml-processing',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
];

// Canary Nodes Array
const canaryNodes: Array<Node<CelestialCardProps>> = Array.from({ length: 10 }, (_, index) => ({
  id: `canary-${index + 1}`,
  type: 'celestialNode',
  position: {
    x: 0,
    y: 0,
  },
  data: {
    id: `canary-${index + 1}`,
    title: `Canary-${index + 1}`,
    subtitle: 'Canary Deployment',
    keyAttributes: {
      environment: 'canary',
      version: `v1.${index + 1}.0`,
      deployment: 'canary',
    },
    icon: <img src={SyntheticsIcon} alt="" />,
    isInstrumented: true,
    metrics: {
      requests: Math.floor(Math.random() * 1000) + 100,
      faults5xx: index % 4 === 0 ? Math.floor(Math.random() * 5) : 0,
      errors4xx: Math.floor(Math.random() * 10),
    },
    aggregatedNodeId: 'stacked-canary',
  },
}));

// Canary Edges Array - connecting each canary node to order-service and payment-service
export const canaryEdges: Edge[] = canaryNodes.slice(0, 10).flatMap((canaryNode) => [
  // Edge to order-service
  {
    id: `edge-${canaryNode.id}-order-service`,
    source: canaryNode.id,
    target: 'order-service',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
]);

const stackedNodes: Array<Node<CelestialCardProps>> = [
  ...canaryNodes,
  ...microservicesNodes.slice(1, 3),
  ...databasesNodes.slice(1, 3),
];

const stackedEdges: Edge[] = [
  ...canaryEdges,
  {
    id: 'edge-order-nosql',
    source: microservicesNodes[1].data.id,
    target: databasesNodes[1].data.id,
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
  {
    id: 'edge-payment-cache',
    source: microservicesNodes[2].data.id,
    target: databasesNodes[2].data.id,
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
  // Edges from stacked-canary to services
  {
    id: 'edge-stacked-canary-order',
    source: 'stacked-canary',
    target: 'order-service',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
  // Edges from services to stacked-db
  {
    id: 'edge-order-stacked-db',
    source: 'order-service',
    target: 'stacked-db',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
  {
    id: 'edge-payment-stacked-db',
    source: 'payment-service',
    target: 'stacked-db',
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 2,
    },
  },
];

// Create the complete node map
const mapWithLayout: NodeMap = {
  root: {
    nodes: topLevelNodes,
    edges: topLevelEdges,
  },
  'group-frontend': {
    nodes: frontendNodes,
    edges: frontendEdges,
  },
  'group-api': {
    nodes: apiNodes,
    edges: apiEdges,
  },
  'group-compute': {
    nodes: computeNodes,
    edges: computeEdges,
  },
  'group-compute-microservices': {
    nodes: microservicesNodes,
    edges: microservicesEdges,
  },
  'group-data': {
    nodes: dataNodes,
    edges: dataEdges,
  },
  'group-data-databases': {
    nodes: databasesNodes,
    edges: databasesEdges,
  },
  'group-analytics': {
    nodes: analyticsNodes,
    edges: analyticsEdges,
  },
  stacked: {
    nodes: stackedNodes,
    edges: stackedEdges,
  },
};

// Update alarm states throughout the hierarchy
export const layoutMap = updateAlarmStates(mapWithLayout);
