/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IntlProvider } from 'react-intl';
import { act, render, waitFor, screen } from '@testing-library/react';
import { DefaultDiscoverTable } from './default_discover_table';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { coreMock } from '../../../../../../core/public/mocks';
import { getStubIndexPattern } from '../../../../../data/public/test_utils';

jest.mock('../../../opensearch_dashboards_services', () => ({
  getServices: jest.fn().mockReturnValue({
    uiSettings: {
      get: jest.fn().mockImplementation((key) => {
        switch (key) {
          case 'discover:sampleSize':
            return 100;
          case 'shortDots:enable':
            return true;
          case 'doc_table:hideTimeColumn':
            return false;
          case 'discover:sort:defaultOrder':
            return 'desc';
          default:
            return null;
        }
      }),
    },
  }),
}));

describe('DefaultDiscoverTable', () => {
  const indexPattern = getStubIndexPattern(
    'test-index-pattern',
    (cfg) => cfg,
    '@timestamp',
    [
      { name: 'textField', type: 'text' },
      { name: 'longField', type: 'long' },
      { name: '@timestamp', type: 'date' },
    ],
    coreMock.createSetup()
  );

  // Generate 50 hits with sample fields
  const hits = [...Array(100).keys()].map((key) => {
    return {
      _id: key.toString(),
      fields: {
        textField: `value${key}`,
        longField: key,
        '@timestamp': new Date((1720000000 + key) * 1000),
      },
    };
  });

  const getDefaultDiscoverTable = (hitsOverride?: OpenSearchSearchHit[]) => (
    <IntlProvider locale="en">
      <DefaultDiscoverTable
        columns={['textField', 'longField', '@timestamp']}
        rows={(hitsOverride ?? hits) as OpenSearchSearchHit[]}
        indexPattern={indexPattern}
        sort={[]}
        onSort={jest.fn()}
        onRemoveColumn={jest.fn()}
        onMoveColumn={jest.fn()}
        onAddColumn={jest.fn()}
        onFilter={jest.fn()}
      />
    </IntlProvider>
  );

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
    const { container } = render(getDefaultDiscoverTable());

    const tableRows = container.querySelectorAll('tbody tr');
    expect(tableRows.length).toBe(10);
  });

  it('should load more rows when scrolling to the bottom', async () => {
    const { container } = render(getDefaultDiscoverTable());

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
    const { container } = render(getDefaultDiscoverTable());

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
    const truncHits = hits.slice(0, 35) as OpenSearchSearchHit[];
    const { container, rerender } = render(getDefaultDiscoverTable(truncHits));

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
    rerender(getDefaultDiscoverTable(hits as OpenSearchSearchHit[]));

    await waitFor(() => {
      const progressSentinel = container.querySelector(
        'div[data-test-subj="discoverRenderedRowsProgress"]'
      );
      expect(progressSentinel).toBeInTheDocument();
    });
  });
});
