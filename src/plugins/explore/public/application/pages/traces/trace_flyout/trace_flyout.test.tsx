/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TraceFlyout } from './trace_flyout';
import { useTraceFlyoutContext } from './trace_flyout_context';

jest.mock('./trace_flyout_context');
jest.mock('../trace_details/trace_view', () => ({
  TraceDetails: () => <div data-test-subj="traceDetails">Trace Details</div>,
}));

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
});
