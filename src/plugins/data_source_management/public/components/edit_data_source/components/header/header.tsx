/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import {
  EuiBetaBadge,
  EuiSpacer,
  EuiTitle,
  EuiFlexItem,
  EuiFlexGroup,
  EuiToolTip,
  EuiButtonIcon,
  EuiConfirmModal,
} from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext } from '../../../../types';

export const Header = ({
  showDeleteIcon,
  onClickDeleteIcon,
  isBeta = false,
  dataSourceName,
}: {
  showDeleteIcon: boolean;
  onClickDeleteIcon: () => void;
  isBeta?: boolean;
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
        <EuiToolTip content="Delete this Data Source">
          <EuiButtonIcon
            color="danger"
            onClick={() => {
              setIsDeleteModalVisible(true);
            }}
            iconType="trash"
            iconSize="m"
            size="m"
            aria-label="Delete this data source"
          />
        </EuiToolTip>

        {isDeleteModalVisible ? (
          <EuiConfirmModal
            title="Delete Data Source permanently?"
            onCancel={() => {
              setIsDeleteModalVisible(false);
            }}
            onConfirm={() => {
              setIsDeleteModalVisible(false);
              onClickDeleteIcon();
            }}
            cancelButtonText="Cancel"
            confirmButtonText="Delete"
            defaultFocusedButton="confirm"
          >
            <p>
              This will delete data source and all Index Patterns using this credential will be
              invalid for access.
            </p>
            <p>To confirm deletion, click delete button.</p>
            <p>Note: this action is irrevocable!</p>
          </EuiConfirmModal>
        ) : null}
      </>
    );
  };

  return (
    <EuiFlexGroup justifyContent="spaceBetween">
      <EuiFlexItem grow={false}>
        <div>
          <EuiTitle>
            <h1>
              {dataSourceName}
              {isBeta ? (
                <>
                  <EuiBetaBadge
                    label={i18n.translate('dataSourcesManagement.createDataSource.betaLabel', {
                      defaultMessage: 'Beta',
                    })}
                  />
                </>
              ) : null}
            </h1>
          </EuiTitle>
          <EuiSpacer size="s" />
        </div>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>{showDeleteIcon ? renderDeleteButton() : null}</EuiFlexItem>
    </EuiFlexGroup>
  );
};
