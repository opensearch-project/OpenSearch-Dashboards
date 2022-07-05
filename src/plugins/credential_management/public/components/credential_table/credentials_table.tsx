/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';

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

import {
  reactRouterNavigate,
  useOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';

import { CredentialManagementContext } from '../../types';
import { getCredentials } from '../utils';
import { CredentialsTableItem, CredentialCreationOption } from '../types';
import { CreateButton } from '../create_button';

const pagination = {
  initialPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50],
};

const sorting = {
  sort: {
    field: 'credential_name',
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
  defaultMessage: 'Credentials',
});

interface Props extends RouteComponentProps {
  canSave: boolean;
}

export const CredentialsTable = ({ canSave, history }: Props) => {
  const [credentials, setCredentials] = React.useState<CredentialsTableItem[]>([]);
  const [creationOptions, setCreationOptions] = React.useState<CredentialCreationOption[]>([]);

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
      name: 'Credential',
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
      const fetchedCredentials: CredentialsTableItem[] = await getCredentials(
        savedObjects.client,
        uiSettings.get('defaultIndex')
      );
      setCredentials(fetchedCredentials);
    })();
  }, [
    history.push,
    credentials.length,
    uiSettings,
    savedObjects.client,
  ]);
  
  // TODO: Update it
  creationOptions.push({
    text: 'Create',
    onClick(): void {
      throw new Error('Function not implemented.');
    },
  });

  const createButton = canSave ? (
    <CreateButton options={creationOptions}>
      <FormattedMessage
        id="credentialManagement.credentialsTable.createBtn"
        defaultMessage="Create credential"
      />
    </CreateButton>
  ) : (
    <></>
  );

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
                id="credentialManagement.credentialsTable.credentialManagementExplanation"
                defaultMessage="Create and manage the credentials that help you retrieve your data from OpenSearch."
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
