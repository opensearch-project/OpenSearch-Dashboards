/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
  EuiGlobalToastList,
  EuiGlobalToastListToast,
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

import { getListBreadcrumbs } from '../breadcrumbs';
import { CredentialManagementContext } from '../../types';
import { deleteCredentials, getCredentials } from '../utils';
import { CredentialsTableItem } from '../types';
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

const title = i18n.translate('credentialManagement.credentialsTable.title', {
  defaultMessage: 'Credentials',
});

interface Props extends RouteComponentProps {
  canSave: boolean;
}

export const CredentialsTable = ({ canSave, history }: Props) => {
  const [credentials, setCredentials] = React.useState<CredentialsTableItem[]>([]);
  const [selectedCredentials, setSelectedCredentials] = React.useState<CredentialsTableItem[]>([]);
  const [toasts, setToasts] = React.useState<EuiGlobalToastListToast[]>([]);

  const { setBreadcrumbs } = useOpenSearchDashboards<CredentialManagementContext>().services;
  setBreadcrumbs(getListBreadcrumbs());

  const { savedObjects, uiSettings } = useOpenSearchDashboards<
    CredentialManagementContext
  >().services;

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
      field: 'credentialMaterialsType',
      name: 'Credential Type',
      truncateText: true,
      mobileOptions: {
        show: false,
      },
    },
  ];

  const onSelectionChange = (selected: CredentialsTableItem[]) => {
    setSelectedCredentials(selected);
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

  const onClickDelete = async () => {
    try {
      await deleteCredentials(savedObjects.client, selectedCredentials);
      // TODO: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2055
      const fetchedCredentials: CredentialsTableItem[] = await getCredentials(savedObjects.client);
      setCredentials(fetchedCredentials);
      setSelectedCredentials([]);
    } catch (e) {
      const deleteCredentialsFailMsg = (
        <FormattedMessage
          id="credentialManagement.credentialsTable.loadDeleteCredentialsFailMsg"
          defaultMessage="The credential saved objects delete failed with some errors. Please configure data_source.enabled and try it again."
        />
      );
      setToasts(
        toasts.concat([
          {
            title: deleteCredentialsFailMsg,
            id: deleteCredentialsFailMsg.props.id,
            color: 'warning',
            iconType: 'alert',
          },
        ])
      );
    }
  };

  const deleteButton = renderDeleteButton();

  React.useEffect(() => {
    (async function () {
      const fetchedCredentials: CredentialsTableItem[] = await getCredentials(savedObjects.client);
      setCredentials(fetchedCredentials);
    })();
  }, [history.push, credentials.length, uiSettings, savedObjects.client]);

  const createButton = canSave ? <CreateButton history={history} /> : <></>;

  const removeToast = (id: string) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  const renderContent = () => {
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
          <EuiFlexItem grow={false}>{deleteButton}</EuiFlexItem>
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

  return (
    <>
      {renderContent()}
      <EuiGlobalToastList
        toasts={toasts}
        dismissToast={({ id }) => {
          removeToast(id);
        }}
        toastLifeTimeMs={6000}
      />
    </>
  );
};

export const CredentialsTableWithRouter = withRouter(CredentialsTable);
