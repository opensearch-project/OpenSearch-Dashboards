/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IntlProvider } from 'react-intl';
import { render, screen } from '@testing-library/react';
import { DiscoverDownloadCsvCallout } from './download_csv_callout';
import { MAX_DOWNLOAD_CSV_COUNT } from './constants';

const TestHarness = () => {
  return (
    <IntlProvider locale="en">
      <DiscoverDownloadCsvCallout />
    </IntlProvider>
  );
};

describe('DiscoverDownloadCsvCallout', () => {
  it('renders text correctly', () => {
    render(<TestHarness />);
    expect(
      screen.getByText(
        `There is a limit of ${MAX_DOWNLOAD_CSV_COUNT.toLocaleString()} total result downloads.`
      )
    ).toBeInTheDocument();
  });
});
