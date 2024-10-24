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
import { ApplicationStart, HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import {
  CachedAcceleration,
  CachedDataSourceStatus,
  DirectQueryLoadingStatus,
} from '../../../../framework/types';
import { CatalogCacheManager } from '../../../../framework/catalog_cache/cache_manager';
import { isCatalogCacheFetching } from '../../../../framework/utils/shared';
import {
  ACC_LOADING_MSG,
  ACC_PANEL_DESC,
  ACC_PANEL_TITLE,
  AccelerationActionType,
  AccelerationStatus,
  CreateAccelerationFlyoutButton,
  getAccelerationName,
  onDiscoverIconClick,
} from './acceleration_utils';
import { AccelerationActionOverlay } from './acceleration_action_overlay';
import { useAccelerationOperation } from './acceleration_operation';
import {
  getRenderAccelerationDetailsFlyout,
  getRenderCreateAccelerationFlyout,
} from '../../../plugin';
import { getUiSettings } from '../../utils';

interface AccelerationTableProps {
  dataSourceName: string;
  cacheLoadingHooks: any;
  http: HttpStart;
  notifications: NotificationsStart;
  application: ApplicationStart;
  featureFlagStatus: boolean;
  dataSourceMDSId?: string;
}

interface ModalState {
  actionType: AccelerationActionType | null;
  selectedItem: CachedAcceleration | null;
}

export const AccelerationTable = ({
  dataSourceName,
  cacheLoadingHooks,
  http,
  notifications,
  featureFlagStatus,
  dataSourceMDSId,
  application,
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
  const [modalState, setModalState] = useState<ModalState>({
    actionType: null,
    selectedItem: null,
  });

  const { performOperation, operationSuccess } = useAccelerationOperation(
    dataSourceName,
    http,
    notifications,
    dataSourceMDSId
  );

  useEffect(() => {
    const cachedDataSource = CatalogCacheManager.getOrCreateAccelerationsByDataSource(
      dataSourceName,
      dataSourceMDSId
    );
    if (
      cachedDataSource.status === CachedDataSourceStatus.Empty &&
      !isCatalogCacheFetching(accelerationsLoadStatus)
    ) {
      setIsRefreshing(true);
      startLoadingAccelerations({ dataSourceName, dataSourceMDSId });
    } else {
      setAccelerations(cachedDataSource.accelerations);
      setUpdatedTime(cachedDataSource.lastUpdated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (accelerationsLoadStatus === DirectQueryLoadingStatus.SUCCESS) {
      const cachedDataSource = CatalogCacheManager.getOrCreateAccelerationsByDataSource(
        dataSourceName,
        dataSourceMDSId
      );
      setAccelerations(cachedDataSource.accelerations);
      setUpdatedTime(cachedDataSource.lastUpdated);
      setIsRefreshing(false);
    }
    if (accelerationsLoadStatus === DirectQueryLoadingStatus.FAILED) {
      setIsRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accelerationsLoadStatus]);

  const handleRefresh = useCallback(() => {
    if (!isCatalogCacheFetching(accelerationsLoadStatus)) {
      setIsRefreshing(true);
      startLoadingAccelerations({ dataSourceName, dataSourceMDSId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accelerationsLoadStatus]);

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

  useEffect(() => {
    if (operationSuccess) {
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operationSuccess]);

  const displayUpdatedTime = updatedTime ? new Date(updatedTime).toLocaleString() : '';

  const AccelerationTableHeader = () => {
    return (
      <>
        <EuiFlexGroup direction="row" alignItems="center">
          <EuiFlexItem>
            <EuiText size="s">
              <h2 className="panel-title">{ACC_PANEL_TITLE}</h2>
              {ACC_PANEL_DESC}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup direction="rowReverse" alignItems="flexEnd">
              <EuiFlexItem grow={false}>
                <CreateAccelerationFlyoutButton
                  dataSourceName={dataSourceName}
                  renderCreateAccelerationFlyout={renderCreateAccelerationFlyout}
                  handleRefresh={handleRefresh}
                  dataSourceMDSId={featureFlagStatus ? dataSourceMDSId ?? undefined : undefined}
                />
              </EuiFlexItem>
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
        <p>{ACC_LOADING_MSG}</p>
      </>
    );

    return <EuiEmptyPrompt icon={<EuiLoadingSpinner size="xl" />} body={<BodyText />} />;
  };

  const tableActions = [
    {
      name: 'Query Data',
      description: 'Query in Discover',
      icon: 'discoverApp',
      type: 'icon',
      onClick: (acc: CachedAcceleration) => {
        onDiscoverIconClick(acc, dataSourceName, dataSourceMDSId, application);
      },
      enabled: () => {
        try {
          return getUiSettings().get('query:enhancements:enabled');
        } catch (e) {
          return false;
        }
      },
    },
    {
      name: 'Sync',
      description: 'Manual Sync Data',
      icon: 'inputOutput',
      onClick: (item: CachedAcceleration) => handleActionClick('sync', item),
      enabled: (item: CachedAcceleration) => !item.autoRefresh && item.status === 'active',
    },
    {
      name: 'Delete',
      description: 'Delete acceleration',
      icon: 'trash',
      onClick: (item: CachedAcceleration) => handleActionClick('delete', item),
      enabled: (item: CachedAcceleration) => item.status !== 'deleted',
    },
    {
      name: 'Vacuum',
      description: 'Vacuum acceleration',
      icon: 'broom',
      onClick: (item: CachedAcceleration) => handleActionClick('vacuum', item),
      enabled: (item: CachedAcceleration) => item.status === 'deleted',
    },
  ];

  const handleActionClick = (
    actionType: ModalState['actionType'],
    acceleration: CachedAcceleration
  ) => {
    setModalState({
      actionType,
      selectedItem: acceleration,
    });
  };

  const handleModalClose = () => {
    setModalState({
      actionType: null,
      selectedItem: null,
    });
  };

  const handleConfirm = () => {
    if (!modalState.selectedItem || !modalState.actionType) return;

    performOperation(modalState.selectedItem, modalState.actionType);
    handleModalClose();
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
              renderAccelerationDetailsFlyout({
                acceleration,
                dataSourceName,
                handleRefresh,
                dataSourceMDSId: featureFlagStatus ? dataSourceMDSId : undefined,
              });
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
      render: (status: string) => <AccelerationStatus status={status} />,
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
    {
      name: 'Actions',
      actions: tableActions,
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

  const renderAccelerationDetailsFlyout = getRenderAccelerationDetailsFlyout();
  const renderCreateAccelerationFlyout = getRenderCreateAccelerationFlyout();

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
      {(modalState.actionType === 'delete' ||
        modalState.actionType === 'vacuum' ||
        modalState.actionType === 'sync') && (
        <AccelerationActionOverlay
          isVisible={!!modalState.actionType}
          actionType={modalState.actionType}
          acceleration={modalState.selectedItem}
          dataSourceName={dataSourceName}
          onCancel={handleModalClose}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
};
