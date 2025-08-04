/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { ServiceMap } from './service_map';
import { defaultColors } from '../utils/shared_const';

export default {
  component: ServiceMap,
  title:
    'src/plugins/explore/public/application/pages/traces/trace_details/public/services/service_map',
  parameters: {
    docs: {
      description: {
        component:
          'A component that visualizes service relationships in a trace using a graph layout.',
      },
    },
  },
} as ComponentMeta<typeof ServiceMap>;

const Template: ComponentStory<typeof ServiceMap> = (args) => <ServiceMap {...args} />;

// Mock span data for the stories
const createMockSpans = (services: string[], relationships: Array<[string, string]>) => {
  const spans: any[] = [];
  let spanId = 1;

  // Create root span
  if (services.length > 0) {
    spans.push({
      spanId: `span-${spanId++}`,
      parentSpanId: '',
      serviceName: services[0],
      durationInNanos: 1000000000, // 1s
    });
  }

  // Create spans for relationships
  relationships.forEach(([parent, child]) => {
    const parentSpanId = `span-${spanId++}`;
    const childSpanId = `span-${spanId++}`;

    // Parent span
    spans.push({
      spanId: parentSpanId,
      parentSpanId: spans[0].spanId, // Connect to root
      serviceName: parent,
      durationInNanos: 800000000, // 800ms
    });

    // Child span
    spans.push({
      spanId: childSpanId,
      parentSpanId,
      serviceName: child,
      durationInNanos: 500000000, // 500ms
    });
  });

  return spans;
};

// Create spans with error status
const addErrorSpans = (spans: any[], errorServices: string[]) => {
  return spans.map((span) => {
    if (errorServices.includes(span.serviceName)) {
      return {
        ...span,
        status: {
          code: 2,
          message: 'Error occurred',
        },
      };
    }
    return span;
  });
};

// Mock color map using shared default colors
const colorMap = {
  frontend: defaultColors[0],
  'api-gateway': defaultColors[1],
  'auth-service': defaultColors[2],
  'user-service': defaultColors[3],
  'product-service': defaultColors[4],
  'cart-service': defaultColors[5],
  'payment-service': defaultColors[6],
  'notification-service': defaultColors[7],
  'inventory-service': defaultColors[8],
  'shipping-service': defaultColors[9],
};

// Empty state
export const Empty = Template.bind({});
Empty.args = {
  hits: [],
  colorMap,
};

// Basic service map with a few services
export const Basic = Template.bind({});
Basic.args = {
  hits: createMockSpans(
    ['frontend', 'api-gateway', 'auth-service', 'user-service'],
    [
      ['frontend', 'api-gateway'],
      ['api-gateway', 'auth-service'],
      ['api-gateway', 'user-service'],
    ]
  ),
  colorMap,
};

// Complex service map with more services and relationships
export const Complex = Template.bind({});
Complex.args = {
  hits: createMockSpans(
    [
      'frontend',
      'api-gateway',
      'auth-service',
      'user-service',
      'product-service',
      'cart-service',
      'payment-service',
      'notification-service',
    ],
    [
      ['frontend', 'api-gateway'],
      ['api-gateway', 'auth-service'],
      ['api-gateway', 'user-service'],
      ['api-gateway', 'product-service'],
      ['api-gateway', 'cart-service'],
      ['cart-service', 'product-service'],
      ['cart-service', 'payment-service'],
      ['payment-service', 'notification-service'],
      ['user-service', 'notification-service'],
    ]
  ),
  colorMap,
};

// Service map with errors
export const WithErrors = Template.bind({});
WithErrors.args = {
  hits: addErrorSpans(
    createMockSpans(
      [
        'frontend',
        'api-gateway',
        'auth-service',
        'user-service',
        'product-service',
        'cart-service',
      ],
      [
        ['frontend', 'api-gateway'],
        ['api-gateway', 'auth-service'],
        ['api-gateway', 'user-service'],
        ['api-gateway', 'product-service'],
        ['api-gateway', 'cart-service'],
      ]
    ),
    ['auth-service', 'cart-service']
  ),
  colorMap,
};

// Service map with varying latencies
export const VaryingLatencies = Template.bind({});
const varyingLatencySpans = createMockSpans(
  ['frontend', 'api-gateway', 'auth-service', 'user-service', 'product-service'],
  [
    ['frontend', 'api-gateway'],
    ['api-gateway', 'auth-service'],
    ['api-gateway', 'user-service'],
    ['api-gateway', 'product-service'],
  ]
);

// Modify durations to show varying latencies
varyingLatencySpans.forEach((span) => {
  if (span.serviceName === 'auth-service') {
    span.durationInNanos = 2500000000;
  } else if (span.serviceName === 'user-service') {
    span.durationInNanos = 1200000000;
  } else if (span.serviceName === 'product-service') {
    span.durationInNanos = 300000000;
  }
});

VaryingLatencies.args = {
  hits: varyingLatencySpans,
  colorMap,
};

// Service map with high request rates
export const HighRequestRate = Template.bind({});
// Create a copy of the complex spans and ensure it's an array
const complexSpans = Complex.args.hits || [];
const highRequestRateSpans = [...complexSpans];

// Add more spans for specific services to increase their request rate
if (highRequestRateSpans.length > 0) {
  const rootSpanId = highRequestRateSpans[0].spanId;

  for (let i = 0; i < 20; i++) {
    highRequestRateSpans.push({
      spanId: `extra-span-${i}`,
      parentSpanId: rootSpanId,
      serviceName: 'product-service',
      durationInNanos: 200000000 + Math.random() * 300000000, // 200-500ms
    });

    highRequestRateSpans.push({
      spanId: `extra-span-${i + 100}`,
      parentSpanId: rootSpanId,
      serviceName: 'cart-service',
      durationInNanos: 150000000 + Math.random() * 200000000, // 150-350ms
    });
  }
}

HighRequestRate.args = {
  hits: highRequestRateSpans,
  colorMap,
};

// Stress test
export const StressTest = Template.bind({});

const generateServiceNames = (count: number) => {
  const serviceNames: string[] = [];

  const categories = [
    'api',
    'auth',
    'user',
    'product',
    'cart',
    'payment',
    'shipping',
    'notification',
    'inventory',
    'search',
    'recommendation',
    'analytics',
    'logging',
    'monitoring',
    'cache',
    'database',
    'storage',
    'queue',
    'frontend',
    'backend',
    'middleware',
    'gateway',
  ];

  // Generate unique service names
  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const serviceNumber = Math.floor(i / categories.length) + 1;
    serviceNames.push(`${category}-service-${serviceNumber}`);
  }

  return serviceNames;
};

// Generate relationships between services
const generateRelationships = (serviceNames: string[], connectionsPerService: number = 3) => {
  const relationships: Array<[string, string]> = [];

  // Track connections per service (both incoming and outgoing)
  const connectionCounts: Record<string, number> = {};
  serviceNames.forEach((service) => {
    connectionCounts[service] = 0;
  });

  // Maximum connections per service (in + out)
  const maxConnectionsPerService = 20;

  // Helper function to add a relationship if it doesn't exceed connection limits
  const addRelationshipIfPossible = (source: string, target: string): boolean => {
    // Check if adding this connection would exceed the limit for either service
    if (
      connectionCounts[source] >= maxConnectionsPerService ||
      connectionCounts[target] >= maxConnectionsPerService
    ) {
      return false;
    }

    // Add the relationship
    relationships.push([source, target]);

    // Update connection counts
    connectionCounts[source]++;
    connectionCounts[target]++;

    return true;
  };

  // Create a tree-like structure to ensure all services are connected
  // First, connect each service to a "parent" service
  for (let i = 1; i < serviceNames.length; i++) {
    const parentIndex = Math.floor((i - 1) / connectionsPerService);
    const source = serviceNames[parentIndex];
    const target = serviceNames[i];

    // Always add the base tree connections to ensure connectivity
    relationships.push([source, target]);

    // Update connection counts
    connectionCounts[source]++;
    connectionCounts[target]++;
  }

  // Add some random connections to create a more complex graph
  const maxAttempts = serviceNames.length * 5; // Limit the number of attempts
  let attempts = 0;
  let addedConnections = 0;

  while (attempts < maxAttempts && addedConnections < serviceNames.length * 2) {
    attempts++;

    // Pick random source and target
    const sourceIndex = Math.floor(Math.random() * serviceNames.length);
    const targetIndex = Math.floor(Math.random() * serviceNames.length);

    // Ensure we don't create self-loops
    if (targetIndex === sourceIndex) {
      continue;
    }

    const source = serviceNames[sourceIndex];
    const target = serviceNames[targetIndex];

    // Try to add the relationship
    if (addRelationshipIfPossible(source, target)) {
      addedConnections++;
    }
  }

  return relationships;
};

const generateColorMap = (serviceNames: string[]) => {
  const generatedColorMap: Record<string, string> = {};

  serviceNames.forEach((service, index) => {
    generatedColorMap[service] = defaultColors[index % defaultColors.length];
  });

  return generatedColorMap;
};

// Create the stress test data
const stressTestServiceCount = 50;
const stressTestServices = generateServiceNames(stressTestServiceCount);
const stressTestRelationships = generateRelationships(stressTestServices);
const stressTestColorMap = generateColorMap(stressTestServices);

// Create spans with varying latencies and error rates
const stressTestSpans = createMockSpans(stressTestServices, stressTestRelationships);

// Add errors to some services (about 10% of services)
const errorServices = stressTestServices.filter(() => Math.random() < 0.1);
const stressTestSpansWithErrors = addErrorSpans(stressTestSpans, errorServices);

// Add varying latencies
stressTestSpansWithErrors.forEach((span) => {
  // Randomize durations to simulate different latencies
  if (Math.random() < 0.05) {
    // 5% of spans are very slow
    span.durationInNanos = 2000000000 + Math.random() * 3000000000; // 2-5s
  } else if (Math.random() < 0.15) {
    // 15% of spans are moderately slow
    span.durationInNanos = 800000000 + Math.random() * 1200000000; // 800ms-2s
  } else {
    // 80% of spans are normal/fast
    span.durationInNanos = 100000000 + Math.random() * 700000000; // 100-800ms
  }
});

StressTest.args = {
  hits: stressTestSpansWithErrors,
  colorMap: stressTestColorMap,
};

StressTest.parameters = {
  docs: {
    description: {
      story: `A stress test example with ${stressTestServiceCount} services to evaluate performance under heavy load.`,
    },
  },
  // Set a longer timeout for this story since it's heavy
  chromatic: { timeout: 10000 },
};
