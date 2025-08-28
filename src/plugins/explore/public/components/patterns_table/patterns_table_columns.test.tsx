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
  render?: (val: any, item?: T | undefined) => React.ReactNode;
};

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

jest.mock('dompurify', () => ({
  sanitize: jest.fn().mockImplementation((content) => content),
}));

jest.mock('@elastic/eui', () => {
  const original = jest.requireActual('@elastic/eui');
  return {
    ...original,
    EuiButtonIcon: jest.fn().mockImplementation(({ iconType, onClick, ...rest }) => {
      return (
        <button
          data-test-subj="euiButtonIcon"
          data-icon-type={iconType}
          onClick={onClick}
          {...rest}
        />
      );
    }),
  };
});

const mockOpenPatternsTableFlyout = jest.fn();

describe('patternsTableColumns', () => {
  let columns: Array<ColumnWithRender<PatternItem>>;

  beforeEach(() => {
    jest.clearAllMocks();
    columns = patternsTableColumns(mockOpenPatternsTableFlyout) as Array<
      ColumnWithRender<PatternItem>
    >;
  });

  it('should have the correct structure with four columns', () => {
    expect(columns).toHaveLength(4);

    expect(columns[0].field).toBe('flyout');
    expect(columns[1].field).toBe('ratio');
    expect(columns[2].field).toBe('sample');
    expect(columns[3].field).toBe('count');
  });

  it('should use correct column headers', () => {
    expect(columns[1].name).toBe('Event ratio');
    expect(columns[2].name).toBe('Pattern');
    expect(columns[3].name).toBe('Event count');
  });

  describe('ratio column', () => {
    let ratioColumn: ColumnWithRender<PatternItem>;

    beforeEach(() => {
      ratioColumn = columns[1];
    });

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
    let sampleColumn: ColumnWithRender<PatternItem>;

    beforeEach(() => {
      sampleColumn = columns[2];
    });

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
    let countColumn: ColumnWithRender<PatternItem>;

    beforeEach(() => {
      countColumn = columns[3];
    });

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

  describe('flyout column', () => {
    let flyoutColumn: ColumnWithRender<PatternItem>;

    beforeEach(() => {
      flyoutColumn = columns[0];
    });

    it('should have the correct width', () => {
      expect(flyoutColumn.width).toBe('40px');
    });

    it('should render an EuiButtonIcon with inspect icon', () => {
      const mockRecord = mockPatternItems[0];
      const result = flyoutColumn.render?.(mockRecord);

      const { container } = render(<>{result}</>);
      const buttonElement = container.querySelector('[data-test-subj="euiButtonIcon"]');

      expect(buttonElement).toBeInTheDocument();
      expect(buttonElement?.getAttribute('data-icon-type')).toBe('inspect');
    });

    it('should call openPatternsTableFlyout with the record when clicked', () => {
      const mockRecord = mockPatternItems[0];
      const result = flyoutColumn.render?.(mockRecord);

      const { container } = render(<>{result}</>);
      const buttonElement = container.querySelector(
        '[data-test-subj="euiButtonIcon"]'
      ) as HTMLButtonElement;

      buttonElement?.click();
      expect(mockOpenPatternsTableFlyout).toHaveBeenCalledTimes(1);
      expect(mockOpenPatternsTableFlyout).toHaveBeenCalledWith(mockRecord);
    });
  });

  it('should render all columns with mock data correctly', () => {
    const mockItem = mockPatternItems[0];

    const ratioColumn = columns[1];
    const ratioResult = ratioColumn.render?.(mockItem.ratio);
    expect(ratioResult).toBe('35.00%');

    const sampleColumn = columns[2];
    const sampleResult = sampleColumn.render?.(mockItem.sample);
    const { container: sampleContainer } = render(<>{sampleResult}</>);
    expect(sampleContainer.textContent).toBe(mockItem.sample);

    const countColumn = columns[3];
    const countResult = countColumn.render?.(mockItem.count);
    expect(countResult).toBe(mockItem.count);
  });
});
