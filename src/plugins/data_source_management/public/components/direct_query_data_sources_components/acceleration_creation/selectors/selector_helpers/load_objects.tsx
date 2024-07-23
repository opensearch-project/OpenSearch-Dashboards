/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon, EuiLoadingSpinner } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { DirectQueryLoadingStatus } from '../../../../../../framework/types';
import {
  useLoadAccelerationsToCache,
  useLoadTablesToCache,
} from '../../../../../../framework/catalog_cache/cache_loader';

interface SelectorLoadDatabasesProps {
  dataSourceName: string;
  databaseName: string;
  loadTables: () => void;
  loadingComboBoxes: {
    dataSource: boolean;
    database: boolean;
    dataTable: boolean;
  };
  notifications: NotificationsStart;
  http: HttpStart;
  setLoadingComboBoxes: React.Dispatch<
    React.SetStateAction<{
      dataSource: boolean;
      database: boolean;
      dataTable: boolean;
    }>
  >;
  tableFieldsLoading: boolean;
  dataSourceMDSId?: string;
}

export const SelectorLoadObjects = ({
  dataSourceName,
  databaseName,
  loadTables,
  loadingComboBoxes,
  setLoadingComboBoxes,
  tableFieldsLoading,
  dataSourceMDSId,
  notifications,
  http,
}: SelectorLoadDatabasesProps) => {
  const [isLoading, setIsLoading] = useState({
    tableStatus: false,
    accelerationsStatus: false,
  });
  const isEitherLoading = isLoading.accelerationsStatus || isLoading.tableStatus;
  const {
    loadStatus: loadTablesStatus,
    startLoading: startLoadingTables,
    stopLoading: stopLoadingTables,
  } = useLoadTablesToCache(http, notifications);
  const {
    loadStatus: loadAccelerationsStatus,
    startLoading: startLoadingAccelerations,
    stopLoading: stopLoadingAccelerations,
  } = useLoadAccelerationsToCache(http, notifications);

  const onClickRefreshDatabases = () => {
    if (databaseName === '') {
      notifications.toasts.addDanger('Please select a database');
      return;
    }
    setIsLoading({
      tableStatus: true,
      accelerationsStatus: true,
    });
    startLoadingTables({ dataSourceName, databaseName, dataSourceMDSId });
    startLoadingAccelerations({ dataSourceName, dataSourceMDSId });
  };

  useEffect(() => {
    const status = loadTablesStatus.toLowerCase();
    if (status === DirectQueryLoadingStatus.SUCCESS) {
      loadTables();
      setIsLoading({ ...isLoading, tableStatus: false });
    } else if (
      status === DirectQueryLoadingStatus.FAILED ||
      status === DirectQueryLoadingStatus.CANCELED
    ) {
      setIsLoading({ ...isLoading, tableStatus: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTablesStatus]);

  useEffect(() => {
    const status = loadAccelerationsStatus.toLowerCase();
    if (
      status === DirectQueryLoadingStatus.SUCCESS ||
      status === DirectQueryLoadingStatus.FAILED ||
      status === DirectQueryLoadingStatus.CANCELED
    ) {
      setIsLoading({ ...isLoading, accelerationsStatus: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAccelerationsStatus]);

  useEffect(() => {
    setLoadingComboBoxes({ ...loadingComboBoxes, dataTable: isEitherLoading });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEitherLoading]);

  useEffect(() => {
    return () => {
      stopLoadingTables();
      stopLoadingAccelerations();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      {isEitherLoading ? (
        <EuiLoadingSpinner size="xl" />
      ) : (
        <EuiButtonIcon
          iconType="refresh"
          size="m"
          display="base"
          onClick={onClickRefreshDatabases}
          isDisabled={
            loadingComboBoxes.database || loadingComboBoxes.dataTable || tableFieldsLoading
          }
        />
      )}
    </>
  );
};
