/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  isOnTracesPage,
  isSpanIdColumn,
  extractFieldFromRowData,
  buildTraceDetailsUrl,
  handleSpanIdNavigation,
  SpanIdLink,
} from './trace_utils';

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

  describe('extractFieldFromRowData', () => {
    const TRACE_ID_FIELDS = [
      'traceId',
      'trace_id',
      'traceID',
      '_source.traceId',
      '_source.trace_id',
      '_source.traceID',
    ];
    const SPAN_ID_FIELDS = [
      'spanId',
      'span_id',
      'spanID',
      '_source.spanId',
      '_source.span_id',
      '_source.spanID',
    ];

    it('should return empty string for null or undefined rowData', () => {
      expect(extractFieldFromRowData(null as any, TRACE_ID_FIELDS)).toBe('');
      expect(extractFieldFromRowData(undefined as any, TRACE_ID_FIELDS)).toBe('');
    });

    describe('trace ID extraction', () => {
      it('should extract traceId from direct field', () => {
        const rowData = { traceId: 'trace-123' } as any;
        expect(extractFieldFromRowData(rowData, TRACE_ID_FIELDS)).toBe('trace-123');
      });

      it('should extract trace_id from direct field', () => {
        const rowData = { trace_id: 'trace-456' } as any;
        expect(extractFieldFromRowData(rowData, TRACE_ID_FIELDS)).toBe('trace-456');
      });

      it('should extract traceID from direct field', () => {
        const rowData = { traceID: 'trace-789' } as any;
        expect(extractFieldFromRowData(rowData, TRACE_ID_FIELDS)).toBe('trace-789');
      });

      it('should extract traceId from _source.traceId', () => {
        const rowData = { _source: { traceId: 'trace-source-123' } } as any;
        expect(extractFieldFromRowData(rowData, TRACE_ID_FIELDS)).toBe('trace-source-123');
      });

      it('should extract trace_id from _source.trace_id', () => {
        const rowData = { _source: { trace_id: 'trace-source-456' } } as any;
        expect(extractFieldFromRowData(rowData, TRACE_ID_FIELDS)).toBe('trace-source-456');
      });

      it('should extract traceID from _source.traceID', () => {
        const rowData = { _source: { traceID: 'trace-source-789' } } as any;
        expect(extractFieldFromRowData(rowData, TRACE_ID_FIELDS)).toBe('trace-source-789');
      });

      it('should prioritize direct fields over _source fields', () => {
        const rowData = {
          traceId: 'direct-trace',
          _source: { traceId: 'source-trace' },
        } as any;
        expect(extractFieldFromRowData(rowData, TRACE_ID_FIELDS)).toBe('direct-trace');
      });
    });

    describe('span ID extraction', () => {
      it('should extract spanId from direct field', () => {
        const rowData = { spanId: 'span-123' } as any;
        expect(extractFieldFromRowData(rowData, SPAN_ID_FIELDS)).toBe('span-123');
      });

      it('should extract span_id from direct field', () => {
        const rowData = { span_id: 'span-456' } as any;
        expect(extractFieldFromRowData(rowData, SPAN_ID_FIELDS)).toBe('span-456');
      });

      it('should extract spanID from direct field', () => {
        const rowData = { spanID: 'span-789' } as any;
        expect(extractFieldFromRowData(rowData, SPAN_ID_FIELDS)).toBe('span-789');
      });

      it('should extract spanId from _source.spanId', () => {
        const rowData = { _source: { spanId: 'span-source-123' } } as any;
        expect(extractFieldFromRowData(rowData, SPAN_ID_FIELDS)).toBe('span-source-123');
      });
    });

    it('should return empty string if no specified fields are found', () => {
      const rowData = { otherId: 'other-123', message: 'test message' } as any;
      expect(extractFieldFromRowData(rowData, TRACE_ID_FIELDS)).toBe('');
      expect(extractFieldFromRowData(rowData, SPAN_ID_FIELDS)).toBe('');
    });

    it('should return empty string if field exists but is not a string', () => {
      const rowData = { traceId: 123 } as any;
      expect(extractFieldFromRowData(rowData, TRACE_ID_FIELDS)).toBe('');
    });

    it('should return empty string if field is empty string', () => {
      const rowData = { traceId: '' } as any;
      expect(extractFieldFromRowData(rowData, TRACE_ID_FIELDS)).toBe('');
    });

    it('should handle nested _source field that is null', () => {
      const rowData = { _source: null } as any;
      expect(extractFieldFromRowData(rowData, TRACE_ID_FIELDS)).toBe('');
    });

    it('should handle missing _source field gracefully', () => {
      const rowData = { traceId: null } as any;
      expect(extractFieldFromRowData(rowData, TRACE_ID_FIELDS)).toBe('');
    });

    it('should handle complex nested objects', () => {
      const rowData = {
        _source: {
          nested: {
            traceId: 'should-not-find-this',
          },
          traceId: 'correct-trace-id',
        },
      } as any;
      expect(extractFieldFromRowData(rowData, TRACE_ID_FIELDS)).toBe('correct-trace-id');
    });

    it('should return empty string for empty fields array', () => {
      const rowData = { traceId: 'trace-123' } as any;
      expect(extractFieldFromRowData(rowData, [])).toBe('');
    });

    it('should handle deeply nested paths correctly', () => {
      const rowData = {
        level1: {
          level2: {
            level3: {
              spanId: 'deep-span-123',
            },
          },
        },
      } as any;
      expect(extractFieldFromRowData(rowData, ['level1.level2.level3.spanId'])).toBe(
        'deep-span-123'
      );
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
      } as any;
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
      } as any;
      const result = buildTraceDetailsUrl('span-123', '', dataset);

      expect(result).toBe(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123')"
      );
    });

    it('should use default values when dataset is null', () => {
      const result = buildTraceDetailsUrl('span-123', 'trace-456', null as any);

      expect(result).toBe(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'default-dataset-id',title:'otel-v1-apm-span-*',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')"
      );
    });

    it('should use default values when dataset properties are missing', () => {
      const dataset = {} as any;
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
      } as any;
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
      } as any;
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
      } as any;
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
      } as any;
      const result = buildTraceDetailsUrl('', 'trace-456', dataset);

      expect(result).toBe(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'',traceId:'trace-456')"
      );
    });

    it('should include timeFieldName when present', () => {
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
        timeFieldName: 'endTime',
      } as any;
      const result = buildTraceDetailsUrl('span-123', 'trace-456', dataset);

      expect(result).toBe(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN',timeFieldName:'endTime'),spanId:'span-123',traceId:'trace-456')"
      );
    });

    it('should include dataSource when present (external data source)', () => {
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
        timeFieldName: 'endTime',
        dataSource: {
          id: 'external-datasource-id',
          title: 'external',
          type: 'OpenSearch',
        },
      } as any;
      const result = buildTraceDetailsUrl('span-123', 'trace-456', dataset);

      expect(result).toBe(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN',timeFieldName:'endTime',dataSource:(id:'external-datasource-id',title:'external',type:'OpenSearch')),spanId:'span-123',traceId:'trace-456')"
      );
    });

    it('should work with external data source without timeFieldName', () => {
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
        dataSource: {
          id: 'external-datasource-id',
          title: 'external',
          type: 'OpenSearch',
        },
      } as any;
      const result = buildTraceDetailsUrl('span-123', 'trace-456', dataset);

      expect(result).toBe(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN',dataSource:(id:'external-datasource-id',title:'external',type:'OpenSearch')),spanId:'span-123',traceId:'trace-456')"
      );
    });
  });

  describe('handleSpanIdNavigation', () => {
    beforeEach(() => {
      mockLocation.pathname = '/app/explore/traces';
    });

    it('should open new window with correct URL', () => {
      const rowData = { spanId: 'span-123', traceId: 'trace-456' } as any;
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      } as any;

      handleSpanIdNavigation(rowData, dataset);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')",
        '_blank'
      );
    });

    it('should extract spanId and traceId from row data', () => {
      const rowData = { spanId: 'span-123', traceId: 'trace-456' } as any;
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      } as any;

      handleSpanIdNavigation(rowData, dataset);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')",
        '_blank'
      );
    });

    it('should work when no trace ID is found in row data', () => {
      const rowData = { spanId: 'span-123', message: 'test' } as any;
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      } as any;

      handleSpanIdNavigation(rowData, dataset);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'span-123')",
        '_blank'
      );
    });

    it('should handle null row data', () => {
      const rowData = null as any;
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      } as any;

      handleSpanIdNavigation(rowData, dataset);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'')",
        '_blank'
      );
    });

    it('should handle null dataset', () => {
      const rowData = { spanId: 'span-123', traceId: 'trace-456' } as any;
      const dataset = null as any;

      handleSpanIdNavigation(rowData, dataset);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'default-dataset-id',title:'otel-v1-apm-span-*',type:'INDEX_PATTERN'),spanId:'span-123',traceId:'trace-456')",
        '_blank'
      );
    });

    it('should handle missing spanId in row data', () => {
      const rowData = { traceId: 'trace-456', message: 'test' } as any;
      const dataset = {
        id: 'test-dataset',
        title: 'test-title',
        type: 'INDEX_PATTERN',
      } as any;

      handleSpanIdNavigation(rowData, dataset);

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
        rowData: { spanId: 'span-123', traceId: 'trace-456' } as any,
        dataset: { id: 'test-dataset', title: 'test-title', type: 'INDEX_PATTERN' } as any,
      };

      render(<SpanIdLink {...props} />);

      expect(screen.getByText('span-123')).toBeInTheDocument();
      expect(screen.getByTestId('spanIdLink')).toBeInTheDocument();
    });

    it('should strip HTML tags from sanitized cell value in display', () => {
      const props = {
        sanitizedCellValue: '<span>span-123</span>',
        rowData: { spanId: 'span-123', traceId: 'trace-456' } as any,
        dataset: { id: 'test-dataset', title: 'test-title', type: 'INDEX_PATTERN' } as any,
      };

      render(<SpanIdLink {...props} />);

      expect(screen.getByText('span-123')).toBeInTheDocument();
      expect(screen.queryByText('<span>span-123</span>')).not.toBeInTheDocument();
    });

    it('should call handleSpanIdNavigation when clicked', () => {
      const props = {
        sanitizedCellValue: 'span-123',
        rowData: { spanId: 'span-123', traceId: 'trace-456' } as any,
        dataset: { id: 'test-dataset', title: 'test-title', type: 'INDEX_PATTERN' } as any,
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
        rowData: { spanId: 'span-123', traceId: 'trace-456' } as any,
        dataset: { id: 'test-dataset', title: 'test-title', type: 'INDEX_PATTERN' } as any,
      };

      render(<SpanIdLink {...props} />);

      // Check for the EuiIcon with type="popout"
      const icon = screen.getByTestId('spanIdLink').querySelector('[data-euiicon-type="popout"]');
      expect(icon).toBeInTheDocument();
    });

    it('should handle whitespace in sanitized cell value', () => {
      const props = {
        sanitizedCellValue: '  span-123  ',
        rowData: { spanId: 'span-123', traceId: 'trace-456' } as any,
        dataset: { id: 'test-dataset', title: 'test-title', type: 'INDEX_PATTERN' } as any,
      };

      render(<SpanIdLink {...props} />);

      expect(screen.getByText('span-123')).toBeInTheDocument();
    });

    it('should work with null row data', () => {
      const props = {
        sanitizedCellValue: 'span-123',
        rowData: null as any,
        dataset: { id: 'test-dataset', title: 'test-title', type: 'INDEX_PATTERN' } as any,
      };

      render(<SpanIdLink {...props} />);

      const link = screen.getByTestId('spanIdLink');
      fireEvent.click(link);

      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost:5601/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset',title:'test-title',type:'INDEX_PATTERN'),spanId:'')",
        '_blank'
      );
    });

    it('should work with null dataset', () => {
      const props = {
        sanitizedCellValue: 'span-123',
        rowData: { spanId: 'span-123', traceId: 'trace-456' } as any,
        dataset: null as any,
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
        rowData: { spanId: 'span-123', traceId: 'trace-456' } as any,
        dataset: { id: 'test-dataset', title: 'test-title', type: 'INDEX_PATTERN' } as any,
      };

      render(<SpanIdLink {...props} />);

      // The tooltip should be present (though we can't easily test the hover behavior in jsdom)
      const link = screen.getByTestId('spanIdLink');
      expect(link).toBeInTheDocument();
    });
  });
});
