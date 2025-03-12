/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiSmallButtonEmpty } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

export interface DiscoverDownloadCsvButtonProps {
  disabled: boolean;
  openPopover(): void;
}

export const DiscoverDownloadCsvButton = ({
  disabled,
  openPopover,
}: DiscoverDownloadCsvButtonProps) => {
  return (
    <EuiSmallButtonEmpty
      data-test-subj="dscDownloadCsvButton"
      disabled={disabled}
      iconType="download"
      iconSide="left"
      onClick={openPopover}
    >
      <FormattedMessage id="discover.downloadCsvButtonText" defaultMessage="Download as CSV" />
    </EuiSmallButtonEmpty>
  );
};
