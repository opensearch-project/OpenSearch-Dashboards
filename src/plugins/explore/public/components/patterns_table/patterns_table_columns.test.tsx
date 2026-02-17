/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { patternsTableColumns } from './patterns_table_columns';
import { mockPatternItems } from './utils/patterns_table.stubs';
import { EuiBasicTableColumn } from '@elastic/eui';
import { PatternItem } from './patterns_table';

type ColumnWithRender<T> = EuiBasicTableColumn<T> & {
  field?: string;
  render?: (val: unknown, item?: T | undefined) => React.ReactNode;
};

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
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
    EuiToolTip: jest.fn().mockImplementation(({ children }) => <>{children}</>),
  };
});

const mockOpenPatternsTableFlyout = jest.fn();
const mockOnFilterForPattern = jest.fn();
const mockOnFilterOutPattern = jest.fn();

describe('patternsTableColumns', () => {
  let columns: Array<ColumnWithRender<PatternItem>>;

  beforeEach(() => {
    jest.clearAllMocks();
    columns = patternsTableColumns(
      mockOpenPatternsTableFlyout,
      mockOnFilterForPattern,
      mockOnFilterOutPattern
    ) as Array<ColumnWithRender<PatternItem>>;
  });

  it('should have the correct structure with four columns', () => {
    expect(columns).toHaveLength(4);

    expect(columns[0].field).toBeUndefined();
    expect(columns[1].field).toBe('ratio');
    expect(columns[2].field).toBe('count');
    expect(columns[3].field).toBeUndefined();
  });

  it('should use correct column headers', () => {
    expect(columns[1].name).toBe('Event ratio');
    expect(columns[2].name).toBe('Event count');
    expect(columns[3].name).toBe('Pattern');
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
      sampleColumn = columns[3];
    });

    it('should render sample values', () => {
      const mockItem: PatternItem = {
        sample: 'INFO [main] Starting application',
        ratio: 0.5,
        count: 100,
        pattern: 'INFO [main] <*>',
      };
      const result = sampleColumn.render?.(mockItem);

      const { container } = render(<>{result}</>);
      expect(container.textContent).toBe('INFO [main] Starting application');
    });

    it('should render highlightedSample when present', () => {
      const mockItem: PatternItem = {
        sample: 'INFO [main] Starting application',
        highlightedSample: React.createElement(
          React.Fragment,
          null,
          'INFO [main] ',
          React.createElement('span', { style: { color: '#40D' } }, 'Starting application')
        ),
        ratio: 0.5,
        count: 100,
        pattern: 'INFO [main] <*>',
      };
      const result = sampleColumn.render?.(mockItem);

      const { container } = render(<>{result}</>);
      expect(container.textContent).toBe('INFO [main] Starting application');
      expect(container.querySelector('span[style]')).toBeTruthy();
    });

    it('should handle empty sample values', () => {
      const mockItem: PatternItem = {
        sample: '',
        ratio: 0.5,
        count: 100,
        pattern: '',
      };
      const result = sampleColumn.render?.(mockItem);
      const { container } = render(<>{result}</>);
      expect(container.textContent).toBe('—');
    });

    it('should handle missing sample values', () => {
      const mockItem = {
        ratio: 0.5,
        count: 100,
        pattern: '',
      } as PatternItem;
      const result = sampleColumn.render?.(mockItem);
      const { container } = render(<>{result}</>);
      expect(container.textContent).toBe('—');
    });
  });

  describe('count column', () => {
    let countColumn: ColumnWithRender<PatternItem>;

    beforeEach(() => {
      countColumn = columns[2];
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

  describe('actions column', () => {
    let actionsColumn: ColumnWithRender<PatternItem>;

    beforeEach(() => {
      actionsColumn = columns[0];
    });

    it('should have the correct width', () => {
      expect(actionsColumn.width).toBe('100px');
    });

    it('should have the name Actions', () => {
      expect(actionsColumn.name).toBe('Actions');
    });

    it('should render three EuiButtonIcons (inspect, magnifyWithPlus, magnifyWithMinus)', () => {
      const mockItem = mockPatternItems[0];
      const result = actionsColumn.render?.(mockItem);

      const { container } = render(<>{result}</>);
      const buttons = container.querySelectorAll('[data-test-subj="euiButtonIcon"]');

      expect(buttons).toHaveLength(3);
      expect(buttons[0]?.getAttribute('data-icon-type')).toBe('inspect');
      expect(buttons[1]?.getAttribute('data-icon-type')).toBe('magnifyWithPlus');
      expect(buttons[2]?.getAttribute('data-icon-type')).toBe('magnifyWithMinus');
    });

    it('should call openPatternsTableFlyout with the record when inspect is clicked', () => {
      const mockItem = mockPatternItems[0];
      const result = actionsColumn.render?.(mockItem);

      const { container } = render(<>{result}</>);
      const buttons = container.querySelectorAll('[data-test-subj="euiButtonIcon"]');

      (buttons[0] as HTMLButtonElement)?.click();
      expect(mockOpenPatternsTableFlyout).toHaveBeenCalledTimes(1);
      expect(mockOpenPatternsTableFlyout).toHaveBeenCalledWith({
        pattern: mockItem.pattern,
        count: mockItem.count,
        sample: [mockItem.sample],
      });
    });

    it('should call onFilterForPattern when magnifyWithPlus is clicked', () => {
      const mockItem = mockPatternItems[0];
      const result = actionsColumn.render?.(mockItem);

      const { container } = render(<>{result}</>);
      const buttons = container.querySelectorAll('[data-test-subj="euiButtonIcon"]');

      (buttons[1] as HTMLButtonElement)?.click();
      expect(mockOnFilterForPattern).toHaveBeenCalledTimes(1);
      expect(mockOnFilterForPattern).toHaveBeenCalledWith(mockItem.pattern);
    });

    it('should call onFilterOutPattern when magnifyWithMinus is clicked', () => {
      const mockItem = mockPatternItems[0];
      const result = actionsColumn.render?.(mockItem);

      const { container } = render(<>{result}</>);
      const buttons = container.querySelectorAll('[data-test-subj="euiButtonIcon"]');

      (buttons[2] as HTMLButtonElement)?.click();
      expect(mockOnFilterOutPattern).toHaveBeenCalledTimes(1);
      expect(mockOnFilterOutPattern).toHaveBeenCalledWith(mockItem.pattern);
    });
  });

  it('should render all columns with mock data correctly', () => {
    const mockItem = mockPatternItems[0];

    const ratioColumn = columns[1];
    const ratioResult = ratioColumn.render?.(mockItem.ratio);
    expect(ratioResult).toBe('35.00%');

    const countColumn = columns[2];
    const countResult = countColumn.render?.(mockItem.count);
    expect(countResult).toBe(mockItem.count);

    const sampleColumn = columns[3];
    const sampleResult = sampleColumn.render?.(mockItem);
    const { container: sampleContainer } = render(<>{sampleResult}</>);
    expect(sampleContainer.textContent).toBe(mockItem.sample);
  });
});
