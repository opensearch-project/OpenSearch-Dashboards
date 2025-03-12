/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { EuiGlobalToastListProps } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export enum DiscoverDownloadCsvToastId {
  Loading = 'csvDownloadLoading',
  Success = 'csvDownloadSuccess',
  Error = 'csvDownloadError',
}

export const useDiscoverDownloadCsvToasts = () => {
  const [toasts, setToasts] = useState<EuiGlobalToastListProps['toasts']>([]);

  const onLoading = useCallback(
    () =>
      setToasts([
        {
          id: DiscoverDownloadCsvToastId.Loading,
          color: 'primary',
          iconType: 'iInCircle',
          title: i18n.translate('discover.downloadCsvLoadingToast', {
            defaultMessage: 'Working on CSV file',
          }),
          'data-test-subj': 'dscDownloadCsvToastLoading',
        },
      ]),
    []
  );

  const onSuccess = useCallback(
    () =>
      setToasts([
        {
          id: DiscoverDownloadCsvToastId.Success,
          color: 'success',
          iconType: 'check',
          title: i18n.translate('discover.downloadCsvSuccessToast', {
            defaultMessage: 'CSV download successful.',
          }),
          'data-test-subj': 'dscDownloadCsvToastSuccess',
        },
      ]),
    []
  );

  const onError = useCallback(
    () =>
      setToasts([
        {
          id: DiscoverDownloadCsvToastId.Error,
          color: 'danger',
          iconType: 'alert',
          title: i18n.translate('discover.downloadCsvErrorToast', {
            defaultMessage: 'Unable to download CSV. Please try again.',
          }),
          'data-test-subj': 'dscDownloadCsvToastError',
        },
      ]),
    []
  );

  const onDismiss = useCallback(() => setToasts([]), []);

  return {
    toasts,
    onSuccess,
    onError,
    onLoading,
    onDismiss,
  };
};
