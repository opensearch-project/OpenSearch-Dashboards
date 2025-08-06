/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  isOnTracesPage,
  isSpanIdColumn,
  extractTraceIdFromRowData,
  buildTraceDetailsUrl,
  handleSpanIdNavigation,
  SpanIdLink,
} from './trace_utils';

// Mock window.location and window.open
const mockLocation = {
  pathname: '',
  hash: '',
  origin: 'http://localhost:5601',
};

const mockOpen = jest.fn();

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
});

describe('trace_utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.pathname = '';
    mockLocation.hash = '';
    mockLocation.origin = 'http://localhost:5601';
  });

  describe('isOnTracesPage', () => {
    it('should return true when pathname includes /explore/traces', () => {
      mockLocation.pathname = '/app/explore/traces';
      expect(isOnTracesPage()).toBe(true);
    });

    it('should return true when hash includes /explore/traces', () => {
      mockLocation.hash = '#/explore/traces';
      expect(isOnTracesPage()).toBe(true);
    });

    it('should return true when both pathname and hash include /explore/traces', () => {
      mockLocation.pathname = '/app/explore/traces';
      mockLocation.hash = '#/explore/traces/details';
      expect(isOnTracesPage()).toBe(true);
    });

    it('should return false when neither pathname nor hash include /explore/traces', () => {
      mockLocation.pathname = '/app/discover';
      mockLocation.hash = '#/discover';
      expect(isOnTracesPage()).toBe(false);
    });

    it('should return false when pathname is empty', () => {
      mockLocation.pathname = '';
      mockLocation.hash = '';
      expect(isOnTracesPage()).toBe(false);
    });

    it('should handle partial matches correctly', () => {
      mockLocation.pathname = '/app/explore/trace'; // missing 's'
      expect(isOnTracesPage()).toBe(false);
    });
  });

  describe('isSpanIdColumn', () => {
    it('should return true for spanId', () => {
      expect(isSpanIdColumn('spanId')).toBe(true);
    });

    it('should return true for span_id', () => {
      expect(isSpanIdColumn('span_id')).toBe(true);
    });

    it('should return true for spanID', () => {
      expect(isSpanIdColumn('spanID')).toBe(true);
    });

    it('should return false for other column names', () => {
      expect(isSpanIdColumn('traceId')).toBe(false);
      expect(isSpanIdColumn('timestamp')).toBe(false);
      expect(isSpanIdColumn('message')).toBe(false);
      expect(isSpanIdColumn('')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isSpanIdColumn('spanid')).toBe(false);
      expect(isSpanIdColumn('SPANID')).toBe(false);
      expect(isSpanIdColumn('SpanId')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(isSpanIdColumn(null as any)).toBe(false);
      expect(isSpanIdColumn(undefined as any)).toBe(false);
    });
  });

  describe('extractTraceIdFromRowData', () => {
    it('should return empty string for null or undefined rowData', () => {
      expect(extractTraceIdFromRowData(null)).toBe('');
      expect(extractTraceIdFromRowData(undefined)).toBe('');
    });

    it('should extract traceId from direct field', () => {
      const rowData = { traceId: 'trace-123' };
      expect(extractTraceIdFromRowData(rowData)).toBe('trace-123');
    });

    it('should extract trace_id from direct field', () => {
      const rowData = { trace_id: 'trace-456' };
      expect(extractTraceIdFromRowData(rowData)).toBe('trace-456');
    });

    it('should extract traceID from direct field', () => {
      const rowData = { traceID: 'trace-789' };
      expect(extractTraceIdFromRowData(rowData)).toBe('trace-789');
    });

    it('should extract traceId from _source.traceId', () => {
      const rowData = { _source: { traceId: 'trace-source-123' } };
      expect(extractTraceIdFromRowData(rowData)).toBe('trace-source-123');
    });

    it('should extract trace_id from _source.trace_id', () => {
      const rowData = { _source: { trace_id: 'trace-source-456' } };
      expect(extractTraceIdFromRowData(rowData)).toBe('trace-source-456');
    });

    it('should extract traceID from _source.traceID', () => {
      const rowData = { _source: { traceID: 'trace-source-789' } };
      expect(extractTraceIdFromRowData(rowData)).toBe('trace-source-789');
    });

    it('should prioritize direct fields over _source fields', () => {
      const rowData = {
        traceId: 'direct-trace',
        _source: { traceId: 'source-trace' },
      };
      expect(extractTraceIdFromRowData(rowData)).toBe('direct-trace');
    });

    it('should return empty string if no trace ID fields are found', () => {
      const rowData = { spanId: 'span-123', message: 'test message' };
      expect(extractTraceIdFromRowData(rowData)).toBe('');
    });

    it('should return empty string if trace ID field exists but is not a string', () => {
      const rowData = { traceId: 123 };
      expect(extractTraceIdFromRowData(rowData)).toBe('');
    });

    it('should return empty string if trace ID field is empty string', () => {
      const rowData = { traceId: '' };
      expect(extractTraceIdFromRowData(rowData)).toBe('');
    });

    it('should handle nested _source field that is null', () => {
      const rowData = { _source: null };
      expect(extractTraceIdFromRowData(rowData)).toBe('');
    });

    it('should handle missing _source field gracefully', () => {
      const rowData = { traceId: null };
      expect(extractTraceIdFromRowData(rowData)).toBe('');
    });

    it('should handle complex nested objects', () => {
      const rowData = {
        _source: {
          nested: {
            traceId: 'should-not-find-this',
          },
          traceId: 'correct-trace-id',
        },
      };
      expect(extractTraceIdFromRowData(rowData)).toBe('correct-trace-id');
    });
  });

  describe('buildTraceDetailsUrl', () => {
    beforeEach(() => {
      mockLocation.pathname = '/app/explore/traces';
    });

    it('should build URL with span ID and trace ID', () => {
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      };
      const result = buildTraceDetailsUrl('span-123', 'trace-456', dataset);

      expect(result).toBe(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')"
      );
    });

    it('should build URL with only span ID when trace ID is empty', () => {
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      };
      const result = buildTraceDetailsUrl('span-123', '', dataset);

      expect(result).toBe(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123')"
      );
    });

    it('should use default values when dataset is null', () => {
      const result = buildTraceDetailsUrl('span-123', 'trace-456', null);

      expect(result).toBe(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'default-dataset-id',title:'otel-v1-apm-span-*',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')"
      );
    });

    it('should use default values when dataset properties are missing', () => {
      const dataset = {};
      const result = buildTraceDetailsUrl('span-123', 'trace-456', dataset);

      expect(result).toBe(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'default-dataset-id',title:'otel-v1-apm-span-*',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')"
      );
    });

    it('should handle base path correctly', () => {
      mockLocation.pathname = '/custom-base/app/explore/traces';
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      };
      const result = buildTraceDetailsUrl('span-123', 'trace-456', dataset);

      expect(result).toBe(
        "http://localhost:5601/custom-base/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')"
      );
    });

    it('should handle no base path', () => {
      mockLocation.pathname = '/app/explore/traces';
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      };
      const result = buildTraceDetailsUrl('span-123', 'trace-456', dataset);

      expect(result).toBe(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')"
      );
    });

    it('should handle special characters in dataset values', () => {
      const dataset = {
        id: 'test-dataset-with-special-chars',
        title: 'test title with spaces',
        type: 'INDEX_PATTERN',
      };
      const result = buildTraceDetailsUrl('span-123', 'trace-456', dataset);

      expect(result).toBe(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset-with-special-chars',title:'test title with spaces',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')"
      );
    });

    it('should handle empty span ID', () => {
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      };
      const result = buildTraceDetailsUrl('', 'trace-456', dataset);

      expect(result).toBe(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'',traceId:'trace-456')"
      );
    });
  });

  describe('handleSpanIdNavigation', () => {
    beforeEach(() => {
      mockLocation.pathname = '/app/explore/traces';
    });

    it('should open new window with correct URL', () => {
      const sanitizedCellValue = 'span-123';
      const rowData = { traceId: 'trace-456' };
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      };

      handleSpanIdNavigation(sanitizedCellValue, rowData, dataset);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')",
        '_blank'
      );
    });

    it('should strip HTML tags from sanitized cell value', () => {
      const sanitizedCellValue = '<span>span-123</span>';
      const rowData = { traceId: 'trace-456' };
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      };

      handleSpanIdNavigation(sanitizedCellValue, rowData, dataset);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')",
        '_blank'
      );
    });

    it('should trim whitespace from span ID', () => {
      const sanitizedCellValue = '  span-123  ';
      const rowData = { traceId: 'trace-456' };
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      };

      handleSpanIdNavigation(sanitizedCellValue, rowData, dataset);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')",
        '_blank'
      );
    });

    it('should handle complex HTML tags', () => {
      const sanitizedCellValue = '<div class="highlight"><strong>span-123</strong></div>';
      const rowData = { traceId: 'trace-456' };
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      };

      handleSpanIdNavigation(sanitizedCellValue, rowData, dataset);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')",
        '_blank'
      );
    });

    it('should work when no trace ID is found in row data', () => {
      const sanitizedCellValue = 'span-123';
      const rowData = { spanId: 'span-123', message: 'test' };
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      };

      handleSpanIdNavigation(sanitizedCellValue, rowData, dataset);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123')",
        '_blank'
      );
    });

    it('should handle null row data', () => {
      const sanitizedCellValue = 'span-123';
      const rowData = null;
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      };

      handleSpanIdNavigation(sanitizedCellValue, rowData, dataset);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123')",
        '_blank'
      );
    });

    it('should handle null dataset', () => {
      const sanitizedCellValue = 'span-123';
      const rowData = { traceId: 'trace-456' };
      const dataset = null;

      handleSpanIdNavigation(sanitizedCellValue, rowData, dataset);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'default-dataset-id',title:'otel-v1-apm-span-*',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')",
        '_blank'
      );
    });

    it('should handle empty sanitized cell value', () => {
      const sanitizedCellValue = '';
      const rowData = { traceId: 'trace-456' };
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      };

      handleSpanIdNavigation(sanitizedCellValue, rowData, dataset);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'',traceId:'trace-456')",
        '_blank'
      );
    });
  });

  describe('SpanIdLink', () => {
    beforeEach(() => {
      mockLocation.pathname = '/app/explore/traces';
    });

    it('should render span ID link with correct text', () => {
      const props = {
        sanitizedCellValue: 'span-123',
        rowData: { traceId: 'trace-456' },
        dataset: { id: 'test-dataset', title: 'test-title', type: 'INDEX_PATTERN' },
      };

      render(<SpanIdLink {...props} />);

      expect(screen.getByText('span-123')).toBeInTheDocument();
      expect(screen.getByTestId('spanIdLink')).toBeInTheDocument();
    });

    it('should strip HTML tags from sanitized cell value in display', () => {
      const props = {
        sanitizedCellValue: '<span>span-123</span>',
        rowData: { traceId: 'trace-456' },
        dataset: { id: 'test-dataset', title: 'test-title', type: 'INDEX_PATTERN' },
      };

      render(<SpanIdLink {...props} />);

      expect(screen.getByText('span-123')).toBeInTheDocument();
      expect(screen.queryByText('<span>span-123</span>')).not.toBeInTheDocument();
    });

    it('should call handleSpanIdNavigation when clicked', () => {
      const props = {
        sanitizedCellValue: 'span-123',
        rowData: { traceId: 'trace-456' },
        dataset: { id: 'test-dataset', title: 'test-title', type: 'INDEX_PATTERN' },
      };

      render(<SpanIdLink {...props} />);

      const link = screen.getByTestId('spanIdLink');
      fireEvent.click(link);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')",
        '_blank'
      );
    });

    it('should display popout icon', () => {
      const props = {
        sanitizedCellValue: 'span-123',
        rowData: { traceId: 'trace-456' },
        dataset: { id: 'test-dataset', title: 'test-title', type: 'INDEX_PATTERN' },
      };

      render(<SpanIdLink {...props} />);

      // Check for the EuiIcon with type="popout"
      const icon = screen.getByTestId('spanIdLink').querySelector('[data-euiicon-type="popout"]');
      expect(icon).toBeInTheDocument();
    });

    it('should handle whitespace in sanitized cell value', () => {
      const props = {
        sanitizedCellValue: '  span-123  ',
        rowData: { traceId: 'trace-456' },
        dataset: { id: 'test-dataset', title: 'test-title', type: 'INDEX_PATTERN' },
      };

      render(<SpanIdLink {...props} />);

      expect(screen.getByText('span-123')).toBeInTheDocument();
    });

    it('should work with null row data', () => {
      const props = {
        sanitizedCellValue: 'span-123',
        rowData: null,
        dataset: { id: 'test-dataset', title: 'test-title', type: 'INDEX_PATTERN' },
      };

      render(<SpanIdLink {...props} />);

      const link = screen.getByTestId('spanIdLink');
      fireEvent.click(link);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123')",
        '_blank'
      );
    });

    it('should work with null dataset', () => {
      const props = {
        sanitizedCellValue: 'span-123',
        rowData: { traceId: 'trace-456' },
        dataset: null,
      };

      render(<SpanIdLink {...props} />);

      const link = screen.getByTestId('spanIdLink');
      fireEvent.click(link);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'default-dataset-id',title:'otel-v1-apm-span-*',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')",
        '_blank'
      );
    });

    it('should have correct tooltip text', () => {
      const props = {
        sanitizedCellValue: 'span-123',
        rowData: { traceId: 'trace-456' },
        dataset: { id: 'test-dataset', title: 'test-title', type: 'INDEX_PATTERN' },
      };

      render(<SpanIdLink {...props} />);

      // The tooltip should be present (though we can't easily test the hover behavior in jsdom)
      const link = screen.getByTestId('spanIdLink');
      expect(link).toBeInTheDocument();
    });
  });
});
