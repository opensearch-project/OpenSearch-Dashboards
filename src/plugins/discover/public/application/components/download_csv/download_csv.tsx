/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './download_csv.scss';
import React, { useState } from 'react';
import { EuiPopover } from '@elastic/eui';
import { DiscoverDownloadCsvPopoverContent } from './download_csv_popover_content';
import { DiscoverDownloadCsvButton } from './download_csv_button';
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

  const closePopover = () => setIsPopoverOpen(false);

  const handleDownloadCsvForOption = async (option: DownloadCsvFormId) => {
    closePopover();
    await downloadCsvForOption(option);
  };

  return (
    <EuiPopover
      button={
        <DiscoverDownloadCsvButton
          disabled={isLoading}
          openPopover={() => setIsPopoverOpen(true)}
        />
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
