/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SpanIssuesTab } from './span_issues_tab';

// Mock the utility functions
jest.mock('../../utils/helper_functions', () => ({
  isEmpty: jest.fn((obj) => {
    if (!obj) return true;
    if (typeof obj === 'object' && Object.keys(obj).length === 0) return true;
    return false;
  }),
}));

jest.mock('../../utils/span_data_utils', () => ({
  extractSpanIssues: jest.fn((span) => {
    if (!span) return [];

    // Mock implementation based on span properties
    const issues = [];

    // Check for error status
    if (span['status.code'] === 2 || span.status?.code === 2) {
      issues.push({
        message: 'Span completed with error status',
        timestamp: span.startTime || '1640995200000000000', // Mock timestamp
        details: {
          statusCode: span['status.code'] || span.status?.code,
          statusMessage: span['status.message'] || span.status?.message || 'Error occurred',
        },
      });
    }

    // Check for events that might indicate issues
    if (span.events && Array.isArray(span.events)) {
      span.events.forEach((event: any, index: number) => {
        if (event.name && event.name.toLowerCase().includes('error')) {
          issues.push({
            message: `Error event: ${event.name}`,
            timestamp: event.timestamp || span.startTime,
            details: event.attributes || event,
          });
        }
      });
    }

    // Check for high duration (mock threshold)
    if (span.durationInNanos && span.durationInNanos > 5000000000) {
      // 5 seconds
      issues.push({
        message: 'Span duration exceeds threshold',
        timestamp: span.startTime,
        details: {
          duration: span.durationInNanos,
          threshold: 5000000000,
        },
      });
    }

    return issues;
  }),
}));

describe('SpanIssuesTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when no span is selected', () => {
    it('renders no span selected message when selectedSpan is undefined', () => {
      render(<SpanIssuesTab selectedSpan={undefined} />);

      expect(screen.getByText('No span selected')).toBeInTheDocument();
    });

    it('renders no span selected message when selectedSpan is null', () => {
      render(<SpanIssuesTab selectedSpan={null} />);

      expect(screen.getByText('No span selected')).toBeInTheDocument();
    });

    it('renders no span selected message when selectedSpan is empty object', () => {
      render(<SpanIssuesTab selectedSpan={{}} />);

      expect(screen.getByText('No span selected')).toBeInTheDocument();
    });
  });

  describe('when span has no issues', () => {
    it('renders no issues message for span with normal status', () => {
      const spanWithoutIssues = {
        spanId: 'test-span-1',
        serviceName: 'test-service',
        name: 'test-operation',
        'status.code': 0,
        durationInNanos: 1000000000, // 1 second
        startTime: '1640995200000000000',
        events: [],
      };

      render(<SpanIssuesTab selectedSpan={spanWithoutIssues} />);

      expect(screen.getByText('No issues found for this span')).toBeInTheDocument();
    });

    it('renders no issues message for span with no events', () => {
      const spanWithoutEvents = {
        spanId: 'test-span-2',
        serviceName: 'test-service',
        name: 'test-operation',
        'status.code': 0,
        durationInNanos: 2000000000, // 2 seconds
        startTime: '1640995200000000000',
      };

      render(<SpanIssuesTab selectedSpan={spanWithoutEvents} />);

      expect(screen.getByText('No issues found for this span')).toBeInTheDocument();
    });
  });

  describe('when span has issues', () => {
    it('renders error status issue', () => {
      const spanWithError = {
        spanId: 'test-span-error',
        serviceName: 'test-service',
        name: 'test-operation',
        'status.code': 2,
        'status.message': 'Internal server error',
        durationInNanos: 1000000000,
        startTime: '1640995200000000000',
        events: [],
      };

      render(<SpanIssuesTab selectedSpan={spanWithError} />);

      expect(screen.getByText('Span completed with error status')).toBeInTheDocument();
      // Use a flexible matcher for timestamp since it varies by timezone
      expect(
        screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} (AM|PM)/)
      ).toBeInTheDocument();

      // Check that JSON details are displayed
      expect(screen.getByText(/"statusCode": 2/)).toBeInTheDocument();
      expect(screen.getByText(/"statusMessage": "Internal server error"/)).toBeInTheDocument();
    });

    it('renders error status issue with status object format', () => {
      const spanWithStatusObject = {
        spanId: 'test-span-status-obj',
        serviceName: 'test-service',
        name: 'test-operation',
        status: {
          code: 2,
          message: 'Request failed',
        },
        durationInNanos: 1000000000,
        startTime: '1640995200000000000',
        events: [],
      };

      render(<SpanIssuesTab selectedSpan={spanWithStatusObject} />);

      expect(screen.getByText('Span completed with error status')).toBeInTheDocument();
      expect(screen.getByText(/"statusCode": 2/)).toBeInTheDocument();
      expect(screen.getByText(/"statusMessage": "Request failed"/)).toBeInTheDocument();
    });

    it('renders error event issues', () => {
      const spanWithErrorEvents = {
        spanId: 'test-span-events',
        serviceName: 'test-service',
        name: 'test-operation',
        'status.code': 0,
        durationInNanos: 1000000000,
        startTime: '1640995200000000000',
        events: [
          {
            name: 'database.error',
            timestamp: '1640995201000000000',
            attributes: {
              'error.type': 'ConnectionTimeout',
              'error.message': 'Database connection timed out',
            },
          },
          {
            name: 'http.error',
            timestamp: '1640995202000000000',
            attributes: {
              'http.status_code': 500,
              'error.message': 'Internal server error',
            },
          },
        ],
      };

      render(<SpanIssuesTab selectedSpan={spanWithErrorEvents} />);

      expect(screen.getByText('Error event: database.error')).toBeInTheDocument();
      expect(screen.getByText('Error event: http.error')).toBeInTheDocument();

      // Check that event details are displayed
      expect(screen.getByText(/"error.type": "ConnectionTimeout"/)).toBeInTheDocument();
      expect(screen.getByText(/"http.status_code": 500/)).toBeInTheDocument();
    });

    it('renders duration threshold issue', () => {
      const spanWithLongDuration = {
        spanId: 'test-span-long',
        serviceName: 'test-service',
        name: 'test-operation',
        'status.code': 0,
        durationInNanos: 10000000000, // 10 seconds (exceeds 5 second threshold)
        startTime: '1640995200000000000',
        events: [],
      };

      render(<SpanIssuesTab selectedSpan={spanWithLongDuration} />);

      expect(screen.getByText('Span duration exceeds threshold')).toBeInTheDocument();
      expect(screen.getByText(/"duration": 10000000000/)).toBeInTheDocument();
      expect(screen.getByText(/"threshold": 5000000000/)).toBeInTheDocument();
    });

    it('renders multiple issues for span with multiple problems', () => {
      const spanWithMultipleIssues = {
        spanId: 'test-span-multiple',
        serviceName: 'test-service',
        name: 'test-operation',
        'status.code': 2,
        'status.message': 'Request failed',
        durationInNanos: 8000000000, // 8 seconds (exceeds threshold)
        startTime: '1640995200000000000',
        events: [
          {
            name: 'validation.error',
            timestamp: '1640995201000000000',
            attributes: {
              'error.type': 'ValidationError',
              'error.message': 'Invalid input parameters',
            },
          },
        ],
      };

      render(<SpanIssuesTab selectedSpan={spanWithMultipleIssues} />);

      // Should show all three types of issues
      expect(screen.getByText('Span completed with error status')).toBeInTheDocument();
      expect(screen.getByText('Error event: validation.error')).toBeInTheDocument();
      expect(screen.getByText('Span duration exceeds threshold')).toBeInTheDocument();
    });

    it('renders issue without timestamp', () => {
      const spanWithIssueNoTimestamp = {
        spanId: 'test-span-no-timestamp',
        serviceName: 'test-service',
        name: 'test-operation',
        'status.code': 2,
        'status.message': 'Error without timestamp',
        durationInNanos: 1000000000,
        // No startTime provided
        events: [],
      };

      render(<SpanIssuesTab selectedSpan={spanWithIssueNoTimestamp} />);

      expect(screen.getByText('Span completed with error status')).toBeInTheDocument();
      // Should not crash when timestamp is missing
      expect(screen.getByText(/"statusMessage": "Error without timestamp"/)).toBeInTheDocument();
    });

    it('renders issue without details', () => {
      // Mock extractSpanIssues to return issue without details
      const { extractSpanIssues: mockExtractSpanIssues } = jest.requireMock(
        '../../utils/span_data_utils'
      );
      mockExtractSpanIssues.mockReturnValueOnce([
        {
          message: 'Simple issue without details',
          timestamp: '1640995200000000000',
          // No details property
        },
      ]);

      const spanWithSimpleIssue = {
        spanId: 'test-span-simple',
        serviceName: 'test-service',
        name: 'test-operation',
      };

      render(<SpanIssuesTab selectedSpan={spanWithSimpleIssue} />);

      expect(screen.getByText('Simple issue without details')).toBeInTheDocument();
      // Use a flexible matcher for timestamp since it varies by timezone
      expect(
        screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} (AM|PM)/)
      ).toBeInTheDocument();
      // Should not render code block when no details
      expect(document.querySelector('code')).not.toBeInTheDocument();
    });

    it('handles complex nested details in JSON format', () => {
      // Mock extractSpanIssues to return issue with complex details
      const { extractSpanIssues: mockExtractSpanIssues } = jest.requireMock(
        '../../utils/span_data_utils'
      );
      mockExtractSpanIssues.mockReturnValueOnce([
        {
          message: 'Complex issue with nested details',
          timestamp: '1640995200000000000',
          details: {
            error: {
              type: 'DatabaseError',
              code: 'CONN_TIMEOUT',
              nested: {
                connection: {
                  host: 'db.example.com',
                  port: 5432,
                  timeout: 30000,
                },
                query: 'SELECT * FROM users WHERE id = ?',
              },
            },
            context: {
              userId: 12345,
              requestId: 'req-abc-123',
            },
          },
        },
      ]);

      const spanWithComplexIssue = {
        spanId: 'test-span-complex',
        serviceName: 'test-service',
        name: 'test-operation',
      };

      render(<SpanIssuesTab selectedSpan={spanWithComplexIssue} />);

      expect(screen.getByText('Complex issue with nested details')).toBeInTheDocument();

      // Check that nested JSON is properly formatted
      expect(screen.getByText(/"type": "DatabaseError"/)).toBeInTheDocument();
      expect(screen.getByText(/"host": "db.example.com"/)).toBeInTheDocument();
      expect(screen.getByText(/"userId": 12345/)).toBeInTheDocument();
    });

    it('renders proper spacing between multiple issues', () => {
      const spanWithTwoIssues = {
        spanId: 'test-span-spacing',
        serviceName: 'test-service',
        name: 'test-operation',
        'status.code': 2,
        'status.message': 'First issue',
        durationInNanos: 8000000000, // Second issue (duration)
        startTime: '1640995200000000000',
        events: [],
      };

      render(<SpanIssuesTab selectedSpan={spanWithTwoIssues} />);

      // Should render both issues
      expect(screen.getByText('Span completed with error status')).toBeInTheDocument();
      expect(screen.getByText('Span duration exceeds threshold')).toBeInTheDocument();

      // Check that both issues are in separate panels
      const panels = document.querySelectorAll('.euiPanel');
      expect(panels.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('timestamp formatting', () => {
    it('correctly formats nanosecond timestamps', () => {
      const spanWithTimestamp = {
        spanId: 'test-span-timestamp',
        serviceName: 'test-service',
        name: 'test-operation',
        'status.code': 2,
        'status.message': 'Test error',
        startTime: '1640995200000000000', // Jan 1, 2022 00:00:00 UTC in nanoseconds
        events: [],
      };

      render(<SpanIssuesTab selectedSpan={spanWithTimestamp} />);

      // Should format the timestamp correctly (nanoseconds / 1000000 = milliseconds)
      // Use a flexible matcher for timestamp since it varies by timezone
      expect(
        screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} (AM|PM)/)
      ).toBeInTheDocument();
    });

    it('handles different timestamp formats', () => {
      const spanWithDifferentTimestamp = {
        spanId: 'test-span-timestamp-2',
        serviceName: 'test-service',
        name: 'test-operation',
        'status.code': 2,
        'status.message': 'Test error',
        startTime: '1641081600000000000', // Jan 2, 2022 00:00:00 UTC in nanoseconds
        events: [],
      };

      render(<SpanIssuesTab selectedSpan={spanWithDifferentTimestamp} />);

      // Use a flexible matcher for timestamp since it varies by timezone
      expect(
        screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} (AM|PM)/)
      ).toBeInTheDocument();
    });
  });

  describe('accessibility and UI elements', () => {
    it('renders copyable code blocks for issue details', () => {
      const spanWithError = {
        spanId: 'test-span-copyable',
        serviceName: 'test-service',
        name: 'test-operation',
        'status.code': 2,
        'status.message': 'Test error for copyable',
        startTime: '1640995200000000000',
        events: [],
      };

      render(<SpanIssuesTab selectedSpan={spanWithError} />);

      // EuiCodeBlock should be copyable
      const codeBlock = document.querySelector('code');
      expect(codeBlock).toBeInTheDocument();

      // Should contain properly formatted JSON
      expect(screen.getByText(/"statusCode": 2/)).toBeInTheDocument();
    });

    it('applies correct styling to issue panels', () => {
      const spanWithError = {
        spanId: 'test-span-styling',
        serviceName: 'test-service',
        name: 'test-operation',
        'status.code': 2,
        'status.message': 'Test error for styling',
        startTime: '1640995200000000000',
        events: [],
      };

      render(<SpanIssuesTab selectedSpan={spanWithError} />);

      // Check that issue message is bold
      const issueMessage = screen.getByText('Span completed with error status');
      expect(issueMessage.tagName.toLowerCase()).toBe('strong');

      // Check that panels are rendered
      const panel = document.querySelector('.euiPanel');
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveClass('euiPanel');
    });

    it('handles scrollable content for long JSON details', () => {
      // Mock extractSpanIssues to return issue with very long details
      const { extractSpanIssues: mockExtractSpanIssues } = jest.requireMock(
        '../../utils/span_data_utils'
      );
      const longDetails = {
        veryLongArray: new Array(100).fill(0).map((_, i) => ({
          index: i,
          data: `This is item number ${i} with some additional data`,
          nested: {
            moreData: `Nested data for item ${i}`,
            evenMoreNested: {
              deepData: `Deep nested data for item ${i}`,
            },
          },
        })),
      };

      mockExtractSpanIssues.mockReturnValueOnce([
        {
          message: 'Issue with very long details',
          timestamp: '1640995200000000000',
          details: longDetails,
        },
      ]);

      const spanWithLongDetails = {
        spanId: 'test-span-long-details',
        serviceName: 'test-service',
        name: 'test-operation',
      };

      render(<SpanIssuesTab selectedSpan={spanWithLongDetails} />);

      expect(screen.getByText('Issue with very long details')).toBeInTheDocument();

      // Should render the scrollable container with CSS class
      const scrollableDiv = document.querySelector('.exploreSpanTabs__issuesContainer');
      expect(scrollableDiv).toBeInTheDocument();
      expect(scrollableDiv).toHaveClass('exploreSpanTabs__issuesContainer');
    });
  });
});
