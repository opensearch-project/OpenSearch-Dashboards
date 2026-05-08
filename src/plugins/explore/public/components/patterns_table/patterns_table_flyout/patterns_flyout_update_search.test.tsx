/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PatternsFlyoutUpdateSearch } from './patterns_flyout_update_search';
import { PatternsFlyoutProvider } from './patterns_flyout_context';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

const mockStore = createStore(
  (
    state = {
      query: { query: 'test query', language: 'PPL' },
      tab: {
        patterns: {
          patternsField: 'message',
          usingRegexPatterns: false,
        },
      },
    }
  ) => state
);

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <PatternsFlyoutProvider>{ui}</PatternsFlyoutProvider>
    </Provider>
  );
};

describe('PatternsFlyoutUpdateSearch', () => {
  it('should render the update search button', () => {
    renderWithProvider(<PatternsFlyoutUpdateSearch patternString="test pattern" />);

    expect(screen.getByRole('button', { name: /update search with pattern/i })).toBeInTheDocument();
    expect(screen.getByText('Update search')).toBeInTheDocument();
  });

  it('should render with the correct pattern string', () => {
    renderWithProvider(<PatternsFlyoutUpdateSearch patternString="custom pattern" />);

    expect(screen.getByRole('button', { name: /update search with pattern/i })).toBeInTheDocument();
  });
});
