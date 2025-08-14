/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DiscoverResultsActionBar, DiscoverResultsActionBarProps } from './results_action_bar';
import { render, screen } from '@testing-library/react';
import { OpenSearchSearchHit } from '../../../../types/doc_views_types';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

const mockStore = configureMockStore([]);
const initialState = {
  ui: { activeTabId: 'logs' },
};
const store = mockStore(initialState);

jest.mock('../download_csv', () => ({
  DiscoverDownloadCsv: () => <div data-test-subj="discoverDownloadCsvButton" />,
}));
jest.mock('../../../visualizations/add_to_dashboard_button', () => ({
  SaveAndAddButtonWithModal: () => <div data-test-subj="saveAndAddButtonWithModal" />,
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

const mockInspectionHanlder = jest.fn();
const props: DiscoverResultsActionBarProps = {
  hits: 5,
  showResetButton: false,
  resetQuery: jest.fn(),
  rows: [mockRow1],
  dataset: {} as any,
  inspectionHanlder: mockInspectionHanlder,
};

describe('ResultsActionBar', () => {
  test('should render the action bar component', () => {
    render(
      <Provider store={store}>
        <DiscoverResultsActionBar {...props} />
      </Provider>
    );
    expect(screen.getByTestId('dscResultsActionBar')).toBeInTheDocument();
  });

  test('should render the hits counter component', () => {
    render(
      <Provider store={store}>
        <DiscoverResultsActionBar {...props} />
      </Provider>
    );
    expect(screen.getByTestId('dscResultCount')).toBeInTheDocument();
  });

  test('should render the download CSV button when dataset and rows are available', () => {
    render(
      <Provider store={store}>
        <DiscoverResultsActionBar {...props} />
      </Provider>
    );
    expect(screen.getByTestId('discoverDownloadCsvButton')).toBeInTheDocument();
    expect(screen.queryByTestId('saveAndAddButtonWithModal')).toBeInTheDocument();
  });

  test('should not render inspector button as it is commented out', () => {
    render(
      <Provider store={store}>
        <DiscoverResultsActionBar {...props} rows={[]} />
      </Provider>
    );

    const openInspectorButton = screen.queryByTestId('openInspectorButton');
    expect(openInspectorButton).not.toBeInTheDocument();
  });

  test('should hide the download CSV button and add to dashboard button when dataset is not provided', () => {
    render(
      <Provider store={store}>
        <DiscoverResultsActionBar {...props} dataset={undefined} />
      </Provider>
    );
    expect(screen.queryByTestId('discoverDownloadCsvButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saveAndAddButtonWithModal')).not.toBeInTheDocument();
  });

  test('should hide the download CSV button and add to dashboard button when no rows are available', () => {
    render(
      <Provider store={store}>
        <DiscoverResultsActionBar {...props} rows={[]} />
      </Provider>
    );
    expect(screen.queryByTestId('discoverDownloadCsvButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saveAndAddButtonWithModal')).not.toBeInTheDocument();
  });

  test('should hide add to dashboard button and export button if current tab is patterns', () => {
    const patternsStore = mockStore({
      ui: { activeTabId: 'explore_patterns_tab' },
      tab: { patterns: { patternsField: 'message' } },
    });
    render(
      <Provider store={patternsStore}>
        <DiscoverResultsActionBar {...props} />
      </Provider>
    );
    expect(screen.queryByTestId('discoverDownloadCsvButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saveAndAddButtonWithModal')).not.toBeInTheDocument();
  });

  test('should show export button but hide add to dashboard button for visualization tab', () => {
    const visualizationStore = mockStore({
      ui: { activeTabId: 'explore_visualization_tab' },
    });
    render(
      <Provider store={visualizationStore}>
        <DiscoverResultsActionBar {...props} />
      </Provider>
    );
    expect(screen.getByTestId('discoverDownloadCsvButton')).toBeInTheDocument();
    expect(screen.getByTestId('saveAndAddButtonWithModal')).toBeInTheDocument();
  });
});
