/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { convertToVegaGanttData } from './gantt_data_adapter';
import { defaultColors } from '../utils/shared_const';

describe('gantt_data_adapter', () => {
  const mockSpanData = [
    {
      spanId: 'span-1',
      traceId: 'trace-1',
      parentSpanId: '',
      serviceName: 'service-a',
      name: 'operation-1',
      startTime: '2023-01-01T10:00:00.000Z',
      endTime: '2023-01-01T10:00:00.100Z',
      durationInNanos: 100000000,
      'status.code': 0,
    },
    {
      spanId: 'span-2',
      traceId: 'trace-1',
      parentSpanId: 'span-1',
      serviceName: 'service-b',
      name: 'operation-2',
      startTime: '2023-01-01T10:00:00.020Z',
      endTime: '2023-01-01T10:00:00.080Z',
      durationInNanos: 60000000,
      'status.code': 0,
    },
    {
      spanId: 'span-3',
      traceId: 'trace-1',
      parentSpanId: 'span-1',
      serviceName: 'service-c',
      name: 'operation-3',
      startTime: '2023-01-01T10:00:00.030Z',
      endTime: '2023-01-01T10:00:00.050Z',
      durationInNanos: 20000000,
      'status.code': 2,
    },
  ];

  const mockSpanDataWithSource = [
    {
      _source: {
        spanId: 'span-1',
        traceId: 'trace-1',
        parentSpanId: '',
        serviceName: 'service-a',
        name: 'operation-1',
        startTime: '2023-01-01T10:00:00.000Z',
        endTime: '2023-01-01T10:00:00.100Z',
        durationInNanos: 100000000,
        'status.code': 0,
      },
    },
    {
      _source: {
        spanId: 'span-2',
        traceId: 'trace-1',
        parentSpanId: 'span-1',
        serviceName: 'service-b',
        name: 'operation-2',
        startTime: '2023-01-01T10:00:00.020Z',
        endTime: '2023-01-01T10:00:00.080Z',
        durationInNanos: 60000000,
        'status.code': 0,
      },
    },
  ];

  it('converts span data to Vega Gantt data format', () => {
    const result = convertToVegaGanttData(mockSpanData);

    // Check that the result has the expected structure
    expect(result).toHaveProperty('values');
    expect(result).toHaveProperty('maxEndTime');

    // Check that all spans are included
    expect(result.values.length).toBe(3);

    // Check that spans have the expected properties
    const span1 = result.values.find((span) => span.spanId === 'span-1');
    expect(span1).toBeDefined();
    expect(span1?.serviceName).toBe('service-a');
    expect(span1?.name).toBe('operation-1');
    expect(span1?.startTime).toBe(0);
    expect(span1?.duration).toBeGreaterThan(0);
    expect(span1?.hasError).toBe(false);

    // Check that error spans are marked correctly
    const span3 = result.values.find((span) => span.spanId === 'span-3');
    expect(span3).toBeDefined();
    expect(span3?.hasError).toBe(true);

    // Check that hierarchy levels are set correctly
    expect(span1?.level).toBe(0); // Root span

    const span2 = result.values.find((span) => span.spanId === 'span-2');
    expect(span2?.level).toBe(1); // Child span

    expect(span3?.level).toBe(1); // Child span
  });

  it('handles span data with _source property', () => {
    const result = convertToVegaGanttData(mockSpanDataWithSource);

    // Check that the result has the expected structure
    expect(result).toHaveProperty('values');
    expect(result.values.length).toBe(2);

    // Check that spans have the expected properties
    const span1 = result.values.find((span) => span.spanId === 'span-1');
    expect(span1).toBeDefined();
    expect(span1?.serviceName).toBe('service-a');

    const span2 = result.values.find((span) => span.spanId === 'span-2');
    expect(span2).toBeDefined();
    expect(span2?.serviceName).toBe('service-b');
  });

  it('handles empty input data', () => {
    const result = convertToVegaGanttData([]);

    expect(result.values).toEqual([]);
    expect(result.maxEndTime).toBe(0);
  });

  it('handles null input data', () => {
    // @ts-ignore - Testing null input
    const result = convertToVegaGanttData(null);

    expect(result.values).toEqual([]);
    expect(result.maxEndTime).toBe(0);
  });

  it('assigns colors to services correctly', () => {
    const result = convertToVegaGanttData(mockSpanData);

    // Check that each service has a color
    const serviceA = result.values.find((span) => span.serviceName === 'service-a');
    const serviceB = result.values.find((span) => span.serviceName === 'service-b');
    const serviceC = result.values.find((span) => span.serviceName === 'service-c');

    expect(serviceA?.color).toBeDefined();
    expect(serviceB?.color).toBeDefined();
    expect(serviceC?.color).toBeDefined();

    // Check that different services have different colors
    expect(serviceA?.color).not.toBe(serviceB?.color);
    expect(serviceA?.color).not.toBe(serviceC?.color);
    expect(serviceB?.color).not.toBe(serviceC?.color);

    // Check that colors are from the default colors array
    expect(defaultColors).toContain(serviceA?.color);
    expect(defaultColors).toContain(serviceB?.color);
    expect(defaultColors).toContain(serviceC?.color);
  });

  it('respects provided color map', () => {
    const colorMap = {
      'service-a': '#ff0000',
      'service-b': '#00ff00',
    };

    const result = convertToVegaGanttData(mockSpanData, colorMap);

    // Check that provided colors are used
    const serviceA = result.values.find((span) => span.serviceName === 'service-a');
    const serviceB = result.values.find((span) => span.serviceName === 'service-b');
    const serviceC = result.values.find((span) => span.serviceName === 'service-c');

    expect(serviceA?.color).toBe('#ff0000');
    expect(serviceB?.color).toBe('#00ff00');
    expect(serviceC?.color).toBeDefined();
    expect(defaultColors).toContain(serviceC?.color);
  });

  it('calculates relative timestamps correctly', () => {
    const result = convertToVegaGanttData(mockSpanData);

    // First span should start at 0
    const span1 = result.values.find((span) => span.spanId === 'span-1');
    expect(span1?.startTime).toBe(0);

    // Other spans should have relative start times
    const span2 = result.values.find((span) => span.spanId === 'span-2');
    const span3 = result.values.find((span) => span.spanId === 'span-3');

    // span2 starts 20ms after span1
    expect(span2?.startTime).toBeGreaterThan(0);

    // span3 starts 30ms after span1
    expect(span3?.startTime).toBeGreaterThan(span2?.startTime || 0);
  });

  it('handles different timestamp formats', () => {
    const dataWithDifferentTimestamps = [
      {
        spanId: 'span-1',
        traceId: 'trace-1',
        parentSpanId: '',
        serviceName: 'service-a',
        name: 'operation-1',
        startTime: '2023-01-01 10:00:00.000',
        endTime: '2023-01-01 10:00:00.100',
        durationInNanos: 100000000,
        'status.code': 0,
      },
      {
        spanId: 'span-2',
        traceId: 'trace-1',
        parentSpanId: 'span-1',
        serviceName: 'service-b',
        name: 'operation-2',
        startTime: '2023-01-01T10:00:00.020Z', // Standard ISO format
        endTime: '2023-01-01T10:00:00.080Z',
        durationInNanos: 60000000,
        'status.code': 0,
      },
    ];

    const result = convertToVegaGanttData(dataWithDifferentTimestamps);

    // Check that timestamps are parsed correctly
    expect(result.values.length).toBe(2);

    const span1 = result.values.find((span) => span.spanId === 'span-1');
    const span2 = result.values.find((span) => span.spanId === 'span-2');

    expect(span1?.startTime).toBe(0);
    expect(span2?.startTime).toBeGreaterThan(0);
    expect(span1?.duration).toBeGreaterThan(0);
    expect(span2?.duration).toBeGreaterThan(0);
  });

  it('handles invalid timestamp formats gracefully', () => {
    const dataWithInvalidTimestamp = [
      {
        spanId: 'span-1',
        traceId: 'trace-1',
        parentSpanId: '',
        serviceName: 'service-a',
        name: 'operation-1',
        startTime: 'invalid-timestamp',
        endTime: 'invalid-timestamp',
        durationInNanos: 100000000,
        'status.code': 0,
      },
    ];

    // Should not throw an error
    const result = convertToVegaGanttData(dataWithInvalidTimestamp);

    // Check that the result has the expected structure
    expect(result).toHaveProperty('values');
    expect(result.values.length).toBe(1);

    // Invalid timestamps should be handled gracefully
    const span1 = result.values[0];
    expect(span1.startTime).toBe(0);
    // When timestamps are invalid but durationInNanos is available, use the duration field
    // 100000000 nanoseconds = 100 milliseconds
    expect(span1.duration).toBe(100);
  });
});
