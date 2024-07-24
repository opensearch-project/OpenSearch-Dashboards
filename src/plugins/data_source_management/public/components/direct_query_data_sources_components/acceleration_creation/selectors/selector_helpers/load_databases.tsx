/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon, EuiLoadingSpinner } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { DirectQueryLoadingStatus } from '../../../../../../framework/types';
import { useLoadDatabasesToCache } from '../../../../../../framework/catalog_cache/cache_loader';

interface SelectorLoadDatabasesProps {
  dataSourceName: string;
  loadDatabases: () => void;
  loadingComboBoxes: {
    dataSource: boolean;
    database: boolean;
    dataTable: boolean;
  };
  setLoadingComboBoxes: React.Dispatch<
    React.SetStateAction<{
      dataSource: boolean;
      database: boolean;
      dataTable: boolean;
    }>
  >;
  tableFieldsLoading: boolean;
  dataSourceMDSId?: string;
  http: HttpStart;
  notifications: NotificationsStart;
}

export const SelectorLoadDatabases = ({
  dataSourceName,
  loadDatabases,
  loadingComboBoxes,
  setLoadingComboBoxes,
  tableFieldsLoading,
  dataSourceMDSId,
  http,
  notifications,
}: SelectorLoadDatabasesProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    loadStatus: loadDatabasesStatus,
    startLoading: startDatabasesLoading,
    stopLoading: stopDatabasesLoading,
  } = useLoadDatabasesToCache(http, notifications);

  const onClickRefreshDatabases = () => {
    setIsLoading(true);
    startDatabasesLoading({ dataSourceName, dataSourceMDSId });
  };

  useEffect(() => {
    const status = loadDatabasesStatus.toLowerCase();
    if (status === DirectQueryLoadingStatus.SUCCESS) {
      loadDatabases();
      setIsLoading(false);
    } else if (
      status === DirectQueryLoadingStatus.FAILED ||
      status === DirectQueryLoadingStatus.CANCELED
    ) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDatabasesStatus]);

  useEffect(() => {
    setLoadingComboBoxes({ ...loadingComboBoxes, database: isLoading });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  useEffect(() => {
    return () => {
      stopDatabasesLoading();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {isLoading ? (
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
