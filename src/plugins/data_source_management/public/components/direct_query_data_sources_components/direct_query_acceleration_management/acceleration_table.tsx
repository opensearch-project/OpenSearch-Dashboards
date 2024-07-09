/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiInMemoryTable,
  EuiLink,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiTableFieldDataColumnType,
  EuiText,
} from '@elastic/eui';
import React, { useCallback, useEffect, useState } from 'react';
import {
  CachedAcceleration,
  CachedDataSourceStatus,
  DirectQueryLoadingStatus,
} from '../../../../framework/types';
import { CatalogCacheManager } from '../../../../framework/catlog_cache/cache_manager';
import { isCatalogCacheFetching } from '../../../../framework/utils/shared';
import { getAccelerationName } from './acceleration_utils';

interface AccelerationTableProps {
  dataSourceName: string;
  cacheLoadingHooks: any;
}

export const AccelerationTable = ({
  dataSourceName,
  cacheLoadingHooks,
}: AccelerationTableProps) => {
  const [accelerations, setAccelerations] = useState<CachedAcceleration[]>([]);
  const [updatedTime, setUpdatedTime] = useState<string>();
  const {
    databasesLoadStatus,
    tablesLoadStatus,
    accelerationsLoadStatus,
    startLoadingAccelerations,
  } = cacheLoadingHooks;
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const cachedDataSource = CatalogCacheManager.getOrCreateAccelerationsByDataSource(
      dataSourceName
    );
    if (
      cachedDataSource.status === CachedDataSourceStatus.Empty &&
      !isCatalogCacheFetching(accelerationsLoadStatus)
    ) {
      setIsRefreshing(true);
      startLoadingAccelerations({ dataSourceName });
    } else {
      setAccelerations(cachedDataSource.accelerations);
      setUpdatedTime(cachedDataSource.lastUpdated);
    }
  }, [accelerationsLoadStatus, dataSourceName, startLoadingAccelerations]);

  useEffect(() => {
    if (accelerationsLoadStatus === DirectQueryLoadingStatus.SUCCESS) {
      const cachedDataSource = CatalogCacheManager.getOrCreateAccelerationsByDataSource(
        dataSourceName
      );
      setAccelerations(cachedDataSource.accelerations);
      setUpdatedTime(cachedDataSource.lastUpdated);
      setIsRefreshing(false);
    }
    if (accelerationsLoadStatus === DirectQueryLoadingStatus.FAILED) {
      setIsRefreshing(false);
    }
  }, [accelerationsLoadStatus, dataSourceName]);

  const handleRefresh = useCallback(() => {
    if (!isCatalogCacheFetching(accelerationsLoadStatus)) {
      setIsRefreshing(true);
      startLoadingAccelerations({ dataSourceName });
    }
  }, [accelerationsLoadStatus, dataSourceName, startLoadingAccelerations]);

  const RefreshButton = () => {
    return (
      <EuiButton
        onClick={handleRefresh}
        isLoading={
          isRefreshing ||
          isCatalogCacheFetching(databasesLoadStatus, tablesLoadStatus, accelerationsLoadStatus)
        }
      >
        Refresh
      </EuiButton>
    );
  };

  const displayUpdatedTime = updatedTime ? new Date(updatedTime).toLocaleString() : '';

  const AccelerationTableHeader = () => {
    return (
      <>
        <EuiFlexGroup direction="row" alignItems="center">
          <EuiFlexItem>
            <EuiText>
              <h2 className="panel-title">Accelerations</h2>
              Accelerations improve query performance.
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup direction="rowReverse" alignItems="flexEnd">
              <EuiFlexItem grow={false}>
                <RefreshButton data-test-subj="refreshButton" />
              </EuiFlexItem>
              {updatedTime && (
                <EuiFlexItem>
                  <EuiText textAlign="right" size="xs" color="subdued">
                    {'Last updated at:'}
                  </EuiText>
                  <EuiText textAlign="right" color="subdued" size="xs">
                    {displayUpdatedTime}
                  </EuiText>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </>
    );
  };

  const AccelerationLoading = () => {
    const BodyText = () => (
      <>
        <p>Loading accelerations...</p>
      </>
    );

    return <EuiEmptyPrompt icon={<EuiLoadingSpinner size="xl" />} body={<BodyText />} />;
  };

  const accelerationTableColumns = [
    {
      field: 'indexName',
      name: 'Name',
      sortable: true,
      render: (indexName: string, acceleration: CachedAcceleration) => {
        const displayName = getAccelerationName(acceleration);
        return (
          <EuiLink
            onClick={() => {
              // renderAccelerationDetailsFlyout({
              //   acceleration,
              //   dataSourceName,
              //   handleRefresh,
              // });
            }}
          >
            {displayName}
          </EuiLink>
        );
      },
    },
    {
      field: 'status',
      name: 'Status',
      sortable: true,
      render: (status: string) => <EuiText>{status}</EuiText>,
    },
    {
      field: 'type',
      name: 'Type',
      sortable: true,
      render: (type: string) => <EuiText>{type}</EuiText>,
    },
    {
      field: 'database',
      name: 'Database',
      sortable: true,
      render: (database: string) => <EuiText>{database}</EuiText>,
    },
    {
      field: 'table',
      name: 'Table',
      sortable: true,
      render: (table: string) => <EuiText>{table || '-'}</EuiText>,
    },
    {
      field: 'refreshType',
      name: 'Refresh Type',
      sortable: true,
      render: (autoRefresh: boolean, acceleration: CachedAcceleration) => {
        return <EuiText>{acceleration.autoRefresh ? 'Auto refresh' : 'Manual'}</EuiText>;
      },
    },
    {
      field: 'flintIndexName',
      name: 'Destination Index',
      sortable: true,
      render: (flintIndexName: string, acceleration: CachedAcceleration) => {
        if (acceleration.type === 'skipping') {
          return '-';
        }
        return flintIndexName || '-';
      },
    },
  ] as Array<EuiTableFieldDataColumnType<any>>;

  const pagination = {
    initialPageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
  };

  const sorting = {
    sort: {
      field: 'name',
      direction: 'asc',
    },
  };

  return (
    <>
      <EuiSpacer />
      <EuiPanel>
        <AccelerationTableHeader />
        <EuiHorizontalRule />
        {isRefreshing ? (
          <AccelerationLoading />
        ) : (
          <EuiInMemoryTable
            items={accelerations}
            columns={accelerationTableColumns}
            pagination={pagination}
            sorting={sorting}
          />
        )}
      </EuiPanel>
    </>
  );
};
