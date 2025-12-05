/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { GanttChart } from './gantt_chart_vega';
import { defaultColors } from '../utils/shared_const';

export default {
  component: GanttChart,
  title:
    'src/plugins/explore/public/application/pages/traces/trace_details/public/gantt_chart_vega/gantt_chart_vega',
  parameters: {
    docs: {
      description: {
        component: 'A component that visualizes trace spans in a Gantt chart using Vega.',
      },
    },
  },
} as ComponentMeta<typeof GanttChart>;

const Template: ComponentStory<typeof GanttChart> = (args) => <GanttChart {...args} />;

// Create a color map for services using shared default colors
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

// Helper function to create a timestamp string
const createTimestamp = (baseTime: Date, offsetMs: number): string => {
  const time = new Date(baseTime.getTime() + offsetMs);
  return time.toISOString();
};

// Helper function to create mock span data
const createMockSpans = (
  baseTime: Date,
  services: string[],
  relationships: Array<[string, number, number, string, string]>
) => {
  const spans: any[] = [];
  let spanId = 1;

  // Create root span
  if (services.length > 0) {
    const rootStartTime = createTimestamp(baseTime, 0);
    const rootEndTime = createTimestamp(baseTime, 1000);

    spans.push({
      traceId: 'trace-1',
      spanId: `span-${spanId++}`,
      parentSpanId: '',
      serviceName: services[0],
      name: `${services[0]}-operation`,
      startTime: rootStartTime,
      endTime: rootEndTime,
      durationInNanos: 1000 * 1000000, // 1s in nanos
    });
  }

  // Create spans for relationships
  // Each relationship is [parentService, startOffset, duration, serviceName, operationName]
  relationships.forEach(([parentService, startOffset, duration, serviceName, operationName]) => {
    const parentSpan = spans.find((span) => span.serviceName === parentService);
    const parentSpanId = parentSpan ? parentSpan.spanId : '';

    const startTime = createTimestamp(baseTime, startOffset);
    const endTime = createTimestamp(baseTime, startOffset + duration);

    spans.push({
      traceId: 'trace-1',
      spanId: `span-${spanId++}`,
      parentSpanId,
      serviceName,
      name: operationName,
      startTime,
      endTime,
      durationInNanos: duration * 1000000, // Convert ms to nanos
    });
  });

  return spans;
};

// Add error status to spans
const addErrorSpans = (spans: any[], errorServices: string[]) => {
  return spans.map((span) => {
    if (errorServices.includes(span.serviceName)) {
      return {
        ...span,
        'status.code': 2,
      };
    }
    return span;
  });
};

// Empty state
export const Empty = Template.bind({});
Empty.args = {
  data: [],
  colorMap,
  height: 150,
  onSpanClick: action('Span clicked'),
};

// Basic trace with a few spans
export const Basic = Template.bind({});
const baseTime = new Date('2023-01-01T00:00:00Z');
Basic.args = {
  data: createMockSpans(
    baseTime,
    ['frontend'],
    [
      ['frontend', 100, 300, 'api-gateway', 'GET /api/v1/products'],
      ['frontend', 450, 200, 'api-gateway', 'GET /api/v1/user'],
      ['api-gateway', 150, 200, 'product-service', 'fetchProducts'],
      ['api-gateway', 500, 100, 'user-service', 'getUserProfile'],
    ]
  ),
  colorMap,
  height: 200,
  onSpanClick: action('Span clicked'),
};

// Complex trace with many spans and nested relationships
export const Complex = Template.bind({});
Complex.args = {
  data: createMockSpans(
    baseTime,
    ['frontend'],
    [
      ['frontend', 50, 800, 'api-gateway', 'GET /api/v1/checkout'],
      ['api-gateway', 100, 200, 'auth-service', 'validateToken'],
      ['api-gateway', 350, 300, 'user-service', 'getUserDetails'],
      ['api-gateway', 400, 400, 'cart-service', 'getCartItems'],
      ['cart-service', 450, 300, 'product-service', 'getProductDetails'],
      ['cart-service', 500, 250, 'inventory-service', 'checkInventory'],
      ['api-gateway', 700, 100, 'payment-service', 'processPayment'],
      ['payment-service', 750, 30, 'notification-service', 'sendPaymentConfirmation'],
      ['api-gateway', 820, 20, 'shipping-service', 'createShippingLabel'],
    ]
  ),
  colorMap,
  height: 400,
  onSpanClick: action('Span clicked'),
};

// Trace with error spans
export const WithErrors = Template.bind({});
WithErrors.args = {
  data: addErrorSpans(
    createMockSpans(
      baseTime,
      ['frontend'],
      [
        ['frontend', 50, 800, 'api-gateway', 'GET /api/v1/checkout'],
        ['api-gateway', 100, 200, 'auth-service', 'validateToken'],
        ['api-gateway', 350, 300, 'user-service', 'getUserDetails'],
        ['api-gateway', 400, 400, 'cart-service', 'getCartItems'],
        ['cart-service', 450, 300, 'product-service', 'getProductDetails'],
      ]
    ),
    ['auth-service', 'product-service']
  ),
  colorMap,
  height: 300,
  onSpanClick: action('Span clicked'),
};

// Trace with varying span durations
export const VaryingDurations = Template.bind({});
VaryingDurations.args = {
  data: createMockSpans(
    baseTime,
    ['frontend'],
    [
      ['frontend', 50, 1500, 'api-gateway', 'GET /api/v1/dashboard'],
      ['api-gateway', 100, 50, 'auth-service', 'validateToken'],
      ['api-gateway', 200, 1200, 'product-service', 'getProductRecommendations'],
      ['api-gateway', 300, 400, 'user-service', 'getUserPreferences'],
      ['api-gateway', 800, 700, 'analytics-service', 'trackUserActivity'],
    ]
  ),
  colorMap,
  height: 250,
  onSpanClick: action('Span clicked'),
};

// Trace with many parallel spans
export const ParallelSpans = Template.bind({});
const parallelSpans = createMockSpans(
  baseTime,
  ['frontend'],
  [['frontend', 100, 900, 'api-gateway', 'GET /api/v1/search']]
);

// Add many parallel API calls from the gateway
for (let i = 0; i < 10; i++) {
  parallelSpans.push({
    traceId: 'trace-1',
    spanId: `parallel-span-${i}`,
    parentSpanId: parallelSpans[1].spanId, // api-gateway span
    serviceName: 'search-service',
    name: `searchShard${i}`,
    startTime: createTimestamp(baseTime, 150),
    endTime: createTimestamp(baseTime, 850),
    durationInNanos: 700 * 1000000,
  });
}

ParallelSpans.args = {
  data: parallelSpans,
  colorMap,
  height: 400,
  onSpanClick: action('Span clicked'),
};

// Trace with deep nesting
export const DeepNesting = Template.bind({});
const deepNestingSpans = createMockSpans(
  baseTime,
  ['client-app'],
  [['client-app', 50, 950, 'api-gateway', 'GET /api/v1/order']]
);

// Add a chain of nested service calls
let lastSpanId = deepNestingSpans[1].spanId;
let startOffset = 100;

const nestedServices = [
  'auth-service',
  'user-service',
  'order-service',
  'product-service',
  'inventory-service',
  'pricing-service',
  'tax-service',
  'payment-service',
  'notification-service',
];

nestedServices.forEach((service, index) => {
  const duration = 800 - index * 70; // Decreasing duration for each level
  const spanId = `nested-span-${index}`;

  deepNestingSpans.push({
    traceId: 'trace-1',
    spanId,
    parentSpanId: lastSpanId,
    serviceName: service,
    name: `${service}-operation`,
    startTime: createTimestamp(baseTime, startOffset),
    endTime: createTimestamp(baseTime, startOffset + duration),
    durationInNanos: duration * 1000000,
  });

  lastSpanId = spanId;
  startOffset += 50; // Increase start offset for each level
});

DeepNesting.args = {
  data: deepNestingSpans,
  colorMap: {
    ...colorMap,
    'client-app': defaultColors[0],
    'order-service': defaultColors[1],
    'pricing-service': defaultColors[2],
    'tax-service': defaultColors[3],
  },
  height: 500,
  onSpanClick: action('Span clicked'),
};

// Stress test with many spans
export const StressTest = Template.bind({});
const stressTestSpans = [];
const stressTestBaseTime = new Date('2023-01-01T00:00:00Z');

// Create root span
stressTestSpans.push({
  traceId: 'trace-stress',
  spanId: 'root-span',
  parentSpanId: '',
  serviceName: 'frontend',
  name: 'pageLoad',
  startTime: createTimestamp(stressTestBaseTime, 0),
  endTime: createTimestamp(stressTestBaseTime, 5000),
  durationInNanos: 5000 * 1000000,
});

// Generate service names
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
  ];

  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const serviceNumber = Math.floor(i / categories.length) + 1;
    serviceNames.push(`${category}-service-${serviceNumber}`);
  }

  return serviceNames;
};

// Generate a color map for all services
const generateColorMap = (serviceNames: string[]) => {
  const generatedColorMap: Record<string, string> = { ...colorMap };

  serviceNames.forEach((service, index) => {
    if (!generatedColorMap[service]) {
      generatedColorMap[service] = defaultColors[index % defaultColors.length];
    }
  });

  return generatedColorMap;
};

// Create many spans for stress testing
const stressTestServiceCount = 50;
const stressTestServices = generateServiceNames(stressTestServiceCount);
const stressTestColorMap = generateColorMap(stressTestServices);

// Add spans with varying start times, durations, and parent-child relationships
for (let i = 0; i < stressTestServiceCount; i++) {
  const service = stressTestServices[i];
  const spanStartOffset = Math.random() * 4000;
  const duration = 100 + Math.random() * 900;

  // Determine parent span - either root or another span
  let parentSpanId = 'root-span';
  if (i > 0 && Math.random() > 0.3) {
    // 70% chance to have a non-root parent
    const parentIndex = Math.floor(Math.random() * i);
    parentSpanId = stressTestSpans[parentIndex + 1].spanId; // +1 because root span is at index 0
  }

  stressTestSpans.push({
    traceId: 'trace-stress',
    spanId: `span-${i}`,
    parentSpanId,
    serviceName: service,
    name: `${service}-operation-${i % 5}`,
    startTime: createTimestamp(stressTestBaseTime, spanStartOffset),
    endTime: createTimestamp(stressTestBaseTime, spanStartOffset + duration),
    durationInNanos: duration * 1000000,
    'status.code': Math.random() < 0.1 ? 2 : 0, // 10% chance of error
  });
}

StressTest.args = {
  data: stressTestSpans,
  colorMap: stressTestColorMap,
  height: 800,
  onSpanClick: action('Span clicked'),
};

StressTest.parameters = {
  docs: {
    description: {
      story: `A stress test example with ${stressTestServiceCount} spans to evaluate performance under heavy load.`,
    },
  },
  // Set a longer timeout for this story
  chromatic: { timeout: 10000 },
};
