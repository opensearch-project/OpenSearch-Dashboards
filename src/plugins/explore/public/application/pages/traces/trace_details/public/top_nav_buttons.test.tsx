/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TraceTopNavMenu } from './top_nav_buttons';

const mockSetBreadcrumbs = jest.fn();

jest.mock('../../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      chrome: {
        setBreadcrumbs: mockSetBreadcrumbs,
      },
    },
  }),
}));

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('TraceTopNavMenu', () => {
  const defaultProps = {
    payloadData: [{ test: 'data' }],
    traceId: 'test-trace-id',
    title: 'test-title',
    isFlyout: false,
    traceDetailsLink: 'trace-details-link',
  };

  let mockElements: HTMLElement[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    mockElements = [];
  });

  afterEach(() => {
    mockElements.forEach((element) => {
      if (document.body && document.body.contains(element)) {
        try {
          document.body.removeChild(element);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });
    mockElements = [];
  });

  it('renders the modal when View raw data button is clicked', () => {
    const mockSetMenuMountPoint = jest.fn();
    const mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
    mockElements.push(mockElement);

    render(<TraceTopNavMenu {...defaultProps} setMenuMountPoint={mockSetMenuMountPoint} />);

    // Get the mount function and call it to render the header content
    const mountFunction = mockSetMenuMountPoint.mock.calls[0][0];
    mountFunction(mockElement);

    // Find and click the View raw data button
    const viewRawDataBtn = mockElement.querySelector('[data-test-subj="viewRawDataBtn"]');
    expect(viewRawDataBtn).toBeTruthy();
    expect(viewRawDataBtn?.textContent).toBe('View raw trace');

    fireEvent.click(viewRawDataBtn!);

    // Modal should now be visible
    expect(screen.getByText('Raw data')).toBeInTheDocument();
    // Check for the formatted JSON content in the modal
    expect(screen.getByText(/test.*data/)).toBeInTheDocument();
  });

  it('closes the raw data modal when Close button is clicked', () => {
    const mockSetMenuMountPoint = jest.fn();
    const mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
    mockElements.push(mockElement);

    render(<TraceTopNavMenu {...defaultProps} setMenuMountPoint={mockSetMenuMountPoint} />);

    const mountFunction = mockSetMenuMountPoint.mock.calls[0][0];
    mountFunction(mockElement);

    // Open the modal
    const viewRawDataBtn = mockElement.querySelector('[data-test-subj="viewRawDataBtn"]');
    fireEvent.click(viewRawDataBtn!);
    expect(screen.getByText('Raw data')).toBeInTheDocument();

    // Click the Close button
    fireEvent.click(screen.getByText('Close'));

    // Modal should be closed
    expect(screen.queryByText('Raw data')).not.toBeInTheDocument();
  });

  it('handles empty payload data gracefully', () => {
    const propsWithEmptyData = {
      ...defaultProps,
      payloadData: [],
    };

    const mockSetMenuMountPoint = jest.fn();
    const mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
    mockElements.push(mockElement);

    render(<TraceTopNavMenu {...propsWithEmptyData} setMenuMountPoint={mockSetMenuMountPoint} />);

    const mountFunction = mockSetMenuMountPoint.mock.calls[0][0];
    mountFunction(mockElement);

    // Click the View raw data button
    const viewRawDataBtn = mockElement.querySelector('[data-test-subj="viewRawDataBtn"]');
    fireEvent.click(viewRawDataBtn!);

    // Modal should open but not show any data
    expect(screen.getByText('Raw data')).toBeInTheDocument();
    // Should not show the JSON content since payloadData is empty
    expect(screen.queryByText('[]')).not.toBeInTheDocument();
  });

  it('sets menu mount point when provided', () => {
    const mockSetMenuMountPoint = jest.fn();

    render(<TraceTopNavMenu {...defaultProps} setMenuMountPoint={mockSetMenuMountPoint} />);

    // Should call setMenuMountPoint with a mount function
    expect(mockSetMenuMountPoint).toHaveBeenCalledWith(expect.any(Function));
  });

  it('renders without setMenuMountPoint', () => {
    // Should not throw when setMenuMountPoint is not provided
    expect(() => {
      render(<TraceTopNavMenu {...defaultProps} />);
    }).not.toThrow();
  });

  it('sets breadcrumb with the page title', () => {
    render(<TraceTopNavMenu {...defaultProps} />);
    expect(mockSetBreadcrumbs).toHaveBeenCalledWith([{ text: 'test-title' }]);

    // Should not display the title directly
    expect(screen.queryByText('test-title')).not.toBeInTheDocument();
  });

  it('does not render trace details link on traces page', () => {
    render(<TraceTopNavMenu {...defaultProps} />);
    expect(screen.queryByTestId('traceDetailsLink')).not.toBeInTheDocument();
  });

  it('handles flyout case', () => {
    const mockSetMenuMountPoint = jest.fn();
    render(
      <TraceTopNavMenu
        {...defaultProps}
        isFlyout={true}
        setMenuMountPoint={mockSetMenuMountPoint}
      />
    );

    expect(screen.getByTestId('traceDetailsLink')).toBeInTheDocument();
    expect(screen.getByTestId('viewRawDataBtn')).toBeInTheDocument();
    expect(screen.getByTestId('traceIdBadge')).toBeInTheDocument();
    expect(screen.getByTestId('traceDetailsTitle')).toHaveTextContent('test-title');

    expect(mockSetBreadcrumbs).not.toHaveBeenCalled();
    expect(mockSetMenuMountPoint).not.toHaveBeenCalled();
  });

  describe('Trace ID Badge', () => {
    it('displays trace ID badge with correct format when traceId is provided', () => {
      const mockSetMenuMountPoint = jest.fn();
      const mockElement = document.createElement('div');
      document.body.appendChild(mockElement);
      mockElements.push(mockElement);

      render(<TraceTopNavMenu {...defaultProps} setMenuMountPoint={mockSetMenuMountPoint} />);

      const mountFunction = mockSetMenuMountPoint.mock.calls[0][0];
      mountFunction(mockElement);

      // Check if the trace ID badge is rendered with correct format
      expect(mockElement.textContent).toContain('Trace ID: test-trace-id');
    });

    it('copies only the trace ID when badge is clicked', async () => {
      const mockSetMenuMountPoint = jest.fn();
      const mockElement = document.createElement('div');
      document.body.appendChild(mockElement);
      mockElements.push(mockElement);

      render(<TraceTopNavMenu {...defaultProps} setMenuMountPoint={mockSetMenuMountPoint} />);

      const mountFunction = mockSetMenuMountPoint.mock.calls[0][0];
      mountFunction(mockElement);

      // Find and click the badge
      const badge = mockElement.querySelector('[style*="cursor: pointer"]');
      expect(badge).toBeTruthy();

      fireEvent.click(badge!);

      // Verify that only the trace ID (not the "Trace ID:" prefix) was copied
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-trace-id');
      });
    });

    it('does not display trace ID badge when traceId is not provided', () => {
      const mockSetMenuMountPoint = jest.fn();
      const mockElement = document.createElement('div');
      document.body.appendChild(mockElement);
      mockElements.push(mockElement);

      const propsWithoutTraceId = {
        payloadData: [{ test: 'data' }],
        isFlyout: false,
        title: 'test-title',
        traceDetailsLink: 'trace-details-link',
      };

      render(
        <TraceTopNavMenu {...propsWithoutTraceId} setMenuMountPoint={mockSetMenuMountPoint} />
      );

      const mountFunction = mockSetMenuMountPoint.mock.calls[0][0];
      mountFunction(mockElement);

      // Should not contain trace ID text
      expect(mockElement.textContent).not.toContain('Trace ID:');
    });

    it('handles clipboard copy failure gracefully', async () => {
      const mockSetMenuMountPoint = jest.fn();
      const mockElement = document.createElement('div');
      document.body.appendChild(mockElement);
      mockElements.push(mockElement);

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(<TraceTopNavMenu {...defaultProps} setMenuMountPoint={mockSetMenuMountPoint} />);

      const mountFunction = mockSetMenuMountPoint.mock.calls[0][0];
      mountFunction(mockElement);

      const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard error'));
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      // Find and click the badge
      const badge = mockElement.querySelector('[style*="cursor: pointer"]');
      expect(badge).toBeTruthy();

      fireEvent.click(badge!);

      // Verify that writeText was called and error was handled gracefully
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('test-trace-id');
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Failed to copy trace ID to clipboard:',
          expect.any(Error)
        );
      });

      // Cleanup
      consoleWarnSpy.mockRestore();
    });
  });
});
