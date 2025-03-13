/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { getServices } from '../../../opensearch_dashboards_services';

export enum DiscoverDownloadCsvToastId {
  Loading = 'csvDownloadLoading',
  Success = 'csvDownloadSuccess',
  Error = 'csvDownloadError',
}

export const useDiscoverDownloadCsvToasts = () => {
  const { toastNotifications } = getServices();

  const onLoading = useCallback(() => {
    toastNotifications.addInfo(
      {
        id: DiscoverDownloadCsvToastId.Loading,
        color: 'primary',
        iconType: 'iInCircle',
        title: i18n.translate('discover.downloadCsvLoadingToast', {
          defaultMessage: 'Working on CSV file',
        }),
        'data-test-subj': 'dscDownloadCsvToastLoading',
      },
      // TODO: Putting a high number here as Infinity or Number.MAX_SAFE_INTEGER makes the toast go away right away
      { toastLifeTimeMs: 100000000 }
    );
  }, [toastNotifications]);

  const onSuccess = useCallback(() => {
    toastNotifications.remove(DiscoverDownloadCsvToastId.Loading);
    toastNotifications.addSuccess({
      id: DiscoverDownloadCsvToastId.Success,
      color: 'success',
      iconType: 'check',
      title: i18n.translate('discover.downloadCsvSuccessToast', {
        defaultMessage: 'CSV download successful.',
      }),
      'data-test-subj': 'dscDownloadCsvToastSuccess',
    });
  }, [toastNotifications]);

  const onError = useCallback(() => {
    toastNotifications.remove(DiscoverDownloadCsvToastId.Loading);
    toastNotifications.addDanger({
      id: DiscoverDownloadCsvToastId.Error,
      color: 'danger',
      iconType: 'alert',
      title: i18n.translate('discover.downloadCsvErrorToast', {
        defaultMessage: 'Unable to download CSV. Please try again.',
      }),
      'data-test-subj': 'dscDownloadCsvToastError',
    });
  }, [toastNotifications]);

  return {
    onSuccess,
    onError,
    onLoading,
  };
};
