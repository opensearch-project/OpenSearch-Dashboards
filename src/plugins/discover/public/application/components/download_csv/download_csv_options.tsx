/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { EuiCompressedRadioGroup } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { DownloadCsvFormId } from './constants';

export interface DiscoverDownloadCsvOptionsProps {
  maxCountString: string;
  rowsCountString: string;
  showMaxOption: boolean;
  selectedOption: DownloadCsvFormId;
  setSelectedOption: (option: DownloadCsvFormId) => void;
}

export const DiscoverDownloadCsvOptions = ({
  maxCountString,
  rowsCountString,
  showMaxOption,
  selectedOption,
  setSelectedOption,
}: DiscoverDownloadCsvOptionsProps) => {
  const downloadOptions = useMemo(() => {
    const options = [
      {
        id: DownloadCsvFormId.Visible,
        label: (
          <FormattedMessage
            id="discover.downloadCsvOptionVisible"
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
            id="discover.downloadCsvOptionMax"
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
    <EuiCompressedRadioGroup
      options={downloadOptions}
      onChange={setSelectedOption as (option: string) => void}
      idSelected={selectedOption}
    />
  );
};
