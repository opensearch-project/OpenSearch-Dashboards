/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiSmallButton, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { DownloadCsvFormId, MAX_DOWNLOAD_CSV_COUNT } from './constants';
import { DiscoverDownloadCsvCallout } from './download_csv_callout';
import { DiscoverDownloadCsvOptions } from './download_csv_options';

export interface DiscoverDownloadCsvPopoverContentProps {
  downloadForOption: (option: DownloadCsvFormId) => Promise<void>;
  hitsCount: number;
  rowsCount: number;
}

export const DiscoverDownloadCsvPopoverContent = ({
  downloadForOption,
  hitsCount,
  rowsCount,
}: DiscoverDownloadCsvPopoverContentProps) => {
  const [selectedOption, setSelectedOption] = useState<DownloadCsvFormId>(
    DownloadCsvFormId.Visible
  );
  const maxCount = Math.min(hitsCount, MAX_DOWNLOAD_CSV_COUNT);
  const showMaxOption = maxCount > rowsCount;
  const maxCountStr = maxCount.toLocaleString();

  return (
    <div className="dscDownloadCsv__popover" data-test-subj="dscDownloadCsvPopoverContent">
      <div className="dscDownloadCsv__titleWrapper">
        <EuiText data-test-subj="dscDownloadCsvTitle" size="m" className="dscDownloadCsv__title">
          <strong>
            <FormattedMessage id="discover.downloadCsvTitle" defaultMessage="Download as CSV" />
          </strong>
        </EuiText>
      </div>
      <div className="dscDownloadCsv__form">
        <DiscoverDownloadCsvOptions
          showMaxOption={showMaxOption}
          maxCountString={maxCountStr}
          rowsCountString={rowsCount.toLocaleString()}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
        />
        {showMaxOption && <DiscoverDownloadCsvCallout />}
        <EuiSmallButton
          data-test-subj="dscDownloadCsvSubmit"
          className="dscDownloadCsv__submit"
          onClick={() => downloadForOption(selectedOption)}
          fullWidth={true}
        >
          <FormattedMessage id="discover.downloadCsvSubmit" defaultMessage="Download CSV" />
        </EuiSmallButton>
      </div>
    </div>
  );
};
