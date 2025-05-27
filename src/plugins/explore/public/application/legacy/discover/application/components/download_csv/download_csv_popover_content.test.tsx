/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IntlProvider } from 'react-intl';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  DiscoverDownloadCsvPopoverContent,
  DiscoverDownloadCsvPopoverContentProps,
} from './download_csv_popover_content';
import { DownloadCsvFormId, MAX_DOWNLOAD_CSV_COUNT } from './constants';

const mockDownloadForOption = jest.fn();
const mockProps: DiscoverDownloadCsvPopoverContentProps = {
  downloadForOption: mockDownloadForOption,
  hitsCount: 800,
  rowsCount: 500,
};
const mockVisibleLabel = `Visible (${mockProps.rowsCount})`;
const mockMaxLabel = `Max available (${mockProps.hitsCount})`;

const TestHarness = (props: Partial<DiscoverDownloadCsvPopoverContentProps>) => {
  return (
    <IntlProvider locale="en">
      <DiscoverDownloadCsvPopoverContent {...mockProps} {...props} />
    </IntlProvider>
  );
};

describe('DiscoverDownloadCsvPopoverContent', () => {
  afterEach(() => {
    mockDownloadForOption.mockClear();
  });

  it('renders title correctly', () => {
    render(<TestHarness />);
    expect(screen.getByTestId('dscDownloadCsvTitle')).toHaveTextContent('Download as CSV');
  });

  it('visible is selected as default', () => {
    render(<TestHarness />);
    expect(screen.getByLabelText(mockVisibleLabel)).toBeChecked();
    expect(screen.getByLabelText(mockMaxLabel)).not.toBeChecked();
  });

  it('selecting max changes the checked selection', () => {
    render(<TestHarness />);
    fireEvent.click(screen.getByLabelText(mockMaxLabel));
    expect(screen.getByLabelText(mockVisibleLabel)).not.toBeChecked();
    expect(screen.getByLabelText(mockMaxLabel)).toBeChecked();
  });

  it('clicking submit fires downloadForOption correctly', () => {
    render(<TestHarness />);
    fireEvent.click(screen.getByTestId('dscDownloadCsvSubmit'));
    expect(mockDownloadForOption).toHaveBeenCalledWith(DownloadCsvFormId.Visible);
  });

  describe('callout', () => {
    it('renders callout if hitsCount > rowsCount', () => {
      render(<TestHarness hitsCount={501} rowsCount={500} />);
      expect(screen.getByTestId('dscDownloadCsvCallout')).toBeInTheDocument();
    });

    it('hides callout if hitsCount <= rowsCount', () => {
      render(<TestHarness hitsCount={500} rowsCount={500} />);
      expect(screen.queryByTestId('dscDownloadCsvCallout')).not.toBeInTheDocument();
    });
  });

  describe('max option UI', () => {
    it('renders the max option if hitsCount > rowsCount', () => {
      render(<TestHarness hitsCount={501} rowsCount={500} />);
      expect(screen.getByTestId('dscDownloadCsvOptionMax')).toBeInTheDocument();
    });

    it('hides the max option if hitsCount <= rowsCount', () => {
      render(<TestHarness hitsCount={500} rowsCount={500} />);
      expect(screen.queryByTestId('dscDownloadCsvOptionMax')).not.toBeInTheDocument();
    });

    it('renders max as hitsCount if hitsCount < MAX_DOWNLOAD_CSV_COUNT', () => {
      const hitsCount = MAX_DOWNLOAD_CSV_COUNT - 10;
      render(<TestHarness hitsCount={hitsCount} rowsCount={500} />);
      expect(screen.queryByTestId('dscDownloadCsvOptionMax')).toHaveTextContent(
        new RegExp(`${hitsCount.toLocaleString()}`)
      );
    });

    it('renders max as MAX_DOWNLOAD_CSV_COUNT if hitsCount > MAX_DOWNLOAD_CSV_COUNT', () => {
      const hitsCount = MAX_DOWNLOAD_CSV_COUNT + 10;
      render(<TestHarness hitsCount={hitsCount} rowsCount={500} />);
      expect(screen.queryByTestId('dscDownloadCsvOptionMax')).toHaveTextContent(
        new RegExp(`${MAX_DOWNLOAD_CSV_COUNT.toLocaleString()}`)
      );
    });

    it('hides max rowsCount === MAX_DOWNLOAD_CSV_COUNT', () => {
      render(
        <TestHarness hitsCount={MAX_DOWNLOAD_CSV_COUNT * 2} rowsCount={MAX_DOWNLOAD_CSV_COUNT} />
      );
      expect(screen.queryByTestId('dscDownloadCsvOptionMax')).not.toBeInTheDocument();
    });
  });
});
