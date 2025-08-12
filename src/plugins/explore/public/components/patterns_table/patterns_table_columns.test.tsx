/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { patternsTableColumns } from './patterns_table_columns';
import { mockPatternItems } from './utils/patterns_table.stubs';
import dompurify from 'dompurify';
import { EuiBasicTableColumn } from '@elastic/eui';
import { PatternItem } from './patterns_table';

type ColumnWithRender<T> = EuiBasicTableColumn<T> & {
  field?: string;
  render?: (val: any, item?: T) => React.ReactNode;
};

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

jest.mock('dompurify', () => ({
  sanitize: jest.fn().mockImplementation((content) => content),
}));

describe('patternsTableColumns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have the correct structure with three columns', () => {
    expect(patternsTableColumns).toHaveLength(3);

    const columns = patternsTableColumns as Array<ColumnWithRender<PatternItem>>;
    expect(columns[0].field).toBe('ratio');
    expect(columns[1].field).toBe('sample');
    expect(columns[2].field).toBe('count');
  });

  it('should use correct column headers', () => {
    expect(patternsTableColumns[0].name).toBe('Event ratio');
    expect(patternsTableColumns[1].name).toBe('Pattern Sample Log');
    expect(patternsTableColumns[2].name).toBe('Event count');
  });

  describe('ratio column', () => {
    const ratioColumn = patternsTableColumns[0] as ColumnWithRender<PatternItem>;

    it('should format valid ratio values as percentages', () => {
      expect(ratioColumn.render?.(0.35)).toBe('35.00%');
      expect(ratioColumn.render?.(0.1)).toBe('10.00%');
      expect(ratioColumn.render?.(0.005)).toBe('0.50%');
      expect(ratioColumn.render?.(1)).toBe('100.00%');
    });

    it('should handle edge cases for ratio values', () => {
      expect(ratioColumn.render?.(NaN)).toBe('—');
      expect(ratioColumn.render?.(Infinity)).toBe('—');
      expect(ratioColumn.render?.(-Infinity)).toBe('—');
    });
  });

  describe('sample column', () => {
    const sampleColumn = patternsTableColumns[1] as ColumnWithRender<PatternItem>;

    it('should sanitize and render sample values', () => {
      const sampleValue = 'INFO [main] Starting application';
      const result = sampleColumn.render?.(sampleValue);

      expect(dompurify.sanitize).toHaveBeenCalledWith(sampleValue);

      const { container } = render(<>{result}</>);
      expect(container.textContent).toBe(sampleValue);
    });

    it('should handle empty sample values', () => {
      const result = sampleColumn.render?.('');
      const { container } = render(<>{result}</>);
      expect(container.textContent).toBe('—');
    });

    it('should handle null or undefined sample values', () => {
      // @ts-ignore - Testing edge case with null
      const resultNull = sampleColumn.render?.(null);
      const { container: containerNull } = render(<>{resultNull}</>);
      expect(containerNull.textContent).toBe('—');

      // @ts-ignore - Testing edge case with undefined
      const resultUndefined = sampleColumn.render?.(undefined);
      const { container: containerUndefined } = render(<>{resultUndefined}</>);
      expect(containerUndefined.textContent).toBe('—');
    });
  });

  describe('count column', () => {
    const countColumn = patternsTableColumns[2] as ColumnWithRender<PatternItem>;

    it('should render valid count values directly', () => {
      expect(countColumn.render?.(350)).toBe(350);
      expect(countColumn.render?.(0)).toBe(0);
      expect(countColumn.render?.(1000000)).toBe(1000000);
    });

    it('should handle edge cases for count values', () => {
      expect(countColumn.render?.(NaN)).toBe('—');
      expect(countColumn.render?.(Infinity)).toBe('—');
      expect(countColumn.render?.(-Infinity)).toBe('—');
    });
  });

  it('should render all columns with mock data correctly', () => {
    const mockItem = mockPatternItems[0];

    const ratioColumn = patternsTableColumns[0] as ColumnWithRender<PatternItem>;
    const ratioResult = ratioColumn.render?.(mockItem.ratio);
    expect(ratioResult).toBe('35.00%');

    const sampleColumn = patternsTableColumns[1] as ColumnWithRender<PatternItem>;
    const sampleResult = sampleColumn.render?.(mockItem.sample);
    const { container: sampleContainer } = render(<>{sampleResult}</>);
    expect(sampleContainer.textContent).toBe(mockItem.sample);

    const countColumn = patternsTableColumns[2] as ColumnWithRender<PatternItem>;
    const countResult = countColumn.render?.(mockItem.count);
    expect(countResult).toBe(mockItem.count);
  });
});
