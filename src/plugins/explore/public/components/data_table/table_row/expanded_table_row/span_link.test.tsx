/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SpanLink, SpanLinkProps } from './span_link';
import { useDatasetContext } from '../../../../application/context';
import {
  extractFieldFromRowData,
  buildTraceDetailsUrl,
} from '../../table_cell/trace_utils/trace_utils';

// Mock the dependencies
jest.mock('../../../../application/context');
jest.mock('../../table_cell/trace_utils/trace_utils');

const mockUseDatasetContext = useDatasetContext as jest.MockedFunction<typeof useDatasetContext>;
const mockExtractFieldFromRowData = extractFieldFromRowData as jest.MockedFunction<
  typeof extractFieldFromRowData
>;
const mockBuildTraceDetailsUrl = buildTraceDetailsUrl as jest.MockedFunction<
  typeof buildTraceDetailsUrl
>;

describe('SpanLink', () => {
  const mockDataset = {
    id: 'test-dataset',
    title: 'Test Dataset',
  };

  const mockRowData = {
    _id: 'test-row-1',
    _index: 'test-index',
    _source: {
      spanId: 'test-span-id',
      traceId: 'test-trace-id',
    },
  } as any;

  const defaultProps: SpanLinkProps = {
    rowData: mockRowData,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildTraceDetailsUrl.mockReturnValue('http://test-url.com/trace-details');
  });

  describe('when dataset is null', () => {
    beforeEach(() => {
      mockUseDatasetContext.mockReturnValue({
        dataset: undefined,
        isLoading: false,
        error: null,
      } as any);
    });

    it('returns null and does not render', () => {
      const { container } = render(<SpanLink {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('when dataset exists', () => {
    beforeEach(() => {
      mockUseDatasetContext.mockReturnValue({
        dataset: mockDataset as any,
        isLoading: false,
        error: null,
      } as any);
    });

    describe('when spanId and traceId are available', () => {
      beforeEach(() => {
        mockExtractFieldFromRowData
          .mockReturnValueOnce('test-span-id') // spanId
          .mockReturnValueOnce('test-trace-id'); // traceId
      });

      it('renders link with correct href and text', () => {
        render(<SpanLink {...defaultProps} />);

        const link = screen.getByRole('link');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', 'http://test-url.com/trace-details');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('data-test-subj', 'osdDocTableDetailsSpanLink');
        expect(link).toHaveStyle({ fontWeight: 'normal' });
        expect(screen.getByText('view details')).toBeInTheDocument();
      });

      it('calls buildTraceDetailsUrl with correct parameters', () => {
        render(<SpanLink {...defaultProps} />);

        expect(mockBuildTraceDetailsUrl).toHaveBeenCalledWith(
          'test-span-id',
          'test-trace-id',
          mockDataset
        );
      });

      it('calls extractFieldFromRowData with correct parameters', () => {
        render(<SpanLink {...defaultProps} />);

        expect(mockExtractFieldFromRowData).toHaveBeenCalledTimes(2);
        // First call for spanId
        expect(mockExtractFieldFromRowData).toHaveBeenNthCalledWith(
          1,
          mockRowData,
          expect.any(Array) // SPAN_ID_FIELD_PATHS
        );
        // Second call for traceId
        expect(mockExtractFieldFromRowData).toHaveBeenNthCalledWith(
          2,
          mockRowData,
          expect.any(Array) // TRACE_ID_FIELD_PATHS
        );
      });
    });

    describe('when spanId is missing', () => {
      beforeEach(() => {
        mockExtractFieldFromRowData
          .mockReturnValueOnce(undefined as any) // spanId
          .mockReturnValueOnce('test-trace-id'); // traceId
      });

      it('returns null and does not render', () => {
        const { container } = render(<SpanLink {...defaultProps} />);
        expect(container.firstChild).toBeNull();
      });

      it('does not call buildTraceDetailsUrl', () => {
        render(<SpanLink {...defaultProps} />);
        expect(mockBuildTraceDetailsUrl).not.toHaveBeenCalled();
      });
    });

    describe('when traceId is missing', () => {
      beforeEach(() => {
        mockExtractFieldFromRowData
          .mockReturnValueOnce('test-span-id') // spanId
          .mockReturnValueOnce(undefined as any); // traceId
      });

      it('returns null and does not render', () => {
        const { container } = render(<SpanLink {...defaultProps} />);
        expect(container.firstChild).toBeNull();
      });

      it('does not call buildTraceDetailsUrl', () => {
        render(<SpanLink {...defaultProps} />);
        expect(mockBuildTraceDetailsUrl).not.toHaveBeenCalled();
      });
    });

    describe('when both spanId and traceId are missing', () => {
      beforeEach(() => {
        mockExtractFieldFromRowData
          .mockReturnValueOnce(undefined as any) // spanId
          .mockReturnValueOnce(undefined as any); // traceId
      });

      it('returns null and does not render', () => {
        const { container } = render(<SpanLink {...defaultProps} />);
        expect(container.firstChild).toBeNull();
      });
    });

    describe('when spanId and traceId are empty strings', () => {
      beforeEach(() => {
        mockExtractFieldFromRowData
          .mockReturnValueOnce('') // spanId
          .mockReturnValueOnce('test-trace-id'); // traceId
      });

      it('returns null and does not render', () => {
        const { container } = render(<SpanLink {...defaultProps} />);
        expect(container.firstChild).toBeNull();
      });
    });

    describe('when buildTraceDetailsUrl returns null', () => {
      beforeEach(() => {
        mockExtractFieldFromRowData
          .mockReturnValueOnce('test-span-id') // spanId
          .mockReturnValueOnce('test-trace-id'); // traceId
        mockBuildTraceDetailsUrl.mockReturnValue(undefined as any);
      });

      it('returns null and does not render', () => {
        const { container } = render(<SpanLink {...defaultProps} />);
        expect(container.firstChild).toBeNull();
      });
    });
  });
});
