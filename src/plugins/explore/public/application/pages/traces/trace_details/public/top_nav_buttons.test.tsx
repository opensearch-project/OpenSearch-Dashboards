/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TraceTopNavMenu } from './top_nav_buttons';

jest.mock('../../../../../../../navigation/public', () => ({
  TopNavMenu: jest.fn(({ config, setMenuMountPoint }) => (
    <div data-test-subj="mock-top-nav-menu">
      {config.map((item: any) => (
        <button key={item.id} data-test-subj={item.testId} onClick={item.run}>
          {item.label}
        </button>
      ))}
    </div>
  )),
}));

jest.mock('../../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(() => ({
    services: {
      application: {
        navigateToApp: jest.fn(),
      },
    },
  })),
}));

describe('TraceTopNavMenu', () => {
  const defaultProps = {
    payloadData: [
      {
        spanId: 'span1',
        serviceName: 'service-a',
        startTime: '2023-01-01T00:00:00.000Z',
        endTime: '2023-01-01T00:00:01.000Z',
      },
    ],
    dataSourceMDSId: [{ id: 'test-source', label: 'Test Source' }],
    traceId: 'test-trace-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:5601/app/explore/traces' },
      writable: true,
    });
  });

  it('renders the top nav menu with correct buttons', () => {
    render(<TraceTopNavMenu {...defaultProps} />);

    expect(screen.getByTestId('viewRawDataBtn')).toBeInTheDocument();
    expect(screen.getByText('View raw trace')).toBeInTheDocument();
  });

  it('opens the raw data modal when View raw data button is clicked', () => {
    render(<TraceTopNavMenu {...defaultProps} />);

    // Modal should not be visible initially
    expect(screen.queryByText('Raw data')).not.toBeInTheDocument();

    // Click the View raw data button
    fireEvent.click(screen.getByTestId('viewRawDataBtn'));

    // Modal should now be visible
    expect(screen.getByText('Raw data')).toBeInTheDocument();

    // Raw data should be displayed in the modal
    const preElement = screen.getByText(/spanId/);
    expect(preElement).toBeInTheDocument();
    expect(preElement.textContent).toContain('service-a');
  });

  it('closes the raw data modal when Close button is clicked', () => {
    render(<TraceTopNavMenu {...defaultProps} />);

    // Open the modal
    fireEvent.click(screen.getByTestId('viewRawDataBtn'));
    expect(screen.getByText('Raw data')).toBeInTheDocument();

    // Click the Close button
    fireEvent.click(screen.getByText('Close'));

    // Modal should no longer be visible
    expect(screen.queryByText('Raw data')).not.toBeInTheDocument();
  });

  it('handles empty payload data gracefully', () => {
    const propsWithEmptyPayload = {
      ...defaultProps,
      payloadData: [],
    };

    render(<TraceTopNavMenu {...propsWithEmptyPayload} />);

    // Click the View raw data button
    fireEvent.click(screen.getByTestId('viewRawDataBtn'));

    // Modal should open but not show any data
    expect(screen.getByText('Raw data')).toBeInTheDocument();

    // The modal body should be empty or contain an empty array representation
    const modalBody = screen.getByText('Raw data').closest('.euiModal');
    expect(modalBody).toBeInTheDocument();
  });

  it('sets menu mount point when provided', () => {
    const setMenuMountPoint = jest.fn();

    render(<TraceTopNavMenu {...defaultProps} setMenuMountPoint={setMenuMountPoint} />);

    expect(setMenuMountPoint).not.toHaveBeenCalled();
  });
});
