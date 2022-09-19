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
} from '@elastic/eui';

import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext } from '../../../../types';
import {
  cancelText,
  deleteText,
  deleteThisDataSource,
  dsListingDeleteDataSourceConfirmation,
  dsListingDeleteDataSourceDescription,
  dsListingDeleteDataSourceTitle,
  dsListingDeleteDataSourceWarning,
} from '../../../text_content';

export const Header = ({
  showDeleteIcon,
  onClickDeleteIcon,
  dataSourceName,
}: {
  showDeleteIcon: boolean;
  onClickDeleteIcon: () => void;
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
        <EuiToolTip content={deleteThisDataSource}>
          <EuiButtonIcon
            color="danger"
            onClick={() => {
              setIsDeleteModalVisible(true);
            }}
            iconType="trash"
            iconSize="m"
            size="m"
            aria-label={deleteThisDataSource}
          />
        </EuiToolTip>

        {isDeleteModalVisible ? (
          <EuiConfirmModal
            title={dsListingDeleteDataSourceTitle}
            onCancel={() => {
              setIsDeleteModalVisible(false);
            }}
            onConfirm={() => {
              setIsDeleteModalVisible(false);
              onClickDeleteIcon();
            }}
            cancelButtonText={cancelText}
            confirmButtonText={deleteText}
            defaultFocusedButton="confirm"
          >
            <p>{dsListingDeleteDataSourceDescription}</p>
            <p>{dsListingDeleteDataSourceConfirmation}</p>
            <p>{dsListingDeleteDataSourceWarning}</p>
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
            <h1>{dataSourceName}</h1>
          </EuiTitle>
          <EuiSpacer size="s" />
        </div>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>{showDeleteIcon ? renderDeleteButton() : null}</EuiFlexItem>
    </EuiFlexGroup>
  );
};
