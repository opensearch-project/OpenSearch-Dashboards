/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TraceFlyout } from './trace_flyout';
import { useTraceFlyoutContext } from './trace_flyout_context';

jest.mock('./trace_flyout_context');
jest.mock('../trace_details/trace_view', () => {
  // require inside the factory: jest.mock is hoisted above imports, so the top-level React
  // import is out of scope here.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const react = require('react');
  return {
    // Replicate the real TraceDetails behavior: it captures trace/span only on mount and does
    // not react to changed props. The test only sees an updated trace if TraceFlyout remounts
    // it (via its key), which is exactly the behavior under test.
    TraceDetails: ({ defaultTraceId, defaultSpanId }: any) => {
      const [mounted] = react.useState(`${defaultTraceId}:${defaultSpanId}`);
      return react.createElement('div', { 'data-test-subj': 'traceDetails' }, mounted);
    },
  };
});

const mockUseTraceFlyoutContext = useTraceFlyoutContext as jest.MockedFunction<
  typeof useTraceFlyoutContext
>;

describe('TraceFlyout', () => {
  const mockCloseTraceFlyout = jest.fn();

  const mockFlyoutData = {
    spanId: 'test-span-id',
    traceId: 'test-trace-id',
    dataset: {
      id: 'test-dataset',
      title: 'test-dataset-title',
      type: 'INDEX_PATTERN',
    },
    rowData: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when flyoutData is undefined', () => {
    mockUseTraceFlyoutContext.mockReturnValue({
      closeTraceFlyout: mockCloseTraceFlyout,
      flyoutData: undefined,
      isFlyoutOpen: true,
      openTraceFlyout: jest.fn(),
    });

    const { container } = render(<TraceFlyout />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when isFlyoutOpen is false', () => {
    mockUseTraceFlyoutContext.mockReturnValue({
      closeTraceFlyout: mockCloseTraceFlyout,
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      flyoutData: mockFlyoutData,
      isFlyoutOpen: false,
      openTraceFlyout: jest.fn(),
    });

    const { container } = render(<TraceFlyout />);
    expect(container.firstChild).toBeNull();
  });

  it('renders flyout when data is available and flyout is open', () => {
    mockUseTraceFlyoutContext.mockReturnValue({
      closeTraceFlyout: mockCloseTraceFlyout,
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      flyoutData: mockFlyoutData,
      isFlyoutOpen: true,
      openTraceFlyout: jest.fn(),
    });

    render(<TraceFlyout />);
    expect(screen.getByTestId('traceDetails')).toBeInTheDocument();
  });

  it('calls closeTraceFlyout when flyout is closed', () => {
    mockUseTraceFlyoutContext.mockReturnValue({
      closeTraceFlyout: mockCloseTraceFlyout,
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      flyoutData: mockFlyoutData,
      isFlyoutOpen: true,
      openTraceFlyout: jest.fn(),
    });

    render(<TraceFlyout />);

    const closeButton = screen.getByTestId('euiFlyoutCloseButton');
    fireEvent.click(closeButton);

    expect(mockCloseTraceFlyout).toHaveBeenCalled();
  });

  it('updates the rendered trace when a different trace is selected while open', () => {
    mockUseTraceFlyoutContext.mockReturnValue({
      closeTraceFlyout: mockCloseTraceFlyout,
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      flyoutData: mockFlyoutData,
      isFlyoutOpen: true,
      openTraceFlyout: jest.fn(),
    });

    const { rerender } = render(<TraceFlyout />);
    expect(screen.getByTestId('traceDetails')).toHaveTextContent('test-trace-id:test-span-id');

    // Simulate selecting a different trace row while the flyout stays open.
    mockUseTraceFlyoutContext.mockReturnValue({
      closeTraceFlyout: mockCloseTraceFlyout,
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      flyoutData: { ...mockFlyoutData, traceId: 'other-trace-id', spanId: 'other-span-id' },
      isFlyoutOpen: true,
      openTraceFlyout: jest.fn(),
    });
    rerender(<TraceFlyout />);

    expect(screen.getByTestId('traceDetails')).toHaveTextContent('other-trace-id:other-span-id');
  });
});
