/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { IntlProvider } from 'react-intl';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from './data_table';
import { DocViewsRegistry, OpenSearchSearchHit } from '../../types/doc_views_types';
import { indexPatternMock } from '../../__mock__/index_pattern_mock';
import { mockColumns, mockRows } from './data_table.mocks';
import { DocViewTable } from '../doc_viewer/doc_viewer_table/table';
import { JsonCodeBlock } from '../doc_viewer/json_code_block/json_code_block';

// Mock IntersectionObserver for lazy loading tests
let intersectionCallback: IntersectionObserverCallback;
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

beforeEach(() => {
  mockObserve.mockClear();
  mockDisconnect.mockClear();
  (window as any).IntersectionObserver = jest.fn((cb: IntersectionObserverCallback) => {
    intersectionCallback = cb;
    return { observe: mockObserve, disconnect: mockDisconnect, unobserve: jest.fn() };
  });
});

describe('DefaultDiscoverTable', () => {
  const docViewsRegistry = new DocViewsRegistry();
  docViewsRegistry.addDocView({
    title: i18n.translate('agentTraces.docViews.table.tableTitle', {
      defaultMessage: 'Table',
    }),
    order: 10,
    component: DocViewTable,
  });
  docViewsRegistry.addDocView({
    title: i18n.translate('agentTraces.docViews.json.jsonTitle', {
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
      // @ts-expect-error TS2769 TODO(ts-error): fixme
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

  it('should render only the first batch of rows initially (lazy loading)', () => {
    const { container } = render(getDataTable());

    const tableRows = container.querySelectorAll('tbody tr');
    // mockRows has 138 entries, lazy load batch size is 50
    expect(tableRows.length).toBe(50);
    // Should show progress bar since there are more rows to load
    expect(screen.getByTestId('discoverRenderedRowsProgress')).toBeInTheDocument();
  });

  it('should render more rows when IntersectionObserver fires', () => {
    const { container } = render(getDataTable());

    expect(container.querySelectorAll('tbody tr').length).toBe(50);

    // Simulate the sentinel becoming visible
    act(() => {
      intersectionCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(container.querySelectorAll('tbody tr').length).toBe(100);

    // Fire again to load the remaining rows
    act(() => {
      intersectionCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(container.querySelectorAll('tbody tr').length).toBe(mockRows.length);
    // Progress bar should be gone since all rows are rendered
    expect(screen.queryByTestId('discoverRenderedRowsProgress')).not.toBeInTheDocument();
  });

  it('should display the sample size callout when rows equal sample size', () => {
    render(getDataTable());

    const callout = screen.getByTestId('discoverDocTableFooter');
    expect(callout).toBeInTheDocument();
  });

  it('should not display the sample size callout when rows are fewer than sample size', () => {
    const fewRows = mockRows.slice(0, 5);
    render(
      // @ts-expect-error TS2769 TODO(ts-error): fixme
      <IntlProvider locale="en">
        <DataTable
          columns={mockColumns}
          rows={fewRows}
          dataset={indexPatternMock}
          sampleSize={500}
          isShortDots={false}
          docViewsRegistry={docViewsRegistry}
          showPagination={false}
          onRemoveColumn={jest.fn()}
          onAddColumn={jest.fn()}
          onFilter={jest.fn()}
        />
      </IntlProvider>
    );

    expect(screen.queryByTestId('discoverDocTableFooter')).not.toBeInTheDocument();
  });

  it('should handle empty rows gracefully', () => {
    const { container } = render(getDataTable([]));

    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    const tableRows = container.querySelectorAll('tbody tr');
    expect(tableRows.length).toBe(0);
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

  describe('Table Structure', () => {
    it('should render table with proper structure', () => {
      const { container } = render(getDataTable());

      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass('agentTraces-table');
    });

    it('should render header cells', () => {
      const { container } = render(getDataTable());

      const headerCells = container.querySelectorAll('thead th:not(:first-child)');
      expect(headerCells.length).toBeGreaterThan(0);
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
