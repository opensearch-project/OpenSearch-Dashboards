/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IntlProvider } from 'react-intl';
import { fireEvent, render, screen } from '@testing-library/react';
import { DiscoverDownloadCsv, DiscoverDownloadCsvProps } from './download_csv';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { IndexPattern } from '../../../../../data/common';

const mockRow1: OpenSearchSearchHit = {
  fields: {},
  sort: [],
  _source: {},
  _id: '1',
  _index: 'idx1',
  _type: '',
  _score: 1,
};
const mockRow2: OpenSearchSearchHit = {
  fields: {},
  sort: [],
  _source: {},
  _id: '2',
  _index: 'idx1',
  _score: 1,
  _type: '',
};
const mockRows = [mockRow1, mockRow2];
const mockIndexPattern = {} as IndexPattern;
const mockHits = 468;
const mockProps: DiscoverDownloadCsvProps = {
  indexPattern: mockIndexPattern,
  hits: mockHits,
  rows: mockRows,
};

const TestHarness = (props: Partial<DiscoverDownloadCsvProps>) => {
  return (
    <IntlProvider locale="en">
      <DiscoverDownloadCsv {...mockProps} {...props} />
    </IntlProvider>
  );
};

describe('DiscoverDownloadCsv', () => {
  it('renders the button when indexPattern is defined', () => {
    render(<TestHarness indexPattern={mockIndexPattern} />);
    expect(screen.getByTestId('dscDownloadCsvButton')).toBeInTheDocument();
  });

  it('does not render button when !indexPattern', () => {
    render(<TestHarness indexPattern={undefined} />);
    expect(screen.queryByTestId('dscDownloadCsvButton')).not.toBeInTheDocument();
  });

  it('popover is not opened as default', () => {
    render(<TestHarness />);
    expect(screen.queryByTestId('dscDownloadCsvPopoverContent')).not.toBeInTheDocument();
  });

  it('clicking on button opens popover', () => {
    render(<TestHarness />);
    fireEvent.click(screen.getByTestId('dscDownloadCsvButton'));
    expect(screen.getByTestId('dscDownloadCsvPopoverContent')).toBeInTheDocument();
  });

  it('both options are displayed correctly', () => {
    render(<TestHarness />);
    fireEvent.click(screen.getByTestId('dscDownloadCsvButton'));
    expect(
      screen.getByLabelText(`Visible (${mockRows.length.toLocaleString()})`)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(`Max available (${mockHits.toLocaleString()})`)
    ).toBeInTheDocument();
  });
});
