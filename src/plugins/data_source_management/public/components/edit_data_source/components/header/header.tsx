/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import {
  EuiSpacer,
  EuiFlexItem,
  EuiFlexGroup,
  EuiToolTip,
  EuiSmallButtonIcon,
  EuiConfirmModal,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiText,
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
  onClickSetDefault,
  dataSourceName,
  isDefault,
  canManageDataSource,
}: {
  showDeleteIcon: boolean;
  isFormValid: boolean;
  onClickDeleteIcon: () => void;
  onClickTestConnection: () => void;
  onClickSetDefault: () => void;
  dataSourceName: string;
  isDefault: boolean;
  canManageDataSource: boolean;
}) => {
  /* State Variables */
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDefaultDataSourceState, setIsDefaultDataSourceState] = useState(isDefault);

  const changeTitle = useOpenSearchDashboards<DataSourceManagementContext>().services.chrome
    .docTitle.change;

  changeTitle(dataSourceName);

  const setDefaultAriaLabel = i18n.translate(
    'dataSourcesManagement.editDataSource.setDefaultDataSource',
    {
      defaultMessage: 'Set as a default Data Source.',
    }
  );

  const renderDefaultIcon = () => {
    return (
      <EuiSmallButtonEmpty
        onClick={() => {
          onClickSetDefault();
          setIsDefaultDataSourceState(!isDefaultDataSourceState);
        }}
        disabled={isDefaultDataSourceState}
        iconType={isDefaultDataSourceState ? 'starFilled' : 'starEmpty'}
        aria-label={setDefaultAriaLabel}
        data-test-subj="editSetDefaultDataSource"
      >
        {isDefaultDataSourceState ? 'Default' : 'Set as default'}
      </EuiSmallButtonEmpty>
    );
  };

  const renderDeleteButton = () => {
    return (
      <>
        <EuiToolTip
          content={i18n.translate('dataSourcesManagement.editDataSource.deleteThisDataSource', {
            defaultMessage: 'Delete this Data Source',
          })}
        >
          <EuiSmallButtonIcon
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
            <EuiText size="s">
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
            </EuiText>
          </EuiConfirmModal>
        ) : null}
      </>
    );
  };
  const renderTestConnectionButton = () => {
    return (
      <EuiSmallButton
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
      </EuiSmallButton>
    );
  };

  return (
    <EuiFlexGroup justifyContent="spaceBetween">
      {/* Title */}
      <EuiFlexItem grow={false}>
        <div>
          <EuiText size="s" data-test-subj="editDataSourceTitle">
            <h1>{dataSourceName}</h1>
          </EuiText>
          <EuiSpacer size="s" />
        </div>
      </EuiFlexItem>

      {/* Right side buttons */}
      <EuiFlexItem grow={false}>
        <EuiFlexGroup alignItems="baseline" gutterSize="m" responsive={false}>
          {/* Test default button */}
          <EuiFlexItem grow={false}>{renderDefaultIcon()}</EuiFlexItem>
          {/* Test connection button */}
          <EuiFlexItem grow={false}>{renderTestConnectionButton()}</EuiFlexItem>
          {/* Delete icon button */}
          {canManageDataSource ? (
            <EuiFlexItem grow={false}>{showDeleteIcon ? renderDeleteButton() : null}</EuiFlexItem>
          ) : null}
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
