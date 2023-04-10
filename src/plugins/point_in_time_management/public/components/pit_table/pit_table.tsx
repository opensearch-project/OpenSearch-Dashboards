/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { useEffectOnce, useMount } from 'react-use';
import {
  EuiButton,
  EuiInMemoryTable,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
  EuiSearchBarProps,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { getListBreadcrumbs } from '../breadcrumbs';
import { PointInTimeManagementContext } from '../../types';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getDataSources } from '../utils';
import { EmptyState } from './empty_state';
import { PageHeader } from './page_header';

export interface DataSourceItem {
  id: string;
  title: string;
  sort: string;
}

const PITTable = ({ history }: RouteComponentProps) => {
  const {
    setBreadcrumbs,
    savedObjects,
    notifications: { toasts },
  } = useOpenSearchDashboards<PointInTimeManagementContext>().services;

  useMount(() => {
    setBreadcrumbs(getListBreadcrumbs());
  });

  // TODO: update this for cases when some data source name is default
  const defaultDataSource: DataSourceItem = { id: '', title: 'Default', sort: '0' };

  // TODO: use APIs to fetch PITs and update the table and message
  const [pits] = useState([]);
  const [message] = useState(<EmptyState />);

  const [dataSources, setDataSources] = useState<DataSourceItem[]>([defaultDataSource]);

  useEffectOnce(() => {
    fetchDataSources();
  });

  const fetchDataSources = () => {
    getDataSources(savedObjects.client)
      .then((fetchedDataSources) => {
        if (fetchedDataSources?.length) {
          setDataSources(
            fetchedDataSources
              .concat([defaultDataSource])
              .sort((a, b) => a.sort.localeCompare(b.sort))
          );
        }
      })
      .catch(() => {
        toasts.addDanger(
          i18n.translate('pitManagement.pitTable.fetchDataSourceError', {
            defaultMessage: 'Unable to find existing data sources',
          })
        );
      });
  };

  const columns = [
    {
      field: 'name',
      name: i18n.translate('pitManagement.pitTable.nameColumnName', {
        defaultMessage: 'Name',
      }),
    },
    {
      field: 'expires',
      name: i18n.translate('pitManagement.pitTable.expiresColumnName', {
        defaultMessage: 'Expires',
      }),
      sortable: true,
    },
    {
      field: 'dataSource',
      name: i18n.translate('pitManagement.pitTable.dataSourceColumnName', {
        defaultMessage: 'Data Source',
      }),
    },
    {
      field: 'created',
      name: i18n.translate('pitManagement.pitTable.createdColumnName', {
        defaultMessage: 'Created',
      }),
      sortable: true,
    },
    {
      field: 'actions',
      name: i18n.translate('pitManagement.pitTable.actionsColumnName', {
        defaultMessage: 'Actions',
      }),
    },
  ];

  const renderToolsRight = () => {
    return [
      <EuiButton
        iconType="trash"
        key="loadUsers"
        isDisabled={pits.length === 0}
        data-test-subj="deletePITBtnInPitTable"
      >
        <FormattedMessage id="pitManagement.pitTable.deletePitButton" defaultMessage="Delete" />
      </EuiButton>,
    ];
  };

  const search: EuiSearchBarProps = {
    toolsRight: renderToolsRight(),
    defaultQuery: 'dataSource:Default',

    box: {
      incremental: true,
      schema: true,
      disabled: pits.length === 0,
    },
    filters: [
      {
        type: 'field_value_selection',
        searchThreshold: 5,
        field: 'dataSource',
        name: i18n.translate('pitManagement.pitTable.dataSourceFilterName', {
          defaultMessage: 'Data Source',
        }),
        multiSelect: false,
        options: dataSources.map((source) => ({
          value: source.title,
          name: source.title,
          view: `${source.title}`,
        })),
      },
    ],
  };

  const pagination = {
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50],
  };

  return (
    <>
      <EuiPageContent
        className="pitTable"
        horizontalPosition="center"
        data-test-subj="pointInTimeTable"
      >
        <PageHeader />
        <EuiSpacer size="m" />
        <EuiPageContentBody>
          <EuiInMemoryTable
            items={pits}
            itemId="name"
            message={message}
            columns={columns}
            search={search}
            pagination={pagination}
            sorting={true}
            isSelectable={true}
          />
        </EuiPageContentBody>
      </EuiPageContent>
    </>
  );
};

export const PITTableWithRouter = withRouter(PITTable);
