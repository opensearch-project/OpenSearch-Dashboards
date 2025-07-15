/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DiscoverResultsActionBar, DiscoverResultsActionBarProps } from './results_action_bar';
import { render, screen } from '@testing-library/react';
import { OpenSearchSearchHit } from '../../../../application/legacy/discover/application/doc_views/doc_views_types';
import userEvent from '@testing-library/user-event';

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
  searchContext: {} as any,
  services: {} as any,
};

describe('ResultsActionBar', () => {
  test('should render the action bar component', () => {
    render(<DiscoverResultsActionBar {...props} />);
    expect(screen.getByTestId('dscResultsActionBar')).toBeInTheDocument();
  });

  test('should render the hits counter component', () => {
    render(<DiscoverResultsActionBar {...props} />);
    expect(screen.getByTestId('dscResultCount')).toBeInTheDocument();
  });

  test('should render the download CSV button when dataset and rows are available', () => {
    render(<DiscoverResultsActionBar {...props} />);
    expect(screen.getByTestId('discoverDownloadCsvButton')).toBeInTheDocument();
    expect(screen.queryByTestId('saveAndAddButtonWithModal')).toBeInTheDocument();
  });

  test('should render inspector button and handle click events', async () => {
    const user = userEvent.setup();
    render(<DiscoverResultsActionBar {...props} rows={[]} />);

    const openInspectorButton = screen.queryByTestId('openInspectorButton');
    expect(openInspectorButton).toBeInTheDocument();

    await user.click(screen.getByTestId('openInspectorButton'));
    expect(mockInspectionHanlder).toHaveBeenCalled();
  });

  test('should hide the download CSV button when dataset is not provided', () => {
    render(<DiscoverResultsActionBar {...props} dataset={undefined} />);
    expect(screen.queryByTestId('discoverDownloadCsvButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saveAndAddButtonWithModal')).not.toBeInTheDocument();
  });

  test('should hide the download CSV button when no rows are available', () => {
    render(<DiscoverResultsActionBar {...props} rows={[]} />);
    expect(screen.queryByTestId('discoverDownloadCsvButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saveAndAddButtonWithModal')).not.toBeInTheDocument();
  });
});
