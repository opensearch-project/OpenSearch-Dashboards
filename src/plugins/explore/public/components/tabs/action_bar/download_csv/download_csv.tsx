/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { EuiButtonIcon, EuiPopover, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DiscoverDownloadCsvPopoverContent } from './download_csv_popover_content';
import { useDiscoverDownloadCsv } from './use_download_csv';
import { DownloadCsvFormId } from './constants';
import { OpenSearchSearchHit } from '../../../../types/doc_views_types';
import { IndexPattern } from '../../../../../../data/common';
import { useDiscoverDownloadCsvToasts } from './use_download_csv_toasts';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';

export interface DiscoverDownloadCsvProps {
  hits?: number;
  rows: OpenSearchSearchHit[];
  indexPattern: IndexPattern;
}

export const DiscoverDownloadCsv = ({ indexPattern, hits, rows }: DiscoverDownloadCsvProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { services } = useOpenSearchDashboards<ExploreServices>();
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

  const handleDownloadCsvShortcut = () => {
    if (!isLoading) {
      openPopover();
    }
  };
  const { keyboardShortcut } = services;

  // Register keyboard shortcut
  keyboardShortcut?.useKeyboardShortcut({
    id: 'download_csv',
    pluginId: 'explore',
    name: i18n.translate('explore.downloadCsv.downloadCsvShortcut', {
      defaultMessage: 'Download CSV',
    }),
    category: i18n.translate('explore.downloadCsv.dataActionsCategory', {
      defaultMessage: 'Data actions',
    }),
    keys: 'e',
    execute: handleDownloadCsvShortcut,
  });

  const handleDownloadCsvForOption = async (option: DownloadCsvFormId) => {
    closePopover();
    await downloadCsvForOption(option);
  };

  const buttonLabel = i18n.translate('explore.discover.downloadCsvButtonText', {
    defaultMessage: 'Export',
  });

  // Disable trap foucus, since it can break dismiss
  return (
    <EuiPopover
      button={
        // Icon-only with a hover tooltip carrying the name (Variant A, UXSO #3).
        <EuiToolTip content={buttonLabel} delay="long">
          <EuiButtonIcon
            size="s"
            data-test-subj="dscDownloadCsvButton"
            disabled={isLoading}
            iconType="download"
            color="text"
            aria-label={buttonLabel}
            onClick={openPopover}
          />
        </EuiToolTip>
      }
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      ownFocus={false}
    >
      <DiscoverDownloadCsvPopoverContent
        rowsCount={rows?.length || 0}
        hitsCount={hits || 0}
        downloadForOption={handleDownloadCsvForOption}
      />
    </EuiPopover>
  );
};
