/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IntlProvider } from 'react-intl';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  DiscoverDownloadCsvOptions,
  DiscoverDownloadCsvOptionsProps,
} from './download_csv_options';
import { DownloadCsvFormId } from './constants';

const mockSetSelectedOption = jest.fn();
const mockProps: DiscoverDownloadCsvOptionsProps = {
  maxCountString: '8,000',
  rowsCountString: '500',
  showMaxOption: true,
  selectedOption: DownloadCsvFormId.Visible,
  setSelectedOption: mockSetSelectedOption,
};
const mockVisibleLabel = `Visible (${mockProps.rowsCountString})`;
const mockMaxLabel = `Max available (${mockProps.maxCountString})`;

const TestHarness = (props: Partial<DiscoverDownloadCsvOptionsProps>) => {
  return (
    <IntlProvider locale="en">
      <DiscoverDownloadCsvOptions {...mockProps} {...props} />
    </IntlProvider>
  );
};

describe('DiscoverDownloadCsvOptions', () => {
  afterEach(() => {
    mockSetSelectedOption.mockClear();
  });

  it('renders both options when showMaxOption is true', () => {
    render(<TestHarness showMaxOption={true} />);
    expect(screen.getByTestId('dscDownloadCsvOptionVisible')).toBeInTheDocument();
    expect(screen.getByTestId('dscDownloadCsvOptionMax')).toBeInTheDocument();
  });

  it('renders only visible option when !showMaxOption', () => {
    render(<TestHarness showMaxOption={false} />);
    expect(screen.getByTestId('dscDownloadCsvOptionVisible')).toBeInTheDocument();
    expect(screen.queryByTestId('dscDownloadCsvOptionMax')).not.toBeInTheDocument();
  });

  it('renders visible text correctly', () => {
    render(<TestHarness />);
    expect(screen.getByTestId('dscDownloadCsvOptionVisible')).toHaveTextContent(mockVisibleLabel);
  });

  it('renders max text correctly', () => {
    render(<TestHarness />);
    expect(screen.getByTestId('dscDownloadCsvOptionMax')).toHaveTextContent(mockMaxLabel);
  });

  describe('selectedOption === DownloadCsvFormId.Visible', () => {
    it('default is correctly selected', () => {
      render(<TestHarness selectedOption={DownloadCsvFormId.Visible} />);
      expect(screen.getByLabelText(mockVisibleLabel)).toBeChecked();
      expect(screen.getByLabelText(mockMaxLabel)).not.toBeChecked();
    });

    it('clicking on visible option does nothing', () => {
      render(<TestHarness selectedOption={DownloadCsvFormId.Visible} />);
      fireEvent.click(screen.getByLabelText(mockVisibleLabel));
      expect(mockSetSelectedOption).not.toHaveBeenCalled();
    });

    it('clicking on max option calls mockSetSelectedOption', () => {
      render(<TestHarness selectedOption={DownloadCsvFormId.Visible} />);
      fireEvent.click(screen.getByLabelText(mockMaxLabel));
      expect(mockSetSelectedOption).toHaveBeenCalledWith(
        DownloadCsvFormId.Max,
        undefined,
        expect.anything()
      );
    });
  });

  describe('selectedOption === DownloadCsvFormId.Max', () => {
    it('default is correctly selected', () => {
      render(<TestHarness selectedOption={DownloadCsvFormId.Max} />);
      expect(screen.getByLabelText(mockVisibleLabel)).not.toBeChecked();
      expect(screen.getByLabelText(mockMaxLabel)).toBeChecked();
    });

    it('clicking on visible option calls mockSetSelectedOption', () => {
      render(<TestHarness selectedOption={DownloadCsvFormId.Max} />);
      fireEvent.click(screen.getByLabelText(mockVisibleLabel));
      expect(mockSetSelectedOption).toHaveBeenCalledWith(
        DownloadCsvFormId.Visible,
        undefined,
        expect.anything()
      );
    });

    it('clicking on max option does nothing', () => {
      render(<TestHarness selectedOption={DownloadCsvFormId.Max} />);
      fireEvent.click(screen.getByLabelText(mockMaxLabel));
      expect(mockSetSelectedOption).not.toHaveBeenCalled();
    });
  });
});
