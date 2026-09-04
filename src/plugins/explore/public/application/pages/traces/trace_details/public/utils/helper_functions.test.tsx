/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import {
  NoMatchMessage,
  microToMilliSec,
  nanoToMilliSec,
  formatSpanDuration,
  getServiceInfo,
} from './helper_functions';

describe('microToMilliSec', () => {
  it('converts microseconds to milliseconds', () => {
    expect(microToMilliSec(1000)).toBe(1);
    expect(microToMilliSec(1500)).toBe(1.5);
  });

  it('handles zero', () => {
    expect(microToMilliSec(0)).toBe(0);
  });

  it('handles invalid input', () => {
    expect(microToMilliSec(NaN)).toBe(0);
    expect(microToMilliSec(undefined as any)).toBe(0);
  });
});

describe('nanoToMilliSec', () => {
  it('converts nanoseconds to milliseconds', () => {
    expect(nanoToMilliSec(1000000)).toBe(1);
    expect(nanoToMilliSec(1500000)).toBe(1.5);
  });

  it('handles zero', () => {
    expect(nanoToMilliSec(0)).toBe(0);
  });

  it('handles invalid input', () => {
    expect(nanoToMilliSec(NaN)).toBe(0);
    expect(nanoToMilliSec(undefined as any)).toBe(0);
  });
});

describe('formatSpanDuration', () => {
  it('renders nanoseconds for sub-microsecond durations', () => {
    expect(formatSpanDuration(512)).toBe('512 ns');
    expect(formatSpanDuration(999)).toBe('999 ns');
  });

  it('scales to microseconds at >= 1µs', () => {
    expect(formatSpanDuration(1000)).toBe('1 µs');
    expect(formatSpanDuration(256620)).toBe('256.62 µs');
    expect(formatSpanDuration(999000)).toBe('999 µs');
  });

  it('scales to milliseconds at >= 1ms', () => {
    expect(formatSpanDuration(1000000)).toBe('1 ms');
    expect(formatSpanDuration(2000000)).toBe('2 ms');
    expect(formatSpanDuration(999000000)).toBe('999 ms');
  });

  it('scales to seconds at >= 1s', () => {
    expect(formatSpanDuration(1000000000)).toBe('1 s');
    expect(formatSpanDuration(1500000000)).toBe('1.5 s');
    expect(formatSpanDuration(59000000000)).toBe('59 s');
  });

  it('scales to minutes at >= 60s', () => {
    expect(formatSpanDuration(60000000000)).toBe('1 min');
    expect(formatSpanDuration(90000000000)).toBe('1.5 min');
  });

  it('promotes to the next unit at rounding boundaries', () => {
    expect(formatSpanDuration(999999)).toBe('1 ms'); // 999.999 µs -> 1 ms, not "1000 µs"
    expect(formatSpanDuration(999999999)).toBe('1 s'); // 999.999999 ms -> 1 s, not "1000 ms"
    expect(formatSpanDuration(59999000000)).toBe('1 min'); // 59.999 s -> 1 min, not "60 s"
  });

  it('handles zero, negative, and invalid input as 0 ns', () => {
    expect(formatSpanDuration(0)).toBe('0 ns');
    expect(formatSpanDuration(-1000000)).toBe('0 ns');
    expect(formatSpanDuration(NaN)).toBe('0 ns');
    expect(formatSpanDuration(undefined as any)).toBe('0 ns');
  });
});

describe('NoMatchMessage', () => {
  const testTraceId = 'test-trace-123';

  it('renders error message with trace ID', () => {
    render(<NoMatchMessage traceId={testTraceId} />);

    expect(screen.getByText(`Error loading Trace Id: ${testTraceId}`)).toBeInTheDocument();
  });

  it('renders error description', () => {
    render(<NoMatchMessage traceId={testTraceId} />);

    expect(
      screen.getByText(
        'The Trace Id is invalid or could not be found. Please check the URL or try again.'
      )
    ).toBeInTheDocument();
  });

  it('renders with correct EuiCallOut props', () => {
    const { container } = render(<NoMatchMessage traceId={testTraceId} />);

    expect(container.querySelector('.euiCallOut--danger')).toBeInTheDocument();
  });
});

describe('getServiceInfo', () => {
  const mockSpan = {
    serviceName: 'test-service',
    name: 'test-operation',
    spanId: 'span-123',
  };

  it('returns formatted service info when selectedSpan is provided', () => {
    const result = getServiceInfo(mockSpan);
    expect(result).toBe('test-service: test-operation');
  });

  it('uses span name as service fallback when serviceName is missing', () => {
    const spanWithoutService = {
      name: 'test-operation',
      spanId: 'span-123',
      // No serviceName property at all
    };
    const result = getServiceInfo(spanWithoutService);
    expect(result).toBe('test-operation: test-operation');
  });

  it('handles missing operation name with default value', () => {
    const spanWithoutOperation = {
      ...mockSpan,
      name: undefined,
    };
    const result = getServiceInfo(spanWithoutOperation);
    expect(result).toBe('test-service: Unknown Operation');
  });

  it('handles both missing serviceName and operation name', () => {
    const spanWithoutBoth = {
      spanId: 'span-123',
      // No serviceName, no name, no resource attributes
    };
    const result = getServiceInfo(spanWithoutBoth);
    expect(result).toBe('Unknown Service: Unknown Operation');
  });

  it('returns "Unknown Trace" when selectedSpan is null but traceId is provided', () => {
    const result = getServiceInfo(null, 'test-trace-id');
    expect(result).toBe('Unknown Trace');
  });

  it('returns empty string when both selectedSpan and traceId are not provided', () => {
    const result = getServiceInfo(null);
    expect(result).toBe('');
  });

  it('returns empty string when selectedSpan is undefined', () => {
    const result = getServiceInfo(undefined);
    expect(result).toBe('');
  });

  it('prioritizes selectedSpan over traceId when both are provided', () => {
    const result = getServiceInfo(mockSpan, 'test-trace-id');
    expect(result).toBe('test-service: test-operation');
  });

  it('handlesbservice name format (resource.attributes.service.name)', () => {
    const otelSpan = {
      resource: {
        attributes: {
          service: {
            name: 'otel-service',
          },
        },
      },
      name: 'otel-operation',
      spanId: 'span-456',
    };
    const result = getServiceInfo(otelSpan);
    expect(result).toBe('otel-service: otel-operation');
  });

  it('handles alternative service name format (resource.attributes["service.name"])', () => {
    const otelSpan = {
      resource: {
        attributes: {
          'service.name': 'alt-otel-service',
        },
      },
      name: 'alt-otel-operation',
      spanId: 'span-789',
    };
    const result = getServiceInfo(otelSpan);
    expect(result).toBe('alt-otel-service: alt-otel-operation');
  });

  it('falls back to span.name when serviceName is not available', () => {
    const spanWithoutService = {
      name: 'fallback-operation',
      spanId: 'span-fallback',
    };
    const result = getServiceInfo(spanWithoutService);
    expect(result).toBe('fallback-operation: fallback-operation');
  });

  it('handles completely empty span with Unknown Service and Unknown Operation', () => {
    const emptySpan = {
      spanId: 'span-empty',
      // No serviceName, no name, no resource attributes
    };
    const result = getServiceInfo(emptySpan);
    expect(result).toBe('Unknown Service: Unknown Operation');
  });
});
