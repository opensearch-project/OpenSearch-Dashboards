/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { NoMatchMessage, microToMilliSec, nanoToMilliSec } from './helper_functions';

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
