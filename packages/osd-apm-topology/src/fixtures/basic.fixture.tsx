/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { Node } from '@xyflow/react';
import type { Metrics } from '../shared/types/common.types';
import { getIcon } from '../shared/utils/icons.utils';
import type { CelestialCardProps } from '../components/CelestialCard/types';
import { DEFAULT_GRID_CONFIG, calculatePosition } from '../shared/utils/celestial-node.utils';

interface GridConfig {
  nodesPerRow: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  startX: number;
  startY: number;
}

const METRICS_THRESHOLDS = {
  HIGH_ERROR_PROBABILITY: 75, // 25% chance of high errors
  MIN_HIGH_ERROR_RATE: 25,
  MAX_HIGH_ERROR_RATE: 40,
  MAX_LOW_ERROR_RATE: 5,
  HIGH_4XX_RATE: 0.4,
  HIGH_THROTTLE_RATE: 0.3,
  LOW_4XX_RATE: 0.3,
  LOW_THROTTLE_RATE: 0.2,
} as const;

type ServiceType =
  | 'AWS::Application'
  | 'AWS::LoadBalancer'
  | 'AWS::Lambda'
  | 'AWS::EC2'
  | 'AWS::ECS'
  | 'AWS::EKS'
  | 'AWS::Kubernetes';

// Add a type for application names
type HotelApplicationName =
  | 'Reservation System'
  | 'Payment Processing'
  | 'Guest Services'
  | 'Room Management'
  | 'Loyalty Program'
  | 'Booking Engine'
  | 'Check-in Service'
  | 'Housekeeping System';

const APPLICATION_NAMES: HotelApplicationName[] = [
  'Reservation System',
  'Payment Processing',
  'Guest Services',
  'Room Management',
  'Loyalty Program',
  'Booking Engine',
  'Check-in Service',
  'Housekeeping System',
];

const INFRASTRUCTURE_NAMES: Record<ServiceType, string[]> = {
  'AWS::Application': APPLICATION_NAMES,
  'AWS::LoadBalancer': [
    'Hotel API Gateway',
    'Booking Service LB',
    'Payment Gateway LB',
    'Guest Services LB',
    'Admin Portal LB',
  ],
  'AWS::Lambda': [
    'Booking Processor',
    'Payment Handler',
    'Email Notifier',
    'Loyalty Points Calculator',
    'Room Status Updater',
    'Price Calculator',
  ],
  'AWS::EC2': [
    'Booking Database Host',
    'Cache Server',
    'Admin Dashboard Server',
    'Monitoring Instance',
    'Report Generator',
  ],
  'AWS::ECS': [
    'Booking Service Cluster',
    'Payment Container Group',
    'User Auth Service',
    'Notification Service',
    'Analytics Service',
  ],
  'AWS::EKS': [
    'Main Booking Cluster',
    'Payment Processing Cluster',
    'Guest Data Cluster',
    'Analytics Cluster',
    'Integration Services',
  ],
  'AWS::Kubernetes': [
    'Core Services Cluster',
    'Data Processing Cluster',
    'API Services Cluster',
    'Backend Services Pod',
    'Integration Platform',
  ],
};

const getRandomName = (serviceType: ServiceType): string => {
  const names = INFRASTRUCTURE_NAMES[serviceType];
  return names[getRandomNumber(0, names.length - 1)];
};

const getRandomNumber = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const generateMetrics = (requests: number, isHighError: boolean): Metrics => {
  const errorRate = isHighError
    ? getRandomNumber(
        METRICS_THRESHOLDS.MIN_HIGH_ERROR_RATE,
        METRICS_THRESHOLDS.MAX_HIGH_ERROR_RATE
      )
    : getRandomNumber(0, METRICS_THRESHOLDS.MAX_LOW_ERROR_RATE);

  const faults5xx = Math.floor(requests * (errorRate / 100));
  const maxErrorRate = isHighError
    ? METRICS_THRESHOLDS.HIGH_4XX_RATE
    : METRICS_THRESHOLDS.LOW_4XX_RATE;

  return {
    requests,
    faults5xx,
    errors4xx: getRandomNumber(0, Math.floor(requests * maxErrorRate)),
  };
};

const createNodeData = (index: number, isGroup: boolean): CelestialCardProps => {
  let metrics;
  let breached = 0;
  let recovered = 0;

  if (!isGroup) {
    const requests = getRandomNumber(1000, 10000);
    const isHighError = getRandomNumber(1, 100) > METRICS_THRESHOLDS.HIGH_ERROR_PROBABILITY;
    metrics = generateMetrics(requests, isHighError);
    breached = isHighError ? getRandomNumber(1, 10) : 0;
    recovered = !isHighError ? getRandomNumber(0, 5) : 0;
  }

  const icon = getIcon('AWS::EC2');
  const title = getRandomName('AWS::EC2');

  return {
    id: `${index}`,
    title,
    subtitle: 'AWS::EC2',
    icon,
    isGroup,
    keyAttributes: { foo: `bar${index}` },
    isInstrumented: getRandomNumber(1, 10) > 3,
    health: {
      breached,
      recovered,
      total: breached + recovered + getRandomNumber(0, 3),
      status: breached ? 'breached' : recovered ? 'recovered' : 'ok',
    },
    metrics,
  };
};

export const createInitialNodes = (
  count: number,
  config: Partial<GridConfig> = {}
): Array<Node<CelestialCardProps>> => {
  const finalConfig = { ...DEFAULT_GRID_CONFIG, ...config };

  return Array.from({ length: count }, (_, index) => {
    const isGroup = getRandomNumber(1, 10) > 5;

    return {
      id: (index + 1).toString(),
      type: 'celestialNode',
      position: calculatePosition(index, finalConfig),
      data: createNodeData(index, isGroup),
    };
  });
};
