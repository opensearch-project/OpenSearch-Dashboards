/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { DiscoverNoResults } from './no_results';

const makeDeps = () => {
  const savedQuery = ({
    findSavedQueries: jest.fn().mockResolvedValue({ queries: [] }),
  } as unknown) as any;
  const queryString = ({
    getLanguageService: jest.fn().mockReturnValue({ getLanguage: () => undefined }),
    getDatasetService: jest.fn().mockReturnValue({ getType: () => undefined }),
  } as unknown) as any;
  return { queryString, savedQuery };
};

describe('DiscoverNoResults PromQL branch', () => {
  it('renders MetricsEmptyState with "No metrics found" when the query language is PROMQL', () => {
    const { queryString, savedQuery } = makeDeps();

    render(
      <DiscoverNoResults
        queryString={queryString}
        savedQuery={savedQuery}
        query={{ query: '', language: 'PROMQL' } as any}
      />
    );

    expect(screen.getByRole('heading', { level: 2, name: 'No metrics found' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'The selected Prometheus data source returned no metrics for the current time range. Try adjusting the time range or verify the data source is scraping targets.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Sample PromQL queries')).toBeInTheDocument();
    expect(screen.queryByText(/Try selecting a different data source/)).not.toBeInTheDocument();
  });

  it('renders the generic "No Results" prompt for non-PROMQL languages', async () => {
    const { queryString, savedQuery } = makeDeps();

    render(
      <DiscoverNoResults
        queryString={queryString}
        savedQuery={savedQuery}
        query={{ query: '', language: 'PPL' } as any}
      />
    );

    expect(
      await screen.findByRole('heading', { level: 2, name: 'No Results' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Try selecting a different data source/)).toBeInTheDocument();
    expect(screen.queryByText('Sample PromQL queries')).not.toBeInTheDocument();
  });

  it('falls back to the generic prompt when query is undefined', async () => {
    const { queryString, savedQuery } = makeDeps();

    render(
      <DiscoverNoResults queryString={queryString} savedQuery={savedQuery} query={undefined} />
    );

    expect(
      await screen.findByRole('heading', { level: 2, name: 'No Results' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Sample PromQL queries')).not.toBeInTheDocument();
  });
});
