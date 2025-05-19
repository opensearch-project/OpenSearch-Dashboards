/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { EuiSmallButtonEmpty } from '@elastic/eui';
import { getServices } from '../../../opensearch_dashboards_services';
import { useDiscoverContext } from '../../view_components/context';

export enum DiscoverDownloadCsvToastId {
  Cancelled = 'csvDownloadCancelled',
  Loading = 'csvDownloadLoading',
  Success = 'csvDownloadSuccess',
  Error = 'csvDownloadError',
}

export const useDiscoverDownloadCsvToasts = () => {
  const { fetchForMaxCsvStateRef } = useDiscoverContext();
  const { toastNotifications } = getServices();

  const onAbort = () => {
    if (fetchForMaxCsvStateRef.current.abortController) {
      fetchForMaxCsvStateRef.current.abortController.abort();
      toastNotifications.remove(DiscoverDownloadCsvToastId.Loading);
      toastNotifications.addWarning({
        id: DiscoverDownloadCsvToastId.Cancelled,
        iconType: 'alert',
        title: i18n.translate('explore.discover.downloadCsvCancelledToast', {
          defaultMessage: 'Download CSV cancelled',
        }),
        'data-test-subj': 'dscDownloadCsvToastCancelled',
      });
    }
  };

  const onLoading = () => {
    toastNotifications.addInfo(
      {
        id: DiscoverDownloadCsvToastId.Loading,
        color: 'primary',
        iconType: 'iInCircle',
        title: i18n.translate('explore.discover.downloadCsvLoadingToast', {
          defaultMessage: 'Working on CSV file',
        }),
        // TODO: Update the toast notification API to accept ReactNodes
        // The underlying API supports this to be a React Node but we added a type on top of it to disable it for some reason
        text: ((
          <EuiSmallButtonEmpty
            onClick={onAbort}
            color="danger"
            data-test-subj="dscDownloadCsvAbort"
          >
            {i18n.translate('explore.discover.downloadCsvCancelToast', {
              defaultMessage: 'Cancel download',
            })}
          </EuiSmallButtonEmpty>
        ) as unknown) as string,
        'data-test-subj': 'dscDownloadCsvToastLoading',
      },
      // TODO: Putting a high number here as Infinity or Number.MAX_SAFE_INTEGER makes the toast go away right away
      { toastLifeTimeMs: 100000000 }
    );
  };

  const onSuccess = useCallback(() => {
    toastNotifications.remove(DiscoverDownloadCsvToastId.Loading);
    toastNotifications.addSuccess({
      id: DiscoverDownloadCsvToastId.Success,
      color: 'success',
      iconType: 'check',
      title: i18n.translate('explore.discover.downloadCsvSuccessToast', {
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
      title: i18n.translate('explore.discover.downloadCsvErrorToast', {
        defaultMessage: 'Unable to download CSV. Please try again.',
      }),
      'data-test-subj': 'dscDownloadCsvToastError',
    });
  }, [toastNotifications]);

  return {
    onAbort,
    onSuccess,
    onError,
    onLoading,
  };
};
