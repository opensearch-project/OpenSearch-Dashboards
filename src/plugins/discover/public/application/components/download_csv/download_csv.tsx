/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiPopover, EuiSmallButtonEmpty } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { DiscoverDownloadCsvPopoverContent } from './download_csv_popover_content';
import { useDiscoverDownloadCsv } from './use_download_csv';
import { DownloadCsvFormId } from './constants';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { IndexPattern } from '../../../../../data/common';
import { useDiscoverDownloadCsvToasts } from './use_download_csv_toasts';

export interface DiscoverDownloadCsvProps {
  hits?: number;
  rows: OpenSearchSearchHit[];
  indexPattern: IndexPattern;
}

export const DiscoverDownloadCsv = ({ indexPattern, hits, rows }: DiscoverDownloadCsvProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { onSuccess, onError, onLoading } = useDiscoverDownloadCsvToasts();
  const { isLoading, downloadCsvForOption } = useDiscoverDownloadCsv({
    rows,
    hits,
    indexPattern,
    onSuccess,
    onError,
    onLoading,
  });

  const openPopover = () => setIsPopoverOpen(true);
  const closePopover = () => setIsPopoverOpen(false);

  const handleDownloadCsvForOption = async (option: DownloadCsvFormId) => {
    closePopover();
    await downloadCsvForOption(option);
  };

  return (
    <EuiPopover
      button={
        <EuiSmallButtonEmpty
          data-test-subj="dscDownloadCsvButton"
          disabled={isLoading}
          iconType="download"
          iconSide="left"
          onClick={openPopover}
        >
          <FormattedMessage id="discover.downloadCsvButtonText" defaultMessage="Download as CSV" />
        </EuiSmallButtonEmpty>
      }
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
    >
      <DiscoverDownloadCsvPopoverContent
        rowsCount={rows?.length || 0}
        hitsCount={hits || 0}
        downloadForOption={handleDownloadCsvForOption}
      />
    </EuiPopover>
  );
};
