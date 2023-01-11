/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import {
  EuiSpacer,
  EuiTitle,
  EuiFlexItem,
  EuiFlexGroup,
  EuiToolTip,
  EuiButtonIcon,
  EuiConfirmModal,
  EuiButton,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext } from '../../../../types';

export const Header = ({
  showDeleteIcon,
  isFormValid,
  onClickDeleteIcon,
  onClickTestConnection,
  dataSourceName,
}: {
  showDeleteIcon: boolean;
  isFormValid: boolean;
  onClickDeleteIcon: () => void;
  onClickTestConnection: () => void;
  dataSourceName: string;
}) => {
  /* State Variables */
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const changeTitle = useOpenSearchDashboards<DataSourceManagementContext>().services.chrome
    .docTitle.change;

  changeTitle(dataSourceName);

  const renderDeleteButton = () => {
    return (
      <>
        <EuiToolTip
          content={i18n.translate('dataSourcesManagement.editDataSource.deleteThisDataSource', {
            defaultMessage: 'Delete this Data Source',
          })}
        >
          <EuiButtonIcon
            color="danger"
            data-test-subj="editDatasourceDeleteIcon"
            onClick={() => {
              setIsDeleteModalVisible(true);
            }}
            iconType="trash"
            iconSize="m"
            size="m"
            aria-label={i18n.translate(
              'dataSourcesManagement.editDataSource.deleteThisDataSource',
              {
                defaultMessage: 'Delete this Data Source',
              }
            )}
          />
        </EuiToolTip>

        {isDeleteModalVisible ? (
          <EuiConfirmModal
            title={i18n.translate('dataSourcesManagement.editDataSource.deleteTitle', {
              defaultMessage: 'Delete data source connection',
            })}
            onCancel={() => {
              setIsDeleteModalVisible(false);
            }}
            onConfirm={() => {
              setIsDeleteModalVisible(false);
              onClickDeleteIcon();
            }}
            cancelButtonText={i18n.translate('dataSourcesManagement.editDataSource.cancel', {
              defaultMessage: 'Cancel',
            })}
            confirmButtonText={i18n.translate('dataSourcesManagement.editDataSource.delete', {
              defaultMessage: 'Delete',
            })}
            buttonColor="danger"
            defaultFocusedButton="confirm"
            data-test-subj="editDatasourceDeleteConfirmModal"
          >
            <p>
              {
                <FormattedMessage
                  id="dataSourcesManagement.editDataSource.deleteConfirmation"
                  defaultMessage="Any objects created using data from these sources, including Index Patterns, Visualizations, and Observability Panels, will be impacted."
                />
              }
            </p>
            <p>
              {
                <FormattedMessage
                  id="dataSourcesManagement.editDataSource.deleteWarning"
                  defaultMessage="This action cannot be undone."
                />
              }
            </p>
          </EuiConfirmModal>
        ) : null}
      </>
    );
  };
  const renderTestConnectionButton = () => {
    return (
      <EuiButton
        type="submit"
        fill={false}
        disabled={!isFormValid}
        onClick={() => {
          onClickTestConnection();
        }}
        data-test-subj="datasource-edit-testConnectionButton"
      >
        <FormattedMessage
          id="dataSourcesManagement.createDataSource.testConnectionButton"
          defaultMessage="Test connection"
        />
      </EuiButton>
    );
  };

  return (
    <EuiFlexGroup justifyContent="spaceBetween">
      {/* Title */}
      <EuiFlexItem grow={false}>
        <div>
          <EuiTitle data-test-subj="editDataSourceTitle">
            <h1>{dataSourceName}</h1>
          </EuiTitle>
          <EuiSpacer size="s" />
        </div>
      </EuiFlexItem>

      {/* Right side buttons */}
      <EuiFlexItem grow={false}>
        <EuiFlexGroup alignItems="baseline" gutterSize="m" responsive={false}>
          {/* Test connection button */}
          <EuiFlexItem grow={false}>{renderTestConnectionButton()}</EuiFlexItem>
          {/* Delete icon button */}
          <EuiFlexItem grow={false}>{showDeleteIcon ? renderDeleteButton() : null}</EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
