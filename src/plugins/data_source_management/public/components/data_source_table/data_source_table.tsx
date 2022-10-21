/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiConfirmModal,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiPageContent,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React, { useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { useEffectOnce } from 'react-use';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { getListBreadcrumbs } from '../breadcrumbs';
import {
  reactRouterNavigate,
  useOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext, DataSourceTableItem, ToastMessageItem } from '../../types';
import { CreateButton } from '../create_button';
import { deleteMultipleDataSources, getDataSources } from '../utils';
import { LoadingMask } from '../loading_mask';

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

export const DataSourceTable = ({ history }: RouteComponentProps) => {
  const {
    chrome,
    setBreadcrumbs,
    savedObjects,
    notifications: { toasts },
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;

  /* Component state variables */
  const [dataSources, setDataSources] = useState<DataSourceTableItem[]>([]);
  const [selectedDataSources, setSelectedDataSources] = useState<DataSourceTableItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = React.useState(false);

  /* useEffectOnce hook to avoid these methods called multiple times when state is updated. */
  useEffectOnce(() => {
    /* Update breadcrumb*/
    setBreadcrumbs(getListBreadcrumbs());

    /* Browser - Page Title */
    chrome.docTitle.change(
      i18n.translate('dataSourcesManagement.dataSourcesTable.dataSourcesTitle', {
        defaultMessage: 'Data Sources',
      })
    );

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
          defaultMessage: 'Error occurred while fetching the records for Data sources.',
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
        onClick={() => {
          setConfirmDeleteVisible(true);
        }}
        data-test-subj="deleteDataSourceConnections"
        disabled={selectedDataSources.length === 0}
      >
        Delete {selectedDataSources.length || ''} {selectedDataSources.length ? 'connection' : ''}
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
          <EuiButtonEmpty size="xs" {...reactRouterNavigate(history, `${index.id}`)}>
            {name}
          </EuiButtonEmpty>
        </>
      ),
      dataType: 'string' as const,
      sortable: ({ title }: { title: string }) => title,
    },
    {
      field: 'description',
      name: 'Description',
      truncateText: true,
      mobileOptions: {
        show: false,
      },
      dataType: 'string' as const,
      sortable: ({ description }: { description: string }) => description,
    },
  ];

  /* render delete modal*/
  const tableRenderDeleteModal = () => {
    return confirmDeleteVisible ? (
      <EuiConfirmModal
        title={i18n.translate('dataSourcesManagement.dataSourcesTable.multiDeleteTitle', {
          defaultMessage: 'Delete data source connection(s)',
        })}
        onCancel={() => {
          setConfirmDeleteVisible(false);
        }}
        onConfirm={() => {
          setConfirmDeleteVisible(false);
          onClickDelete();
        }}
        cancelButtonText={i18n.translate('dataSourcesManagement.dataSourcesTable.cancel', {
          defaultMessage: 'Cancel',
        })}
        confirmButtonText={i18n.translate('dataSourcesManagement.dataSourcesTable.delete', {
          defaultMessage: 'Delete',
        })}
        buttonColor="danger"
        defaultFocusedButton="confirm"
      >
        <p>
          {
            <FormattedMessage
              id="dataSourcesManagement.dataSourcesTable.deleteDescription"
              defaultMessage="This action will delete the selected data source connections"
            />
          }
        </p>
        <p>
          {
            <FormattedMessage
              id="dataSourcesManagement.dataSourcesTable.deleteConfirmation"
              defaultMessage="Any objects created using data from these sources, including Index Patterns, Visualizations, and Observability Panels, will be impacted."
            />
          }
        </p>
        <p>
          {
            <FormattedMessage
              id="dataSourcesManagement.dataSourcesTable.deleteWarning"
              defaultMessage="This action cannot be undone."
            />
          }
        </p>
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
            'Error occurred while deleting selected records for Data sources. Please try it again',
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

  const handleDisplayToastMessage = ({ id, defaultMessage }: ToastMessageItem) => {
    toasts.addDanger(
      i18n.translate(id, {
        defaultMessage,
      })
    );
  };

  /* Render Ui elements*/
  /* Create Data Source button */
  const createButton = <CreateButton history={history} dataTestSubj="createDataSourceButton" />;
  const createButtonEmptyState = (
    <CreateButton
      history={history}
      isEmptyState={true}
      dataTestSubj="createDataSourceButtonEmptyState"
    />
  );

  /* Render header*/
  const renderHeader = () => {
    return (
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiTitle>
            <h2>
              {
                <FormattedMessage
                  id="dataSourcesManagement.dataSourcesTable.title"
                  defaultMessage="Data Sources"
                />
              }
            </h2>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiText>
            <p>
              {
                <FormattedMessage
                  id="dataSourcesManagement.dataSourcesTable.description"
                  defaultMessage="Create and manage data source connections to help you retrieve data from multiple OpenSearch compatible sources."
                />
              }
            </p>
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
      </>
    );
  };

  const renderEmptyState = () => {
    return (
      <>
        <EuiSpacer size="l" />
        <EuiPanel
          hasBorder={false}
          hasShadow={false}
          style={{ textAlign: 'center' }}
          data-test-subj="datasourceTableEmptyState"
        >
          <EuiText>
            {
              <FormattedMessage
                id="dataSourcesManagement.dataSourcesTable.noData"
                defaultMessage="No Data Source Connections have been created yet."
              />
            }
          </EuiText>
          <EuiSpacer />
          {createButtonEmptyState}
        </EuiPanel>
        <EuiSpacer size="l" />
      </>
    );
  };

  const renderContent = () => {
    return (
      <>
        <EuiPageContent
          data-test-subj="dataSourceTable"
          role="region"
          aria-label={i18n.translate('dataSourcesManagement.createDataSourcesLiveRegionAriaLabel', {
            defaultMessage: 'Data Sources',
          })}
        >
          {/* Header */}
          {renderHeader()}

          <EuiSpacer />

          {/* Delete confirmation modal*/}
          {tableRenderDeleteModal()}

          {!isLoading && (!dataSources || !dataSources.length)
            ? renderEmptyState()
            : renderTableContent()}
        </EuiPageContent>
        {isDeleting ? <LoadingMask /> : null}
      </>
    );
  };

  return renderContent();
};

export const DataSourceTableWithRouter = withRouter(DataSourceTable);
