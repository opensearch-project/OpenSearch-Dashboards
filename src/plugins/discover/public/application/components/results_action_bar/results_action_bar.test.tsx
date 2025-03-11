/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DiscoverResultsActionBar, DiscoverResultsActionBarProps } from './results_action_bar';
import { render, screen } from '@testing-library/react';

jest.mock('../discover_options/discover_options', () => ({
  DiscoverOptions: () => <div data-test-subj="discoverOptionsButton" />,
}));

const props: DiscoverResultsActionBarProps = {
  hits: 5,
  showResetButton: false,
  resetQuery: jest.fn(),
  rows: [],
  isEnhancementsEnabled: true,
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

  test('does not render the DiscoverOptions component when isEnhancementEnabled', () => {
    render(<DiscoverResultsActionBar {...props} isEnhancementsEnabled={true} />);
    expect(screen.queryByTestId('discoverOptionsButton')).toBeFalsy();
  });

  test('renders the DiscoverOptions component when !isEnhancementEnabled', () => {
    render(<DiscoverResultsActionBar {...props} isEnhancementsEnabled={false} />);
    expect(screen.getByTestId('discoverOptionsButton')).toBeInTheDocument();
  });
});
