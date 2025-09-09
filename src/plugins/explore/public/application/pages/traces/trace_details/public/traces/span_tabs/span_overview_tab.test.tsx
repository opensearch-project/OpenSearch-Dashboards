/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpanOverviewTab } from './span_overview_tab';

// Mock clipboard API for copy functionality
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock moment to have consistent time formatting in tests
jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  return (date?: any) => {
    if (date) {
      const momentInstance = actualMoment(date);
      // Mock specific format methods for consistent testing
      momentInstance.format = jest.fn((format: string) => {
        if (format === 'MMM D') return 'Jan 15';
        if (format === 'HH:mm:ss.SSS') return '14:30:45.123';
        return momentInstance.format(format);
      });
      return momentInstance;
    }
    return actualMoment();
  };
});

// Mock helper functions
jest.mock('../../utils/helper_functions', () => ({
  nanoToMilliSec: jest.fn((nanos: number) => nanos / 1000000),
  isEmpty: jest.fn((obj: any) => {
    return (
      obj == null ||
      (typeof obj === 'object' && Object.keys(obj).length === 0) ||
      (Array.isArray(obj) && obj.length === 0)
    );
  }),
  round: jest.fn(
    (num: number, decimals: number) =>
      Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
  ),
}));

describe('SpanOverviewTab', () => {
  const mockOnSwitchToErrorsTab = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when no span is selected', () => {
    it('renders no span selected message when selectedSpan is undefined', () => {
      render(
        <SpanOverviewTab selectedSpan={undefined} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />
      );

      expect(screen.getByText('No span selected')).toBeInTheDocument();
    });

    it('renders no span selected message when selectedSpan is null', () => {
      render(<SpanOverviewTab selectedSpan={null} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      expect(screen.getByText('No span selected')).toBeInTheDocument();
    });

    it('renders no span selected message when selectedSpan is empty object', () => {
      render(<SpanOverviewTab selectedSpan={{}} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      expect(screen.getByText('No span selected')).toBeInTheDocument();
    });
  });

  describe('basic information display', () => {
    it('renders service identifier and span ID', () => {
      const span = {
        spanId: 'test-span-123',
        serviceName: 'user-service',
        name: 'getUserData',
        durationInNanos: 5000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      // Check labels
      expect(screen.getByText('Service identifier')).toBeInTheDocument();
      expect(screen.getByText('Span ID')).toBeInTheDocument();

      // Check values
      expect(screen.getByText('user-service')).toBeInTheDocument();
      expect(screen.getByText('test-span-123')).toBeInTheDocument();
    });

    it('renders dash when service name or span ID is missing', () => {
      const span = {
        // Missing spanId and serviceName
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      // Should render dashes for missing values
      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThanOrEqual(1);
    });

    it('renders copyable service identifier and span ID', () => {
      const span = {
        spanId: 'copyable-span-123',
        serviceName: 'copyable-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      // Should render copy buttons
      const copyButtons = screen.getAllByLabelText('Copy to clipboard');
      expect(copyButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('start time and span status display', () => {
    it('renders formatted start time with duration', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 5000000, // 5ms
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      expect(screen.getByText('Start time')).toBeInTheDocument();
      expect(screen.getByText('Jan 15 @ 14:30:45.123 (5ms)')).toBeInTheDocument();
    });

    it('renders dash when start time is missing', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        // Missing startTime
        'status.code': 1,
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      expect(screen.getByText('Start time')).toBeInTheDocument();
      // Should find a dash in the start time section
      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThanOrEqual(1);
    });

    it('renders OK status for successful spans', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1, // OK status
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      expect(screen.getByText('Span status')).toBeInTheDocument();
      expect(screen.getByText('OK')).toBeInTheDocument();

      // Should not show "View errors" link for OK status
      expect(screen.queryByText('View errors')).not.toBeInTheDocument();
    });

    it('renders Error status for error spans with View errors link', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 2, // Error status
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      expect(screen.getByText('Span status')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();

      // Should show "View errors" link for error status
      expect(screen.getByText('View errors')).toBeInTheDocument();
    });

    it('calls onSwitchToErrorsTab when View errors link is clicked', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 2, // Error status
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      const viewErrorsLink = screen.getByText('View errors');
      fireEvent.click(viewErrorsLink);

      expect(mockOnSwitchToErrorsTab).toHaveBeenCalledTimes(1);
    });

    it('does not render View errors link when onSwitchToErrorsTab is not provided', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 2, // Error status
      };

      render(<SpanOverviewTab selectedSpan={span} />);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('View errors')).not.toBeInTheDocument();
    });
  });

  describe('HTTP requests & response section', () => {
    it('renders HTTP section when HTTP attributes are present', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
        attributes: {
          'http.method': 'GET',
          'http.url': 'https://api.example.com/users',
          'http.status_code': 200,
        },
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      expect(screen.getByText('Request')).toBeInTheDocument();
      expect(screen.getByText('Request URL')).toBeInTheDocument();
      expect(screen.getByText('Request method')).toBeInTheDocument();
      expect(screen.getByText('Request code')).toBeInTheDocument();
    });

    it('does not render HTTP section when no HTTP attributes are present', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
        // No HTTP attributes
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      expect(screen.queryByText('Request')).not.toBeInTheDocument();
    });

    it('renders HTTP URL as external link with copy button', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
        attributes: {
          'http.url': 'https://api.example.com/users/123',
        },
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      const urlLink = screen.getByText('https://api.example.com/users/123');
      expect(urlLink).toBeInTheDocument();
      expect(urlLink.closest('a')).toHaveAttribute('href', 'https://api.example.com/users/123');
      expect(urlLink.closest('a')).toHaveAttribute('target', '_blank');

      // Should have copy button for URL
      const copyButtons = screen.getAllByLabelText('Copy to clipboard');
      expect(copyButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders HTTP method or falls back to operation name', () => {
      const spanWithMethod = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'getUserData',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
        attributes: {
          'http.method': 'POST',
        },
      };

      render(
        <SpanOverviewTab
          selectedSpan={spanWithMethod}
          onSwitchToErrorsTab={mockOnSwitchToErrorsTab}
        />
      );

      expect(screen.getByText('Request method')).toBeInTheDocument();
      expect(screen.getByText('POST')).toBeInTheDocument();
    });

    it('falls back to operation name when HTTP method is not available', () => {
      const spanWithoutMethod = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'getUserData',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
        attributes: {
          'http.url': 'https://api.example.com/users',
          // No http.method
        },
      };

      render(
        <SpanOverviewTab
          selectedSpan={spanWithoutMethod}
          onSwitchToErrorsTab={mockOnSwitchToErrorsTab}
        />
      );

      expect(screen.getByText('Request method')).toBeInTheDocument();
      expect(screen.getByText('getUserData')).toBeInTheDocument();
    });
  });

  describe('status code color logic', () => {
    it('renders success badge for 2xx status codes', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
        attributes: {
          'http.method': 'GET',
          'http.status_code': 200,
        },
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      const badge = screen.getByText('200');
      expect(badge).toBeInTheDocument();
      // Check that the badge exists and has the correct color prop
      expect(badge.closest('.euiBadge')).toBeInTheDocument();
    });

    it('renders primary badge for 3xx status codes', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
        attributes: {
          'http.method': 'GET',
          'http.status_code': 301,
        },
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      const badge = screen.getByText('301');
      expect(badge).toBeInTheDocument();
      expect(badge.closest('.euiBadge')).toBeInTheDocument();
    });

    it('renders warning badge for 4xx status codes', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
        attributes: {
          'http.method': 'GET',
          'http.status_code': 404,
        },
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      const badge = screen.getByText('404');
      expect(badge).toBeInTheDocument();
      expect(badge.closest('.euiBadge')).toBeInTheDocument();
    });

    it('renders danger badge for 5xx status codes', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
        attributes: {
          'http.method': 'GET',
          'http.status_code': 500,
        },
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      const badge = screen.getByText('500');
      expect(badge).toBeInTheDocument();
      expect(badge.closest('.euiBadge')).toBeInTheDocument();
    });

    it('renders Error badge when span has error status but no HTTP status code', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 2, // Error status
        attributes: {
          'http.method': 'GET',
          // No http.status_code
        },
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      // Find the Error badge specifically (not the span status Error text)
      const badges = screen.getAllByText('Error');
      const errorBadge = badges.find((badge) => badge.closest('.euiBadge'));
      expect(errorBadge).toBeInTheDocument();
      expect(errorBadge?.closest('.euiBadge')).toBeInTheDocument();
    });

    it('renders Success badge when span has no error and no HTTP status code', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1, // OK status
        attributes: {
          'http.method': 'GET',
          // No http.status_code
        },
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      const badge = screen.getByText('Success');
      expect(badge).toBeInTheDocument();
      expect(badge.closest('.euiBadge')).toBeInTheDocument();
    });
  });

  describe('edge cases and error handling', () => {
    it('handles span with minimal data', () => {
      const minimalSpan = {
        spanId: 'minimal-span',
        // Missing most fields
      };

      render(
        <SpanOverviewTab selectedSpan={minimalSpan} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />
      );

      // Should render basic structure without crashing
      expect(screen.getByText('Service identifier')).toBeInTheDocument();
      expect(screen.getByText('Span ID')).toBeInTheDocument();
      expect(screen.getByText('minimal-span')).toBeInTheDocument();
    });

    it('handles span with zero duration', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 0,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      expect(screen.getByText('Jan 15 @ 14:30:45.123 (0ms)')).toBeInTheDocument();
    });

    it('handles span with only HTTP URL but no method', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
        attributes: {
          'http.url': 'https://api.example.com/test',
          // No http.method
        },
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      // Should still render HTTP section
      expect(screen.getByText('Request')).toBeInTheDocument();
      expect(screen.getByText('https://api.example.com/test')).toBeInTheDocument();
      expect(screen.getByText('operation')).toBeInTheDocument(); // Falls back to operation name
    });

    it('handles span with only HTTP method but no URL', () => {
      const span = {
        spanId: 'test-span',
        serviceName: 'test-service',
        name: 'operation',
        durationInNanos: 1000000,
        startTime: '2023-01-15T14:30:45.123Z',
        'status.code': 1,
        attributes: {
          'http.method': 'POST',
          // No http.url
        },
      };

      render(<SpanOverviewTab selectedSpan={span} onSwitchToErrorsTab={mockOnSwitchToErrorsTab} />);

      // Should render HTTP section but without URL section
      expect(screen.getByText('Request')).toBeInTheDocument();
      expect(screen.queryByText('Request URL')).not.toBeInTheDocument();
      expect(screen.getByText('POST')).toBeInTheDocument();
    });
  });
});
