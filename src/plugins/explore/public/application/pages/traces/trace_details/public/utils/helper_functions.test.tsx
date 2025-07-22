/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PanelTitle, NoMatchMessage, microToMilliSec, nanoToMilliSec } from './helper_functions';

describe('PanelTitle', () => {
  it('renders title correctly', () => {
    render(<PanelTitle title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

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

  it('renders title with total items', () => {
    render(<PanelTitle title="Test Title" totalItems={5} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('(5)')).toBeInTheDocument();
  });

  it('renders title without total items when not provided', () => {
    render(<PanelTitle title="Test Title" />);
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });

  it('renders action when provided', () => {
    const actionText = 'Action Button';
    render(<PanelTitle title="Test Title" action={<button>{actionText}</button>} />);
    expect(screen.getByText(actionText)).toBeInTheDocument();
  });

  it('does not render action section when not provided', () => {
    const { container } = render(<PanelTitle title="Test Title" />);

    const flexItems = container.getElementsByClassName('euiFlexItem');
    expect(flexItems.length).toBe(1);
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
