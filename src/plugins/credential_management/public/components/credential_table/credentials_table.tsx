import React from 'react';
// import React, { useState, useEffect } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import {
    reactRouterNavigate,
    useOpenSearchDashboards,
  } from '../../../../opensearch_dashboards_react/public';

import {
    EuiBadge,
    EuiButtonEmpty,
    EuiFlexGroup,
    EuiFlexItem,
    EuiInMemoryTable,
    EuiSpacer,
    EuiText,
    EuiBadgeGroup,
    EuiPageContent,
    EuiTitle,
    // EuiButton,
  } from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { CredentialManagementContext } from '../../types';
import { getCredentials } from '../utils';
import { CredentialsTableItem } from '../types';
import { PLUGIN_NAME } from '../../../common';

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

// const ariaRegion = i18n.translate('credentialManagement.editIndexPatternLiveRegionAriaLabel', {
//   defaultMessage: ,
// });

const title = i18n.translate('credentialManagement.credentialsTable.title', {
  defaultMessage: PLUGIN_NAME,
});

interface Props extends RouteComponentProps {
  canSave: boolean;
}

export const CredentialsTable = ({ canSave, history }: Props) => {
  const [credentials, setCredentials] = React.useState<CredentialsTableItem[]>([]);
  // const [creationOptions, setCreationOptions] = useState<DataSourceCreationOption[]>([]);

  const {
    // setBreadcrumbs,
    savedObjects,
    uiSettings,
    // dataSourceManagementStart,
    // chrome,
    // docLinks,
    // application,
    // http,
    // getMlCardState,
    // data,
  } = useOpenSearchDashboards<CredentialManagementContext>().services;

  // console.warn("services: ", useOpenSearchDashboards<CredentialManagementContext>().services);

  const columns = [
    {
      field: 'credential_name',
      name: 'Credentials',
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
          <EuiButtonEmpty size="xs" {...reactRouterNavigate(history, `credentials/${index.id}`)}>
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


  React.useEffect(() => {
    (async function () {
      // const options = await dataSourceManagementStart.creation.getDataSourceCreationOptions(
      //   history.push
      // ); // todo
      const fetchedCredentials: CredentialsTableItem[] = await getCredentials(
        savedObjects.client,
        uiSettings.get('defaultIndex'),
        // dataSourceManagementStart
      );
      // setIsLoadingDataSources(false);
      // setCreationOptions(options);
      setCredentials(fetchedCredentials);
    })();
  }, [
    history.push,
    credentials.length,
    // dataSourceManagementStart,
    uiSettings,
    savedObjects.client,
  ]);

  // creationOptions.push({
  //   text: 'Create',
  //   onClick(): void {
  //     throw new Error('Function not implemented.');
  //   },
  // });

  // const createButton = canSave ? (
  //   <CreateButton options={creationOptions}>
  //     <FormattedMessage
  //       id="dataSourceManagement.dataSourceTable.createBtn"
  //       defaultMessage="Create data source"
  //     />
  //   </CreateButton>
  // ) : (
  //   <></>
  // );
  return (
    // <EuiPageContent data-test-subj="credentialsTable" role="region" aria-label={ariaRegion}>
    <EuiPageContent data-test-subj="credentialsTable" role="region">
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
                defaultMessage="Create and manage the data sources that help you retrieve your data from OpenSearch."
              />
            </p>
          </EuiText>
        </EuiFlexItem>
        {/* <EuiFlexItem grow={false}>{createButton}</EuiFlexItem> */}
      </EuiFlexGroup>
      <EuiSpacer />
      <EuiInMemoryTable
        allowNeutralSort={false}
        // itemId="id"
        itemId="id"
        isSelectable={false}
        items={credentials}
        columns={columns}
        pagination={pagination}
        sorting={sorting}
        search={search}
      />
    </EuiPageContent>
  );
};

export const CredentialsTableWithRouter = withRouter(CredentialsTable);
