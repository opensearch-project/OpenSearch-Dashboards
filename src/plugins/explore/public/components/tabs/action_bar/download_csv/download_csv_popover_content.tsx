/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './download_csv_popover_content.scss';
import React, { useMemo, useState } from 'react';
import { EuiCompressedRadioGroup, EuiSmallButton, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { DownloadCsvFormId, MAX_DOWNLOAD_CSV_COUNT } from './constants';
import { DiscoverDownloadCsvCallout } from './download_csv_callout';

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

  const { showMaxOption, maxCountString, rowsCountString } = useMemo<{
    showMaxOption: boolean;
    maxCountString: string;
    rowsCountString: string;
  }>(() => {
    const maxCount = Math.min(hitsCount, MAX_DOWNLOAD_CSV_COUNT);
    return {
      showMaxOption: maxCount > rowsCount,
      maxCountString: maxCount.toLocaleString(),
      rowsCountString: rowsCount.toLocaleString(),
    };
  }, [hitsCount, rowsCount]);

  const downloadOptions = useMemo(() => {
    const options = [
      {
        id: DownloadCsvFormId.Visible,
        label: (
          <FormattedMessage
            id="explore.discover.downloadCsvOptionVisible"
            defaultMessage="Visible ({rowCount})"
            values={{ rowCount: rowsCountString }}
          />
        ),
        ['data-test-subj']: 'dscDownloadCsvOptionVisible',
      },
    ];

    if (showMaxOption) {
      options.push({
        id: DownloadCsvFormId.Max,
        label: (
          <FormattedMessage
            id="explore.discover.downloadCsvOptionMax"
            defaultMessage="Max available ({max})"
            values={{ max: maxCountString }}
          />
        ),
        ['data-test-subj']: 'dscDownloadCsvOptionMax',
      });
    }

    return options;
  }, [maxCountString, rowsCountString, showMaxOption]);

  return (
    <div className="dscDownloadCsvPopoverContent" data-test-subj="dscDownloadCsvPopoverContent">
      <div className="dscDownloadCsvPopoverContent__titleWrapper">
        <EuiText data-test-subj="dscDownloadCsvTitle" size="m">
          <strong>
            <FormattedMessage
              id="explore.discover.downloadCsvTitle"
              defaultMessage="Download as CSV"
            />
          </strong>
        </EuiText>
      </div>
      <div className="dscDownloadCsvPopoverContent__form">
        <EuiCompressedRadioGroup
          options={downloadOptions}
          onChange={setSelectedOption as (option: string) => void}
          idSelected={selectedOption}
        />
        {showMaxOption && <DiscoverDownloadCsvCallout />}
        <EuiSmallButton
          data-test-subj="dscDownloadCsvSubmit"
          className="dscDownloadCsvPopoverContent__submit"
          onClick={() => downloadForOption(selectedOption)}
          fullWidth={true}
        >
          <FormattedMessage id="explore.discover.downloadCsvSubmit" defaultMessage="Download CSV" />
        </EuiSmallButton>
      </div>
    </div>
  );
};
