/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBadge,
  EuiBadgeGroup,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiPageContent,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React, { useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { useEffectOnce } from 'react-use';
import { getListBreadcrumbs } from '../breadcrumbs';
import {
  reactRouterNavigate,
  useOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext, DataSourceTableItem } from '../../types';
import { CreateButton } from '../create_button';
import { getDataSources } from '../utils';

/* Table config */
const pagination = {
  initialPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50],
};

const sorting = {
  sort: {
    field: 'title',
    direction: 'asc' as const,
  },
};

const search = {
  box: {
    incremental: true,
    schema: {
      fields: { title: { type: 'string' } },
    },
  },
};

const ariaRegion = i18n.translate('dataSourcesManagement.createDataSourcesLiveRegionAriaLabel', {
  defaultMessage: 'Data Sources',
});
const title = i18n.translate('dataSourcesManagement.dataSourcesTable.title', {
  defaultMessage: 'Data Sources',
});

export const DataSourceTable = ({ history }: RouteComponentProps) => {
  const { setBreadcrumbs, savedObjects } = useOpenSearchDashboards<
    DataSourceManagementContext
  >().services;

  /* Component state variables */
  const [dataSources, setDataSources] = useState<DataSourceTableItem[]>([]);

  /* useEffectOnce hook to avoid these methods called multiple times when state is updated. */
  useEffectOnce(() => {
    /* Update breadcrumb*/
    setBreadcrumbs(getListBreadcrumbs());

    /* Initialize the component state*/
    (async function () {
      const fetchedDataSources: DataSourceTableItem[] = await getDataSources(savedObjects.client);
      setDataSources(fetchedDataSources);
    })();
  });

  /* Table columns */
  const columns = [
    {
      field: 'title',
      name: 'Datasource',
      render: (
        name: string,
        index: {
          id: string;
          tags?: Array<{
            key: string;
            name: string;
          }>;
        }
      ) => (
        <>
          <EuiButtonEmpty size="xs" {...reactRouterNavigate(history, `${index.id}`)}>
            {name}
          </EuiButtonEmpty>
          &emsp;
          <EuiBadgeGroup gutterSize="s">
            {index.tags &&
              index.tags.map(({ key: tagKey, name: tagName }) => (
                <EuiBadge key={tagKey}>{tagName}</EuiBadge>
              ))}
          </EuiBadgeGroup>
        </>
      ),
      dataType: 'string' as const,
      sortable: ({ sort }: { sort: string }) => sort,
    },
  ];

  /* Create Data Source button */
  const createButton = <CreateButton history={history} />;

  /* UI Elements */
  return (
    <EuiPageContent data-test-subj="dataSourceTable" role="region" aria-label={ariaRegion}>
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiTitle>
            <h2>{title}</h2>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiText>
            <p>
              <FormattedMessage
                id="dataSourceManagement.dataSourceTable.dataSourceExplanation"
                defaultMessage="Create and manage the data sources that help you retrieve your data from multiple Elasticsearch clusters."
              />
            </p>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>{createButton}</EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <EuiInMemoryTable
        allowNeutralSort={false}
        itemId="id"
        isSelectable={false}
        items={dataSources}
        columns={columns}
        pagination={pagination}
        sorting={sorting}
        search={search}
      />
    </EuiPageContent>
  );
};

export const DataSourceTableWithRouter = withRouter(DataSourceTable);
