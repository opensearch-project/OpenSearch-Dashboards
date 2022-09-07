/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBadge,
  EuiBadgeGroup,
  EuiButton,
  EuiButtonEmpty,
  EuiConfirmModal,
  EuiFlexGroup,
  EuiFlexItem,
  EuiGlobalToastList,
  EuiGlobalToastListToast,
  EuiInMemoryTable,
  EuiPageContent,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React, { useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { FormattedMessage } from '@osd/i18n/react';
import { useEffectOnce } from 'react-use';
import { getListBreadcrumbs } from '../breadcrumbs';
import {
  reactRouterNavigate,
  useOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext, DataSourceTableItem, ToastMessageItem } from '../../types';
import { CreateButton } from '../create_button';
import { deleteMultipleDataSources, getDataSources } from '../utils';
import { LoadingMask } from '../loading_mask';
import {
  cancelText,
  deleteText,
  dsListingAriaRegion,
  dsListingDeleteDataSourceConfirmation,
  dsListingDeleteDataSourceDescription,
  dsListingDeleteDataSourceTitle,
  dsListingDeleteDataSourceWarning,
  dsListingDescription,
  dsListingPageTitle,
  dsListingTitle,
} from '../text_content/text_content';

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

const toastLifeTimeMs = 6000;

export const DataSourceTable = ({ history }: RouteComponentProps) => {
  const { chrome, setBreadcrumbs, savedObjects } = useOpenSearchDashboards<
    DataSourceManagementContext
  >().services;

  /* Component state variables */
  const [dataSources, setDataSources] = useState<DataSourceTableItem[]>([]);
  const [selectedDataSources, setSelectedDataSources] = useState<DataSourceTableItem[]>([]);
  const [toasts, setToasts] = React.useState<EuiGlobalToastListToast[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = React.useState(false);

  /* useEffectOnce hook to avoid these methods called multiple times when state is updated. */
  useEffectOnce(() => {
    /* Update breadcrumb*/
    setBreadcrumbs(getListBreadcrumbs());

    /* Browser - Page Title */
    chrome.docTitle.change(dsListingPageTitle);

    /* fetch data sources*/
    fetchDataSources();
  });

  const fetchDataSources = () => {
    setIsLoading(true);
    getDataSources(savedObjects.client)
      .then((response: DataSourceTableItem[]) => {
        setDataSources(response);
      })
      .catch(() => {
        setDataSources([]);
        handleDisplayToastMessage({
          id: 'dataSourcesManagement.dataSourceListing.fetchDataSourceFailMsg',
          defaultMessage:
            'Error occurred while fetching the records for Data sources. Please try it again',
          color: 'warning',
          iconType: 'alert',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  /* Table search config */
  const renderDeleteButton = () => {
    return (
      <EuiButton
        color="danger"
        iconType="trash"
        onClick={() => {
          setConfirmDeleteVisible(true);
        }}
        disabled={selectedDataSources.length === 0}
      >
        Delete {selectedDataSources.length || ''} connection
        {selectedDataSources.length >= 2 ? 's' : ''}
      </EuiButton>
    );
  };

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
    {
      field: 'description',
      name: 'Description',
      truncateText: true,
      mobileOptions: {
        show: false,
      },
      dataType: 'string' as const,
      sortable: ({ sort }: { sort: string }) => sort,
    },
  ];

  /* render delete modal*/
  const tableRenderDeleteModal = () => {
    return confirmDeleteVisible ? (
      <EuiConfirmModal
        title={dsListingDeleteDataSourceTitle}
        onCancel={() => {
          setConfirmDeleteVisible(false);
        }}
        onConfirm={() => {
          setConfirmDeleteVisible(false);
          onClickDelete();
        }}
        cancelButtonText={cancelText}
        confirmButtonText={deleteText}
        defaultFocusedButton="confirm"
      >
        <p>{dsListingDeleteDataSourceDescription}</p>
        <p>{dsListingDeleteDataSourceConfirmation}</p>
        <p>{dsListingDeleteDataSourceWarning}</p>
      </EuiConfirmModal>
    ) : null;
  };

  /* Delete selected data sources*/
  const onClickDelete = () => {
    setIsDeleting(true);

    deleteMultipleDataSources(savedObjects.client, selectedDataSources)
      .then(() => {
        setSelectedDataSources([]);
        // Fetch data sources
        fetchDataSources();
        setConfirmDeleteVisible(false);
      })
      .catch(() => {
        handleDisplayToastMessage({
          id: 'dataSourcesManagement.dataSourceListing.deleteDataSourceFailMsg',
          defaultMessage:
            'Error occurred while deleting few/all selected records for Data sources. Please try it again',
          color: 'warning',
          iconType: 'alert',
        });
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  /* Table selection handlers */
  const onSelectionChange = (selected: DataSourceTableItem[]) => {
    setSelectedDataSources(selected);
  };

  const selection = {
    onSelectionChange,
  };

  /* Toast Handlers */
  const removeToast = (id: string) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  const handleDisplayToastMessage = ({ id, defaultMessage, color, iconType }: ToastMessageItem) => {
    if (id && defaultMessage && color && iconType) {
      const failureMsg = <FormattedMessage id={id} defaultMessage={defaultMessage} />;
      setToasts([
        ...toasts,
        {
          title: failureMsg,
          id: failureMsg.props.id,
          color,
          iconType,
        },
      ]);
    }
  };

  /* Render Ui elements*/
  /* Create Data Source button */
  const createButton = <CreateButton history={history} />;

  /* Render header*/
  const renderHeader = () => {
    return (
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiTitle>
            <h2>{dsListingTitle}</h2>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiText>
            <p>{dsListingDescription}</p>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>{createButton}</EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  /* Render table */
  const renderTableContent = () => {
    return (
      <>
        <EuiPageContent
          data-test-subj="dataSourceTable"
          role="region"
          aria-label={dsListingAriaRegion}
        >
          {/* Header */}
          {renderHeader()}

          <EuiSpacer />

          {/* Delete confirmation modal*/}
          {tableRenderDeleteModal()}

          {/* Data sources table*/}
          <EuiInMemoryTable
            allowNeutralSort={false}
            itemId="id"
            isSelectable={true}
            selection={selection}
            items={dataSources}
            columns={columns}
            pagination={pagination}
            sorting={sorting}
            search={search}
            loading={isLoading}
          />
        </EuiPageContent>
        {isDeleting ? <LoadingMask /> : null}
      </>
    );
  };

  const renderContent = () => {
    return (
      <>
        {renderTableContent()}
        {}
      </>
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
        toastLifeTimeMs={toastLifeTimeMs}
      />
    </>
  );
};

export const DataSourceTableWithRouter = withRouter(DataSourceTable);
