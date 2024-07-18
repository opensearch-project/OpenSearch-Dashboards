/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiDescriptionList,
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiHorizontalRule,
  EuiIcon,
  EuiInMemoryTable,
  EuiLink,
  EuiSpacer,
  EuiTableFieldDataColumnType,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useEffect, useState } from 'react';
import { ApplicationStart, HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { DATA_SOURCE_TYPES } from '../../../../framework/constants';
import {
  AssociatedObject,
  CachedAcceleration,
  CachedColumn,
  DirectQueryLoadingStatus,
} from '../../../../framework/types';
import { useLoadTableColumnsToCache } from '../../../../framework/catlog_cache/cache_loader';
import { CatalogCacheManager } from '../../../../framework/catlog_cache/cache_manager';
import {
  getRenderAccelerationDetailsFlyout,
  getRenderCreateAccelerationFlyout,
} from '../../../plugin';
import {
  AccelerationStatus,
  getAccelerationName,
} from '../direct_query_acceleration_management/acceleration_utils';
import {
  ACCE_NO_DATA_DESCRIPTION,
  ACCE_NO_DATA_TITLE,
  CREATE_ACCELERATION_DESCRIPTION,
} from './utils/associated_objects_tab_utils';
import {
  isCatalogCacheFetching,
  redirectToExplorerWithDataSrc,
} from './utils/associated_objects_tab_utils';

export interface AssociatedObjectsFlyoutProps {
  tableDetail: AssociatedObject;
  datasourceName: string;
  resetFlyout: () => void;
  handleRefresh?: () => void;
  dataSourceMDSId?: string;
  http: HttpStart;
  notifications: NotificationsStart;
  application: ApplicationStart;
}

export const AssociatedObjectsDetailsFlyout = ({
  tableDetail,
  datasourceName,
  resetFlyout,
  handleRefresh,
  http,
  notifications,
  dataSourceMDSId,
  application,
}: AssociatedObjectsFlyoutProps) => {
  if (dataSourceMDSId === undefined) {
    dataSourceMDSId = '';
  }
  const { loadStatus, startLoading } = useLoadTableColumnsToCache(
    http,
    notifications,
    dataSourceMDSId
  );
  const [tableColumns, setTableColumns] = useState<CachedColumn[] | undefined>([]);
  const [schemaData, setSchemaData] = useState<any>([]);

  const DiscoverButton = () => {
    return (
      <EuiButtonEmpty
        onClick={() => {
          if (tableDetail.type !== 'table') return;
          redirectToExplorerWithDataSrc(
            tableDetail.datasource,
            DATA_SOURCE_TYPES.S3Glue,
            tableDetail.database,
            tableDetail.name,
            application
          );
          resetFlyout();
        }}
      >
        <EuiIcon type={'discoverApp'} size="m" />
      </EuiButtonEmpty>
    );
  };

  const AccelerateButton = () => {
    return (
      <EuiButtonEmpty
        onClick={() =>
          renderCreateAccelerationFlyout({
            dataSourceName: datasourceName,
            databaseName: tableDetail.database,
            tableName: tableDetail.name,
            handleRefresh,
            dataSourceMDSId,
          })
        }
      >
        <EuiIcon type={'bolt'} size="m" />
      </EuiButtonEmpty>
    );
  };

  const DetailComponent = (detailProps: { title: string; description: any }) => {
    const { title, description } = detailProps;
    return (
      <EuiFlexItem>
        <EuiDescriptionList>
          <EuiDescriptionListTitle>{title}</EuiDescriptionListTitle>
          <EuiDescriptionListDescription>{description}</EuiDescriptionListDescription>
        </EuiDescriptionList>
      </EuiFlexItem>
    );
  };

  const ConnectionComponent = () => {
    return (
      <EuiFlexGroup direction="row">
        <DetailComponent title="Datasource connection" description={tableDetail.datasource} />
        <DetailComponent title="Database" description={tableDetail.database} />
        <DetailComponent title="Table" description={tableDetail.name} />
      </EuiFlexGroup>
    );
  };

  const TableTitleComponent = (titleProps: { title: string }) => {
    const { title } = titleProps;
    return (
      <>
        <EuiTitle size="s">
          <h4>{title}</h4>
        </EuiTitle>
        <EuiHorizontalRule margin="s" />
      </>
    );
  };

  const accelerationData = tableDetail.accelerations.map((acc, index) => ({
    ...acc,
    id: index,
  }));

  const accelerationColumns = [
    {
      field: 'name',
      name: 'Name',
      'data-test-subj': 'accelerationName',
      render: (_: string, item: CachedAcceleration) => {
        const name = getAccelerationName(item, datasourceName);
        return (
          <EuiLink
            onClick={() =>
              renderAccelerationDetailsFlyout({
                acceleration: item,
                dataSourceName: datasourceName,
                handleRefresh,
                dataSourceMDSId,
              })
            }
          >
            {name}
          </EuiLink>
        );
      },
    },
    {
      field: 'status',
      name: 'Status',
      render: (status) => <AccelerationStatus status={status} />,
    },
    {
      field: 'type',
      name: 'Type',
    },
  ] as Array<EuiTableFieldDataColumnType<any>>;

  const noDataMessage = (
    <EuiEmptyPrompt
      title={
        <h2>
          {i18n.translate('datasources.associatedObjectsFlyout.noAccelerationTitle', {
            defaultMessage: ACCE_NO_DATA_TITLE,
          })}
        </h2>
      }
      body={
        <p>
          {i18n.translate('datasources.associatedObjectsFlyout.noAccelerationDescription', {
            defaultMessage: ACCE_NO_DATA_DESCRIPTION,
          })}
        </p>
      }
      actions={
        <EuiButton
          color="primary"
          fill
          onClick={() =>
            renderCreateAccelerationFlyout({
              dataSourceName: datasourceName,
              databaseName: tableDetail.database,
              tableName: tableDetail.name,
              handleRefresh,
            })
          }
          iconType="popout"
          iconSide="left"
        >
          {i18n.translate('datasources.associatedObjectsFlyout.createAccelerationButton', {
            defaultMessage: CREATE_ACCELERATION_DESCRIPTION,
          })}
        </EuiButton>
      }
    />
  );

  const schemaColumns = [
    {
      field: 'name',
      name: 'Column Name',
      'data-test-subj': 'columnName',
    },
    {
      field: 'dataType',
      name: 'Data Type',
      'data-test-subj': 'columnDataType',
    },
  ] as Array<EuiTableFieldDataColumnType<any>>;

  const renderAccelerationDetailsFlyout = getRenderAccelerationDetailsFlyout();

  useEffect(() => {
    if (tableDetail && !tableDetail.columns) {
      try {
        const tables = CatalogCacheManager.getTable(
          datasourceName,
          tableDetail.database,
          tableDetail.name
        );
        if (tables?.columns) {
          setTableColumns(tables?.columns);
        } else {
          startLoading({
            dataSourceName: datasourceName,
            databaseName: tableDetail.database,
            tableName: tableDetail.name,
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        notifications.toasts.addWarning('Your cache is outdated, refresh databases and tables');
      }
    } else if (tableDetail && tableDetail.columns) {
      setTableColumns(tableDetail.columns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loadStatus.toLowerCase() === DirectQueryLoadingStatus.SUCCESS) {
      let columns;
      try {
        columns = CatalogCacheManager.getTable(
          datasourceName,
          tableDetail.database,
          tableDetail.name
        ).columns;
        setTableColumns(columns);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        notifications.toasts.addWarning('Your cache is outdated, refresh databases and tables');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadStatus]);

  useEffect(() => {
    setSchemaData(
      tableColumns?.map((column, index) => ({
        name: column.fieldName,
        dataType: column.dataType,
        id: index,
      }))
    );
  }, [tableColumns]);

  const renderCreateAccelerationFlyout = getRenderCreateAccelerationFlyout();

  return (
    <>
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup direction="row" alignItems="center" gutterSize="m">
          <EuiFlexItem>
            <EuiText size="m">
              <h2 className="accsDetailFlyoutTitle">{tableDetail.name}</h2>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <DiscoverButton />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <AccelerateButton />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <ConnectionComponent />
        <EuiSpacer />
        <TableTitleComponent title="Accelerations" />
        {accelerationData.length > 0 ? (
          <>
            <EuiInMemoryTable
              items={accelerationData}
              columns={accelerationColumns}
              pagination={true}
              sorting={true}
            />
          </>
        ) : (
          noDataMessage
        )}
        <EuiSpacer />
        <TableTitleComponent title="Schema" />
        <EuiInMemoryTable
          items={schemaData}
          columns={schemaColumns}
          pagination={true}
          sorting={true}
          loading={isCatalogCacheFetching(loadStatus)}
        />
      </EuiFlyoutBody>
    </>
  );
};
