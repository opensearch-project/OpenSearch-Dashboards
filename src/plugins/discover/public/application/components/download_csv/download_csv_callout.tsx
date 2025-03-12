/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

export const DiscoverDownloadCsvCallout = () => {
  return (
    <EuiCallOut
      className="dscDownloadCsv__callout"
      data-test-subj="dscDownloadCsvCallout"
      color="warning"
    >
      <EuiText size="s" className="dscDownloadCsv__calloutText">
        <FormattedMessage
          id="discover.downloadCsvCallout"
          defaultMessage="There is a limit of 10,000 total result downloads."
        />
      </EuiText>
    </EuiCallOut>
  );
};
