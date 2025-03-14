/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './download_csv_callout.scss';
import React from 'react';
import { EuiCallOut, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { MAX_DOWNLOAD_CSV_COUNT } from './constants';

export const DiscoverDownloadCsvCallout = () => {
  return (
    <EuiCallOut
      className="dscDownloadCsvCallout"
      data-test-subj="dscDownloadCsvCallout"
      color="warning"
    >
      <EuiText size="s" className="dscDownloadCsvCallout__text">
        <FormattedMessage
          id="discover.downloadCsvCallout"
          defaultMessage="There is a limit of {max} total result downloads."
          values={{ max: MAX_DOWNLOAD_CSV_COUNT.toLocaleString() }}
        />
      </EuiText>
    </EuiCallOut>
  );
};
