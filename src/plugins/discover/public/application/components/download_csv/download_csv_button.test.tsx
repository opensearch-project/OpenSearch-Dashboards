/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IntlProvider } from 'react-intl';
import { fireEvent, render, screen } from '@testing-library/react';
import { DiscoverDownloadCsvButton, DiscoverDownloadCsvButtonProps } from './download_csv_button';

const mockOpenPopover = jest.fn();
const mockProps: DiscoverDownloadCsvButtonProps = {
  disabled: false,
  openPopover: mockOpenPopover,
};

const TestHarness = (props: Partial<DiscoverDownloadCsvButtonProps>) => {
  return (
    <IntlProvider locale="en">
      <DiscoverDownloadCsvButton {...mockProps} {...props} />
    </IntlProvider>
  );
};

describe('DiscoverDownloadCsvButton', () => {
  afterEach(() => {
    mockOpenPopover.mockClear();
  });

  it('Renders text correctly', () => {
    render(<TestHarness />);
    expect(screen.getByTestId('dscDownloadCsvButton')).toHaveTextContent('Download as CSV');
  });

  it('Clicking on button calls openPopover', () => {
    render(<TestHarness />);
    fireEvent.click(screen.getByTestId('dscDownloadCsvButton'));
    expect(mockOpenPopover).toHaveBeenCalled();
  });

  it('Clicking on button while disabled does nothing', () => {
    render(<TestHarness disabled={true} />);
    fireEvent.click(screen.getByTestId('dscDownloadCsvButton'));
    expect(mockOpenPopover).not.toHaveBeenCalled();
  });
});
