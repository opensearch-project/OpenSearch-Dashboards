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
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiSpacer,
  EuiText,
  EuiBadgeGroup,
  EuiPageContent,
  EuiTitle,
} from '@elastic/eui';

import {
  reactRouterNavigate,
  useOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';

import { CredentialManagementContext } from '../../types';
import { deleteCredentials, getCredentials } from '../utils';
import { CredentialsTableItem } from '../types';
import { CredentialCreationOption } from '../../service';
import { CreateButton } from '../create_button';

const pagination = {
  initialPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50],
};

const sorting = {
  sort: {
    field: 'credentialName',
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
  const [selectedCredentials, setSelectedCredentials] = React.useState<CredentialsTableItem[]>([]);

  const {
    savedObjects,
    uiSettings,
    credentialManagementStart,
  } = useOpenSearchDashboards<CredentialManagementContext>().services;

  const columns = [
    {
      field: 'title',
      name: 'Credential Name',
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
          <EuiButtonEmpty size="xs" {...reactRouterNavigate(history, `/${index.id}`)}>
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
    {
      field: 'credentialType',
      name: 'Credential Type',
      truncateText: true,
      mobileOptions: {
        show: false,
      },
    },
  ];

  const onSelectionChange = (selectedCredentials: CredentialsTableItem[]) => {
    setSelectedCredentials(selectedCredentials);
  };

  const selection = {
    onSelectionChange,
  };

  const renderDeleteButton = () => {
    if (selectedCredentials.length === 0) {
      return;
    }

    return (
      <EuiButton color="danger" iconType="trash" onClick={onClickDelete}>
        Delete {selectedCredentials.length} Credentials
      </EuiButton>
    );
  };

  const onClickDelete = () => {
    Promise.resolve(deleteCredentials(savedObjects.client, selectedCredentials)).then(function () {
      setSelectedCredentials([]);
      // TODO: Fix routing
      history.push('');
    });
  };

  const deleteButton = renderDeleteButton();

  React.useEffect(() => {
    (async function () {
      const options = await credentialManagementStart.creation.getCredentialCreationOptions(
        history.push
      );
      const fetchedCredentials: CredentialsTableItem[] = await getCredentials(
        savedObjects.client,
        uiSettings.get('defaultIndex')
      );
      setCredentials(fetchedCredentials);
      setCreationOptions(options);
    })();
  }, [
    history.push,
    credentials.length,
    credentialManagementStart,
    uiSettings,
    savedObjects.client,
  ]);

  const createButton = canSave ? (
    <CreateButton options={creationOptions}>
      <FormattedMessage
        id="credentialManagement.credentialsTable.createBtn"
        defaultMessage="Save your credential"
      />
    </CreateButton>
  ) : (
    <></>
  );

  return (
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
        {deleteButton}
      </EuiFlexGroup>
      <EuiSpacer />
      <EuiInMemoryTable
        allowNeutralSort={false}
        itemId="id"
        isSelectable={true}
        selection={selection}
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
