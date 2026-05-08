/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { StatisticsTab } from './statistics_tab';
import { EXPLORE_ACTION_BAR_SLOT_ID } from './tabs';

const mockUseTabResults = jest.fn();

jest.mock('./action_bar/action_bar', () => ({
  ActionBar: () => <div data-testid="mocked-action-bar" />,
}));

jest.mock('../../application/utils/hooks/use_tab_results', () => ({
  useTabResults: () => mockUseTabResults(),
}));

const createResults = (
  hits: Array<Record<string, any>> = [],
  fieldSchema: Array<{ name: string }> = []
) => ({
  hits: {
    hits: hits.map((source) => ({ _source: source })),
  },
  fieldSchema,
});

describe('StatisticsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTabResults.mockReturnValue({ results: null, status: undefined });
  });

  const renderWithSlot = (ui: React.ReactElement = <StatisticsTab />) => {
    return render(
      <div>
        <div id={EXPLORE_ACTION_BAR_SLOT_ID} />
        {ui}
      </div>
    );
  };

  it('renders the main container with correct class names', () => {
    const { container } = renderWithSlot();

    expect(container.querySelector('.explore-statistic-tab')).toBeInTheDocument();
    expect(container.querySelector('.tab-container')).toBeInTheDocument();
    expect(container.querySelector('.exploreStatisticTable')).toBeInTheDocument();
  });

  it('renders ActionBar into the portal slot', () => {
    const { container } = renderWithSlot();

    const slot = container.querySelector(`#${EXPLORE_ACTION_BAR_SLOT_ID}`);
    expect(slot).toBeInTheDocument();
    expect(slot!.querySelector('[data-testid="mocked-action-bar"]')).toBeInTheDocument();
  });

  it('renders columns from fieldSchema and row data from hits', () => {
    mockUseTabResults.mockReturnValue({
      results: createResults(
        [
          { city: 'Seattle', temp: 55 },
          { city: 'Portland', temp: 50 },
        ],
        [{ name: 'city' }, { name: 'temp' }]
      ),
    });

    renderWithSlot();

    expect(screen.getByText('Seattle')).toBeInTheDocument();
    expect(screen.getByText('Portland')).toBeInTheDocument();
    expect(screen.getByText('55')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('skips schema entries with falsy name', () => {
    mockUseTabResults.mockReturnValue({
      results: createResults([{ valid: 'data' }], [{ name: 'valid' }, { name: '' }]),
    });

    renderWithSlot();

    // 'valid' should appear as both column header and cell value
    expect(screen.getAllByText('valid').length).toBeGreaterThanOrEqual(1);
    // 'data' should appear as cell value, confirming the valid column rendered
    expect(screen.getByText('data')).toBeInTheDocument();
  });

  it('expands a row to show JSON details on click', () => {
    mockUseTabResults.mockReturnValue({
      results: createResults([{ field: 'value1' }], [{ name: 'field' }]),
    });

    renderWithSlot();

    fireEvent.click(screen.getByLabelText('Expand'));

    expect(screen.getByLabelText('Collapse')).toBeInTheDocument();
    expect(screen.getByText(/"field": "value1"/)).toBeInTheDocument();
  });

  it('collapses an expanded row on second click', () => {
    mockUseTabResults.mockReturnValue({
      results: createResults([{ field: 'value1' }], [{ name: 'field' }]),
    });

    renderWithSlot();

    fireEvent.click(screen.getByLabelText('Expand'));
    expect(screen.getByLabelText('Collapse')).toBeInTheDocument();
    expect(screen.queryByText(/"field": "value1"/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Collapse'));
    expect(screen.getByLabelText('Expand')).toBeInTheDocument();
    expect(screen.queryByText(/"field": "value1"/)).not.toBeInTheDocument();
  });

  it('excludes the synthetic id field from expanded JSON', () => {
    mockUseTabResults.mockReturnValue({
      results: createResults([{ name: 'Alice', age: 30 }], [{ name: 'name' }, { name: 'age' }]),
    });

    renderWithSlot();

    fireEvent.click(screen.getByLabelText('Expand'));

    expect(screen.getByText(/"name": "Alice"/)).toBeInTheDocument();
    expect(screen.queryByText(/"id":/)).not.toBeInTheDocument();
  });

  it('toggles expansion when clicking a row', () => {
    mockUseTabResults.mockReturnValue({
      results: createResults([{ field: 'value1' }], [{ name: 'field' }]),
    });

    renderWithSlot();

    // Click the row itself (not the expand button)
    fireEvent.click(screen.getByText('value1'));

    expect(screen.getByLabelText('Collapse')).toBeInTheDocument();
    expect(screen.getByText(/"field": "value1"/)).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(screen.getByText('value1'));

    expect(screen.getByLabelText('Expand')).toBeInTheDocument();
    expect(screen.queryByText(/"field": "value1"/)).not.toBeInTheDocument();
  });

  it('supports multiple rows expanded simultaneously', () => {
    mockUseTabResults.mockReturnValue({
      results: createResults([{ field: 'value1' }, { field: 'value2' }], [{ name: 'field' }]),
    });

    renderWithSlot();

    const expandButtons = screen.getAllByLabelText('Expand');
    fireEvent.click(expandButtons[0]);
    fireEvent.click(screen.getAllByLabelText('Expand')[0]);

    expect(screen.getAllByLabelText('Collapse')).toHaveLength(2);
  });
});
