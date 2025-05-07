/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IntlProvider } from 'react-intl';
import { fireEvent, render, screen } from '@testing-library/react';
import { DiscoverDownloadCsv, DiscoverDownloadCsvProps } from './download_csv';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { IndexPattern } from '../../../../../../../../data/common';
import { useDiscoverDownloadCsv } from './use_download_csv';
import { DownloadCsvFormId } from './constants';

jest.mock('./use_download_csv_toasts', () => ({
  useDiscoverDownloadCsvToasts: () => ({
    onSuccess: jest.fn(),
    onError: jest.fn(),
    onLoading: jest.fn(),
  }),
}));

jest.mock('./use_download_csv', () => ({
  useDiscoverDownloadCsv: jest.fn(),
}));

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
const mockDownloadCsvForOption = jest.fn();

const TestHarness = (props: Partial<DiscoverDownloadCsvProps>) => {
  return (
    <IntlProvider locale="en">
      <DiscoverDownloadCsv {...mockProps} {...props} />
    </IntlProvider>
  );
};

describe('DiscoverDownloadCsv', () => {
  afterEach(() => {
    (useDiscoverDownloadCsv as jest.MockedFunction<any>).mockClear();
    mockDownloadCsvForOption.mockClear();
  });

  describe('useDiscoverDownloadCsv().isLoading === false', () => {
    beforeEach(() => {
      (useDiscoverDownloadCsv as jest.MockedFunction<any>).mockImplementation(() => ({
        isLoading: false,
        downloadCsvForOption: mockDownloadCsvForOption,
      }));
    });

    it('passes correct props to useDiscoverDownloadCsv', () => {
      render(<TestHarness indexPattern={mockIndexPattern} />);
      expect(useDiscoverDownloadCsv).toHaveBeenCalledWith(
        expect.objectContaining({ rows: mockRows, hits: mockHits, indexPattern: mockIndexPattern })
      );
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

    it('Clicking on visible option calls downloadCsvForOption correctly', () => {
      render(<TestHarness />);
      fireEvent.click(screen.getByTestId('dscDownloadCsvButton'));
      fireEvent.click(screen.getByLabelText(`Visible (${mockRows.length.toLocaleString()})`));
      fireEvent.click(screen.getByTestId('dscDownloadCsvSubmit'));
      expect(mockDownloadCsvForOption).toHaveBeenCalledWith(DownloadCsvFormId.Visible);
    });

    it('Clicking on max option calls downloadCsvForOption correctly', () => {
      render(<TestHarness />);
      fireEvent.click(screen.getByTestId('dscDownloadCsvButton'));
      fireEvent.click(screen.getByLabelText(`Max available (${mockHits.toLocaleString()})`));
      fireEvent.click(screen.getByTestId('dscDownloadCsvSubmit'));
      expect(mockDownloadCsvForOption).toHaveBeenCalledWith(DownloadCsvFormId.Max);
    });
  });

  describe('useDiscoverDownloadCsv().isLoading === true', () => {
    beforeEach(() => {
      (useDiscoverDownloadCsv as jest.MockedFunction<any>).mockImplementation(() => ({
        isLoading: true,
        downloadCsvForOption: mockDownloadCsvForOption,
      }));
    });

    it('clicking on download CSV button does nothing', () => {
      render(<TestHarness indexPattern={mockIndexPattern} />);
      expect(screen.getByTestId('dscDownloadCsvButton')).toBeDisabled();
      fireEvent.click(screen.getByTestId('dscDownloadCsvButton'));
      expect(screen.queryByTestId('dscDownloadCsvPopoverContent')).not.toBeInTheDocument();
    });
  });
});
