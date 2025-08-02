/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SpanRawSpanTab } from './span_raw_span_tab';

// Mock the helper functions
jest.mock('../../utils/helper_functions', () => ({
  isEmpty: jest.fn((value: any) => {
    return (
      value === undefined ||
      value === null ||
      (typeof value === 'object' && Object.keys(value).length === 0) ||
      (typeof value === 'string' && value.trim().length === 0) ||
      (Array.isArray(value) && value.length === 0)
    );
  }),
}));

describe('SpanRawSpanTab', () => {
  const mockSpanData = {
    spanId: 'test-span-id',
    traceId: 'test-trace-id',
    serviceName: 'test-service',
    operationName: 'GET /api/test',
    startTime: '2023-01-01T00:00:00Z',
    endTime: '2023-01-01T00:00:01Z',
    duration: 1000,
    status: {
      code: 0,
      message: 'OK',
    },
    tags: {
      'http.method': 'GET',
      'http.url': 'https://example.com/api/test',
      'http.status_code': 200,
    },
    process: {
      serviceName: 'test-service',
      tags: {
        'service.version': '1.0.0',
      },
    },
  };

  describe('when no span is selected', () => {
    it('renders no span selected message when selectedSpan is undefined', () => {
      render(<SpanRawSpanTab selectedSpan={undefined} />);

      expect(screen.getByText('No span selected')).toBeInTheDocument();
    });

    it('renders no span selected message when selectedSpan is null', () => {
      render(<SpanRawSpanTab selectedSpan={null} />);

      expect(screen.getByText('No span selected')).toBeInTheDocument();
    });

    it('renders no span selected message when selectedSpan is empty object', () => {
      render(<SpanRawSpanTab selectedSpan={{}} />);

      expect(screen.getByText('No span selected')).toBeInTheDocument();
    });

    it('renders no span selected message when selectedSpan is empty string', () => {
      render(<SpanRawSpanTab selectedSpan="" />);

      expect(screen.getByText('No span selected')).toBeInTheDocument();
    });

    it('renders no span selected message when selectedSpan is empty array', () => {
      render(<SpanRawSpanTab selectedSpan={[]} />);

      expect(screen.getByText('No span selected')).toBeInTheDocument();
    });
  });

  describe('when span is selected', () => {
    it('renders JSON code block without title', () => {
      render(<SpanRawSpanTab selectedSpan={mockSpanData} />);

      // Should render the JSON code block
      const codeElement = document.querySelector('code');
      expect(codeElement).toBeInTheDocument();
    });

    it('renders JSON code block with span data', () => {
      render(<SpanRawSpanTab selectedSpan={mockSpanData} />);

      const codeElement = document.querySelector('code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement?.textContent).toContain('test-span-id');
    });

    it('displays formatted JSON content', () => {
      render(<SpanRawSpanTab selectedSpan={mockSpanData} />);

      // Check that the code element contains the expected JSON content
      const codeElement = document.querySelector('code');
      expect(codeElement?.textContent).toContain('test-span-id');
      expect(codeElement?.textContent).toContain('test-service');
      expect(codeElement?.textContent).toContain('GET /api/test');
    });

    it('renders code block with correct properties', () => {
      render(<SpanRawSpanTab selectedSpan={mockSpanData} />);

      const preElement = document.querySelector('pre');
      expect(preElement).toBeInTheDocument();

      const codeElement = document.querySelector('code');
      expect(codeElement).toBeInTheDocument();
    });

    it('handles simple span data correctly', () => {
      const simpleSpan = {
        spanId: 'simple-span',
        serviceName: 'simple-service',
      };

      render(<SpanRawSpanTab selectedSpan={simpleSpan} />);

      const codeElement = document.querySelector('code');
      expect(codeElement?.textContent).toContain('simple-span');
      expect(codeElement?.textContent).toContain('simple-service');
    });

    it('handles complex nested span data', () => {
      const complexSpan = {
        spanId: 'complex-span',
        nested: {
          level1: {
            level2: {
              value: 'deep nested value',
            },
          },
        },
      };

      render(<SpanRawSpanTab selectedSpan={complexSpan} />);
      const codeElement = document.querySelector('code');
      expect(codeElement?.textContent).toContain('complex-span');
      expect(codeElement?.textContent).toContain('deep nested value');
    });

    it('handles span data with null and undefined values', () => {
      const spanWithNulls = {
        spanId: 'test-span',
        nullValue: null,
        emptyString: '',
        zeroValue: 0,
        falseValue: false,
      };

      render(<SpanRawSpanTab selectedSpan={spanWithNulls} />);

      const codeElement = document.querySelector('code');
      expect(codeElement?.textContent).toContain('test-span');
      expect(codeElement?.textContent).toContain('null');
      expect(codeElement?.textContent).toContain('false');
    });

    it('handles span data with special characters', () => {
      const spanWithSpecialChars = {
        spanId: 'test-span',
        unicode: 'Unicode characters 中文',
      };

      render(<SpanRawSpanTab selectedSpan={spanWithSpecialChars} />);

      const codeElement = document.querySelector('code');
      expect(codeElement?.textContent).toContain('test-span');
      expect(codeElement?.textContent).toContain('Unicode characters 中文');
    });

    it('handles very large span data', () => {
      const largeSpan = {
        spanId: 'large-span',
        largeArray: Array.from({ length: 5 }, (_, i) => ({
          id: i,
          value: `item-${i}`,
        })),
      };

      render(<SpanRawSpanTab selectedSpan={largeSpan} />);

      const codeElement = document.querySelector('code');
      expect(codeElement?.textContent).toContain('large-span');
      expect(codeElement?.textContent).toContain('largeArray');
    });

    it('handles span data with circular references gracefully', () => {
      // Create an object with circular reference
      const spanWithCircular: any = {
        spanId: 'circular-span',
        serviceName: 'test-service',
      };
      spanWithCircular.self = spanWithCircular;

      // JSON.stringify will throw an error with circular references
      // The component should handle this by throwing an error
      expect(() => {
        render(<SpanRawSpanTab selectedSpan={spanWithCircular} />);
      }).toThrow('Converting circular structure to JSON');
    });
  });

  describe('accessibility', () => {
    it('has proper text content for screen readers when no span selected', () => {
      render(<SpanRawSpanTab selectedSpan={undefined} />);

      const noSpanText = screen.getByText('No span selected');
      expect(noSpanText).toHaveAttribute('class', expect.stringContaining('euiText'));
    });

    it('has proper structure for screen readers when span is selected', () => {
      render(<SpanRawSpanTab selectedSpan={mockSpanData} />);

      const codeElement = document.querySelector('code');
      expect(codeElement).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles boolean span data', () => {
      render(<SpanRawSpanTab selectedSpan={true} />);

      expect(screen.getByText('true')).toBeInTheDocument();
    });

    it('handles numeric span data', () => {
      render(<SpanRawSpanTab selectedSpan={42} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('handles string span data', () => {
      render(<SpanRawSpanTab selectedSpan="test string" />);

      expect(screen.getByText('"test string"')).toBeInTheDocument();
    });

    it('handles array span data', () => {
      const arrayData = ['item1', 'item2', { key: 'value' }];
      render(<SpanRawSpanTab selectedSpan={arrayData} />);

      const codeElement = document.querySelector('code');
      expect(codeElement?.textContent).toContain('item1');
      expect(codeElement?.textContent).toContain('item2');
      expect(codeElement?.textContent).toContain('value');
    });
  });
});
