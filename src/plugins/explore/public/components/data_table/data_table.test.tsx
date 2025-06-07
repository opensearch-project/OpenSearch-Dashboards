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
          indexPattern={indexPatternMock}
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
});
