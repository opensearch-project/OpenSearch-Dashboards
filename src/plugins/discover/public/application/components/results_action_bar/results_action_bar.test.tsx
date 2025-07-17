/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DiscoverResultsActionBar, DiscoverResultsActionBarProps } from './results_action_bar';
import { render, screen } from '@testing-library/react';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';

jest.mock('../download_csv', () => ({
  DiscoverDownloadCsv: () => <div data-test-subj="discoverDownloadCsvButton" />,
}));

const mockRow1: OpenSearchSearchHit<Record<string, number | string>> = {
  fields: {
    event_time: ['2022-12-31T08:14:42.801Z'],
    timestamp: ['2022-12-31T22:14:42.801Z'],
  },
  sort: [],
  _source: {
    bytes_transferred: 9268,
    category: 'Application',
    timestamp: '2022-12-31T22:14:42.801Z',
  },
  _id: '1',
  _index: 'idx1',
  _type: '',
  _score: 1,
};

const props: DiscoverResultsActionBarProps = {
  hits: 5,
  showResetButton: false,
  resetQuery: jest.fn(),
  rows: [mockRow1],
  // @ts-expect-error TS2322 TODO(ts-error): fixme
  isEnhancementsEnabled: true,
  indexPattern: {} as any,
};

describe('ResultsActionBar', () => {
  test('renders the component', () => {
    render(<DiscoverResultsActionBar {...props} />);
    expect(screen.getByTestId('dscResultsActionBar')).toBeInTheDocument();
  });

  test('renders the HitCounter component', () => {
    render(<DiscoverResultsActionBar {...props} />);
    expect(screen.getByTestId('dscResultCount')).toBeInTheDocument();
  });

  test('renders the DownloadCsv component when !!indexPattern and !!rows.length', () => {
    render(<DiscoverResultsActionBar {...props} />);
    expect(screen.getByTestId('discoverDownloadCsvButton')).toBeInTheDocument();
  });

  test('hides the DownloadCsv component when !indexPattern', () => {
    render(<DiscoverResultsActionBar {...props} indexPattern={undefined} />);
    expect(screen.queryByTestId('discoverDownloadCsvButton')).not.toBeInTheDocument();
  });

  test('hides the DownloadCsv component when !rows.length', () => {
    render(<DiscoverResultsActionBar {...props} rows={[]} />);
    expect(screen.queryByTestId('discoverDownloadCsvButton')).not.toBeInTheDocument();
  });
});
