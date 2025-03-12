/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DiscoverResultsActionBar, DiscoverResultsActionBarProps } from './results_action_bar';
import { render, screen } from '@testing-library/react';

const props: DiscoverResultsActionBarProps = {
  hits: 5,
  showResetButton: false,
  resetQuery: jest.fn(),
  rows: [],
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
});
