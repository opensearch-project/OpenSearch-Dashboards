/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { useEffectOnce } from 'react-use';

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
  EuiConfirmModal,
  EuiLoadingSpinner,
  EuiOverlayMask,
  EuiGlobalToastList,
  EuiGlobalToastListToast,
} from '@elastic/eui';

import {
  reactRouterNavigate,
  useOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';

import { getListBreadcrumbs } from '../breadcrumbs';
import { CredentialManagementContext } from '../../types';
import { deleteCredentials, getCredentials } from '../utils';
import { LocalizedContent } from '../common';
import { CredentialsTableItem } from '../types';
import { CreateButton } from '../create_button';

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

const title = i18n.translate('credentialManagement.credentialsTable.title', {
  defaultMessage: 'Stored credentials',
});

interface Props extends RouteComponentProps {
  canSave: boolean;
}

export const CredentialsTable = ({ canSave, history }: Props) => {
  const [credentials, setCredentials] = React.useState<CredentialsTableItem[]>([]);
  const [selectedCredentials, setSelectedCredentials] = React.useState<CredentialsTableItem[]>([]);
  const { setBreadcrumbs } = useOpenSearchDashboards<CredentialManagementContext>().services;
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = React.useState(false);
  const [toasts, setToasts] = React.useState<EuiGlobalToastListToast[]>([]);

  const { savedObjects } = useOpenSearchDashboards<CredentialManagementContext>().services;

  const columns = [
    {
      field: 'title',
      name: 'Title',
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
      field: 'description',
      name: 'Description',
      truncateText: true,
      mobileOptions: {
        show: false,
      },
    },
    {
      field: 'credentialMaterialsType',
      name: 'Type',
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

  const onClickDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCredentials(savedObjects.client, selectedCredentials);

      const fetchedCredentials: CredentialsTableItem[] = await getCredentials(savedObjects.client);
      setCredentials(fetchedCredentials);
      setSelectedCredentials([]);

      setIsDeleting(false);
      setConfirmDeleteVisible(false);
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

  const removeToast = (id: string) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  const createButton = canSave ? <CreateButton history={history} /> : <></>;

  const renderDeleteButton = () => {
    let deleteButtonMsg = 'Delete';

    if (selectedCredentials.length === 1) {
      deleteButtonMsg = `${deleteButtonMsg} ${selectedCredentials.length} Credential`;
    } else if (selectedCredentials.length > 1) {
      deleteButtonMsg = `${deleteButtonMsg} ${selectedCredentials.length} Credentials`;
    }
    return (
      <EuiButton
        color="danger"
        iconType="trash"
        onClick={() => {
          setConfirmDeleteVisible(true);
        }}
        disabled={selectedCredentials.length === 0}
      >
        {deleteButtonMsg}
      </EuiButton>
    );
  };

  /* create a button to the right of search bar*/
  const renderToolsRight = () => {
    return (
      <EuiFlexItem key="delete" grow={false}>
        {renderDeleteButton()}
      </EuiFlexItem>
    );
  };

  const search = {
    toolsRight: renderToolsRight(),
    box: {
      incremental: true,
      schema: {
        fields: { title: { type: 'string' } },
      },
    },
  };

  /* Update breadcrumb*/
  useEffectOnce(() => {
    setBreadcrumbs(getListBreadcrumbs());
  });

  /* fetch credential*/
  useEffectOnce(() => {
    (async () => {
      setIsLoading(true);

      const fetchedCredentials: CredentialsTableItem[] = await getCredentials(savedObjects.client);
      setCredentials(fetchedCredentials);

      setIsLoading(false);
    })();
  });

  /* render delete modal*/
  const renderTableDeleteModal = () => {
    return confirmDeleteVisible ? (
      <EuiConfirmModal
        title={LocalizedContent.deleteButtonOnConfirmText}
        onCancel={() => {
          setConfirmDeleteVisible(false);
        }}
        onConfirm={() => {
          onClickDelete();
        }}
        cancelButtonText={LocalizedContent.cancelButtonOnDeleteCancelText}
        confirmButtonText={LocalizedContent.confirmButtonOnDeleteComfirmText}
        defaultFocusedButton="confirm"
      >
        <p>{LocalizedContent.deleteCredentialDescribeMsg}</p>
        <p>{LocalizedContent.deleteCredentialConfirmMsg}</p>
        <p>{LocalizedContent.deleteCredentialWarnMsg}</p>
      </EuiConfirmModal>
    ) : null;
  };

  const renderContent = () => {
    return (
      <EuiPageContent data-test-subj="credentialsTable" role="region">
        {isDeleting ? (
          <EuiOverlayMask>
            <EuiLoadingSpinner size="xl" />
          </EuiOverlayMask>
        ) : (
          <>
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

            {renderTableDeleteModal()}

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
              loading={isLoading}
            />
          </>
        )}
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
