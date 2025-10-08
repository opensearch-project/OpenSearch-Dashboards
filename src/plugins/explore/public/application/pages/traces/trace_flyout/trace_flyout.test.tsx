/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TraceFlyout } from './trace_flyout';
import { useTraceFlyoutContext } from './trace_flyout_context';

jest.mock('../../../../../../opensearch_dashboards_react/public');
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
    rowData: {
      httpStatusCode: 500,
      _source: {
        durationNano: 200000000,
      },
    },
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
      flyoutData: mockFlyoutData,
      isFlyoutOpen: true,
      openTraceFlyout: jest.fn(),
    });

    render(<TraceFlyout />);

    expect(screen.getByText('Trace: test-trace-id')).toBeInTheDocument();
    expect(screen.getByText('Open full page')).toBeInTheDocument();
    expect(screen.getByTestId('traceDetails')).toBeInTheDocument();
    expect(screen.getByTestId('traceDuration')).toHaveTextContent('200 ms');
    expect(screen.getByTestId('traceStatusCode')).toHaveTextContent('500');
  });

  it('calls closeTraceFlyout when flyout is closed', () => {
    mockUseTraceFlyoutContext.mockReturnValue({
      closeTraceFlyout: mockCloseTraceFlyout,
      flyoutData: mockFlyoutData,
      isFlyoutOpen: true,
      openTraceFlyout: jest.fn(),
    });

    render(<TraceFlyout />);

    const closeButton = screen.getByTestId('euiFlyoutCloseButton');
    fireEvent.click(closeButton);

    expect(mockCloseTraceFlyout).toHaveBeenCalled();
  });

  it('renders link to trace details page', () => {
    mockUseTraceFlyoutContext.mockReturnValue({
      closeTraceFlyout: mockCloseTraceFlyout,
      flyoutData: mockFlyoutData,
      isFlyoutOpen: true,
      openTraceFlyout: jest.fn(),
    });

    render(<TraceFlyout />);

    const traceDetailsLink = screen.getByTestId('traceDetailsLink');
    expect(traceDetailsLink).toHaveTextContent('Open full page');
    expect(traceDetailsLink.getAttribute('href')).toContain(
      "/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-dataset-title',type:'INDEX_PATTERN'),spanId:'test-span-id',traceId:'test-trace-id"
    );
  });

  it('handles invalid row data', () => {
    const invalidFlyoutData = {
      ...mockFlyoutData,
      rowData: {
        duration: 'invalid duration',
        'http.status_code': 'invalid status code',
      },
    };

    mockUseTraceFlyoutContext.mockReturnValue({
      closeTraceFlyout: mockCloseTraceFlyout,
      flyoutData: invalidFlyoutData,
      isFlyoutOpen: true,
      openTraceFlyout: jest.fn(),
    });

    render(<TraceFlyout />);
    expect(screen.queryByTestId('traceDuration')).not.toBeInTheDocument();
    expect(screen.queryByTestId('traceStatusCode')).not.toBeInTheDocument();
  });
});
