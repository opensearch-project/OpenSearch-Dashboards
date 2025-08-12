/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatternsTable, PatternItem } from './patterns_table';
import { mockPatternItems, generateLargeDataset } from './utils/patterns_table.stubs';

describe('PatternsTable', () => {
  // Standard test cases
  describe('Standard scenarios', () => {
    it('should render with default items', () => {
      const { container } = render(<PatternsTable items={mockPatternItems} />);

      // Check if table is rendered
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();

      // Check if all items are rendered
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toEqual(mockPatternItems.length);

      // Check if column headers are rendered
      expect(screen.getAllByText('Event ratio')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Pattern Sample Log')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Event count')[0]).toBeInTheDocument();
    });

    it('should render empty state when no items are provided', () => {
      const { container } = render(<PatternsTable items={[]} />);

      // Check if table is rendered
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();

      // Check if empty message is displayed
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('should render a single item correctly', () => {
      const singleItem = [mockPatternItems[0]];
      const { container } = render(<PatternsTable items={singleItem} />);

      // Check if table is rendered with one row
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(1);

      // Check if the item data is displayed correctly
      expect(screen.getByText('35.00%')).toBeInTheDocument();
      expect(screen.getByText('INFO [main] Starting application')).toBeInTheDocument();
      expect(screen.getByText('350')).toBeInTheDocument();
    });

    it('should handle pagination correctly', async () => {
      const user = userEvent.setup();
      const largeDataset = generateLargeDataset(mockPatternItems, 30);

      const { container } = render(<PatternsTable items={largeDataset} />);

      // Check initial page
      const initialRows = container.querySelectorAll('tbody tr');
      expect(initialRows.length).toBe(10); // Default page size

      // Find and click next page button
      const nextButton = container.querySelector('[data-test-subj="pagination-button-next"]');
      expect(nextButton).toBeInTheDocument();

      await user.click(nextButton!);

      // Check if new page is loaded
      const newRows = container.querySelectorAll('tbody tr');
      expect(newRows.length).toBe(10);

      // The content should be different from the first page
      const firstRowText = initialRows[0].textContent;
      const newFirstRowText = newRows[0].textContent;
      expect(firstRowText).not.toBe(newFirstRowText);
    });
  });

  // Edge case test cases
  describe('Edge cases', () => {
    it('should handle NaN values correctly', () => {
      const nanItems: PatternItem[] = [
        {
          sample: 'ERROR [calculation] Division by zero',
          ratio: NaN,
          count: 42,
        },
        {
          sample: 'WARN [calculation] Invalid operation',
          ratio: 0.15,
          count: NaN,
        },
      ];

      const { container } = render(<PatternsTable items={nanItems} />);

      // Check if table is rendered
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);

      // Check if NaN values are displayed as '—'
      const cells = container.querySelectorAll('td');

      // First row: NaN ratio should be displayed as '—'
      expect(cells[0].textContent).toContain('—');

      // Second row: NaN count should be displayed as '—'
      expect(cells[5].textContent).toContain('—');
    });

    it('should handle Infinity values correctly', () => {
      const infinityItems: PatternItem[] = [
        {
          sample: 'ERROR [overflow] Maximum value exceeded',
          ratio: Infinity,
          count: 75,
        },
        {
          sample: 'WARN [underflow] Minimum value exceeded',
          ratio: 0.08,
          count: Infinity,
        },
      ];

      const { container } = render(<PatternsTable items={infinityItems} />);

      // Check if table is rendered
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);

      // Check if Infinity values are displayed as '—'
      const cells = container.querySelectorAll('td');

      // First row: Infinity ratio should be displayed as '—'
      expect(cells[0].textContent).toContain('—');

      // Second row: Infinity count should be displayed as '—'
      expect(cells[5].textContent).toContain('—');
    });

    it('should handle empty pattern strings correctly', () => {
      const emptyPatternItems: PatternItem[] = [
        {
          sample: '',
          ratio: 0.15,
          count: 150,
        },
        {
          sample: (null as unknown) as string,
          ratio: 0.1,
          count: 100,
        },
        {
          sample: (undefined as unknown) as string,
          ratio: 0.05,
          count: 50,
        },
      ];

      const { container } = render(<PatternsTable items={emptyPatternItems} />);

      // Check if table is rendered
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(3);

      // Check if empty patterns are displayed as '—'
      const cells = container.querySelectorAll('td');

      // Empty string pattern should be displayed as '—'
      expect(cells[1].querySelector('span')?.textContent).toContain('—');

      // Null pattern should be displayed as '—'
      expect(cells[4].querySelector('span')?.textContent).toContain('—');

      // Undefined pattern should be displayed as '—'
      expect(cells[7].querySelector('span')?.textContent).toContain('—');
    });

    it('should handle extremely long pattern strings correctly', () => {
      const longPatternItems: PatternItem[] = [
        {
          sample:
            'INFO [main] ' +
            'Very long log message that exceeds typical display width. '.repeat(10),
          ratio: 0.35,
          count: 350,
        },
      ];

      const { container } = render(<PatternsTable items={longPatternItems} />);

      // Check if table is rendered
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(1);

      // Check if long pattern is displayed (not truncated by the test)
      const patternCell = container.querySelectorAll('td')[1];
      expect(patternCell.textContent).toContain('INFO [main]');
      expect(patternCell.textContent).toContain('Very long log message');
    });
  });
});
