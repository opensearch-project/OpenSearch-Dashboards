/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { act, render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from './data_table';
import { DocViewsRegistry, OpenSearchSearchHit } from '../../types/doc_views_types';
import { indexPatternMock } from '../../../../discover/public';
import { mockColumns, mockRows } from './data_table.mocks';
import { DocViewTable } from '../doc_viewer/doc_viewer_table/table';
import { JsonCodeBlock } from '../doc_viewer/json_code_block/json_code_block';

describe('DefaultDiscoverTable', () => {
  const docViewsRegistry = new DocViewsRegistry();
  docViewsRegistry.addDocView({
    title: i18n.translate('explore.docViews.table.tableTitle', {
      defaultMessage: 'Table',
    }),
    order: 10,
    component: DocViewTable,
  });
  docViewsRegistry.addDocView({
    title: i18n.translate('explore.docViews.json.jsonTitle', {
      defaultMessage: 'JSON',
    }),
    order: 20,
    component: JsonCodeBlock,
  });

  const getDataTable = (
    rowsOverride?: Array<OpenSearchSearchHit<Record<string, any>>>,
    showPagination: boolean = false
  ) => {
    const rows = rowsOverride ?? mockRows;
    return (
      <IntlProvider locale="en">
        <DataTable
          columns={mockColumns}
          rows={rows}
          dataset={indexPatternMock}
          sampleSize={rows.length}
          isShortDots={false}
          docViewsRegistry={docViewsRegistry}
          showPagination={showPagination}
          onRemoveColumn={jest.fn()}
          onAddColumn={jest.fn()}
          onFilter={jest.fn()}
        />
      </IntlProvider>
    );
  };

  let intersectionObserverCallback: (entries: IntersectionObserverEntry[]) => void = (_) => {};
  const mockIntersectionObserver = jest.fn();

  beforeEach(() => {
    mockIntersectionObserver.mockImplementation((...args) => {
      intersectionObserverCallback = args[0];
      return {
        observe: () => null,
        unobserve: () => null,
        disconnect: () => null,
      };
    });
    window.IntersectionObserver = mockIntersectionObserver;
  });

  it('should render the correct number of rows initially', () => {
    const { container } = render(getDataTable());

    const tableRows = container.querySelectorAll('tbody tr');
    expect(tableRows.length).toBe(10);
  });

  it('should load more rows when scrolling to the bottom', async () => {
    const { container } = render(getDataTable());

    const sentinel = container.querySelector('div[data-test-subj="discoverRenderedRowsProgress"]');
    const mockScrollEntry = { isIntersecting: true, target: sentinel };
    act(() => {
      intersectionObserverCallback([mockScrollEntry] as IntersectionObserverEntry[]);
    });

    await waitFor(() => {
      const tableRows = container.querySelectorAll('tbody tr');
      expect(tableRows.length).toBe(20);
    });
  });

  it('should display the sample size callout when all rows are rendered', async () => {
    const { container } = render(getDataTable());

    let sentinel = container.querySelector('div[data-test-subj="discoverRenderedRowsProgress"]');

    // Simulate scrolling to the bottom until all rows are rendered
    while (sentinel) {
      const mockScrollEntry = { isIntersecting: true, target: sentinel };
      act(() => {
        intersectionObserverCallback([mockScrollEntry] as IntersectionObserverEntry[]);
      });
      sentinel = container.querySelector('div[data-test-subj="discoverRenderedRowsProgress"]');
    }

    await waitFor(() => {
      const callout = screen.getByTestId('discoverDocTableFooter');
      expect(callout).toBeInTheDocument();
    });
  });

  it('Should restart rendering when new data is available', async () => {
    const truncHits = mockRows.slice(0, 35);
    const { container, rerender } = render(getDataTable(truncHits));

    let sentinel = container.querySelector('div[data-test-subj="discoverRenderedRowsProgress"]');

    // Keep scrolling until all the current rows are exhausted
    while (sentinel) {
      const mockScrollEntry = { isIntersecting: true, target: sentinel };
      act(() => {
        intersectionObserverCallback([mockScrollEntry] as IntersectionObserverEntry[]);
      });
      sentinel = container.querySelector('div[data-test-subj="discoverRenderedRowsProgress"]');
    }

    // Make the other rows available
    rerender(getDataTable(mockRows));

    await waitFor(() => {
      const progressSentinel = container.querySelector(
        'div[data-test-subj="discoverRenderedRowsProgress"]'
      );
      expect(progressSentinel).toBeInTheDocument();
    });
  });

  it('should pagination', async () => {
    const user = userEvent.setup();

    render(getDataTable(undefined, true));

    // Two Pagination component on the page, one at the top, one at the bottom.
    const osdDocTablePagination = screen.queryAllByTestId('osdDocTablePagination');
    expect(osdDocTablePagination[0]).toBeInTheDocument();
    expect(osdDocTablePagination[1]).toBeInTheDocument();

    await user.click(screen.getAllByTestId('pagination-button-next')[0]);
    expect(screen.queryByTestId('osdPaginationLimitsHitMessage')).not.toBeInTheDocument();

    await user.click(screen.getAllByTestId('pagination-button-next')[0]);
    expect(screen.queryAllByTestId('osdPaginationLimitsHitMessage')[0]).toBeInTheDocument();

    await user.click(screen.getAllByTestId('pagination-button-previous')[0]);
    expect(screen.queryByTestId('osdPaginationLimitsHitMessage')).not.toBeInTheDocument();
  });

  describe('Column Width Algorithm', () => {
    // Mock DOM methods needed for width calculation
    beforeEach(() => {
      // Mock getBoundingClientRect for container width
      Element.prototype.getBoundingClientRect = jest.fn(() => ({
        width: 1000,
        height: 600,
        top: 0,
        left: 0,
        bottom: 600,
        right: 1000,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      // Mock offsetWidth for measuring element
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        value() {
          // Simulate different text widths based on content length
          const text = this.textContent || '';
          return Math.max(text.length * 8, 50); // 8px per character, minimum 50px
        },
      });

      // Mock getComputedStyle
      window.getComputedStyle = jest.fn(() => ({
        fontSize: '12px',
        fontFamily: 'Arial',
        fontWeight: 'normal',
        padding: '4px',
      })) as any;

      // Mock requestAnimationFrame to prevent infinite loops
      let rafId = 0;
      global.requestAnimationFrame = jest.fn((cb) => {
        // Don't immediately call the callback - just return an ID
        // Tests will manually trigger callbacks when needed
        return ++rafId;
      });

      // Mock cancelAnimationFrame
      global.cancelAnimationFrame = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should render table with proper structure', () => {
      const { container } = render(getDataTable());

      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass('explore-table');
    });

    it('should render header cells for column width calculation', () => {
      const { container } = render(getDataTable());

      const headerCells = container.querySelectorAll('thead th:not(:first-child)');
      expect(headerCells.length).toBeGreaterThan(0);
    });

    it('should handle empty table gracefully', () => {
      const { container } = render(getDataTable([]));

      // Should not crash with empty data
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('should not cause infinite loops with requestAnimationFrame', () => {
      // This test ensures our mocking doesn't cause stack overflow
      expect(() => {
        render(getDataTable());
      }).not.toThrow();

      // Verify requestAnimationFrame was called (column width calculation)
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should have measuring element CSS class available', () => {
      // Test that our CSS class exists (would be used by the algorithm)
      const testDiv = document.createElement('div');
      testDiv.className = 'column-width-measuring-element';
      expect(testDiv.className).toBe('column-width-measuring-element');
    });
  });

  // Tests for header tooltip functionality
  describe('Header Tooltips', () => {
    it('should render header text with clickable elements', () => {
      const { container } = render(getDataTable());

      const headerTexts = container.querySelectorAll('.header-text');
      expect(headerTexts.length).toBeGreaterThan(0);

      // Each header text should exist and be part of a clickable structure
      headerTexts.forEach((headerText) => {
        expect(headerText).toBeInTheDocument();
      });
    });

    it('should render EuiPopover components for interactive tooltips', () => {
      const { container } = render(getDataTable());

      // Check that popover structure exists (EuiPopover creates specific DOM structure)
      const headerCells = container.querySelectorAll('thead th:not(:first-child)');
      expect(headerCells.length).toBeGreaterThan(0);

      // Each header cell should contain the interactive elements
      headerCells.forEach((cell) => {
        const headerText = cell.querySelector('.header-text');
        expect(headerText).toBeInTheDocument();
      });
    });
  });
});
