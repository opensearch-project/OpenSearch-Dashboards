/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { RecentQueriesTable } from './table';

// Todo: Mock recent queries data when redux implemententation is ready
// const mockQueries = [
//   {
//     id: '1',
//     query: { query: 'source=logs | where status=200', language: 'ppl' },
//     timeRange: { from: 'now-15m', to: 'now' },
//     time: new Date().toISOString(),
//   },
// ];

describe('RecentQueriesTable', () => {
  it('renders recent queries table', () => {
    render(
      // Wrap with any required providers or mocks here
      <RecentQueriesTable onClickRecentQuery={jest.fn()} isVisible={true} languageType="ppl" />
    );
    expect(screen.getAllByText('Recent query').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Last run').length).toBeGreaterThan(0);
  });
});
