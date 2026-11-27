/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { DiscoverUninitialized } from './uninitialized';

describe('DiscoverUninitialized', () => {
  it('shows the default copy and "Refresh data" for a dataset that runs on its own', () => {
    const onRefresh = jest.fn();
    render(<DiscoverUninitialized onRefresh={onRefresh} />);
    expect(
      screen.getByText(
        'Write a query, add some filters, or simply hit Refresh to retrieve results for the current query.'
      )
    ).toBeInTheDocument();
    const button = screen.getByTestId('discover-refreshDataButton');
    expect(button).toHaveTextContent('Refresh data');
    fireEvent.click(button);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('asks to write a query and select Update when the dataset requires an explicit Run', () => {
    const onRefresh = jest.fn();
    render(<DiscoverUninitialized onRefresh={onRefresh} requiresExplicitRun />);
    expect(
      screen.getByText(
        'Write a query, then select Update. This data source runs queries only when you start them.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/simply hit Refresh/)).not.toBeInTheDocument();
    const button = screen.getByTestId('discover-refreshDataButton');
    expect(button).toHaveTextContent('Update');
    expect(button).not.toHaveTextContent('Refresh data');
    fireEvent.click(button);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
