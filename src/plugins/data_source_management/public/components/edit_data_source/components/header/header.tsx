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
  CANCEL_TEXT,
  DELETE_TEXT,
  DS_LISTING_DATA_SOURCE_DELETE_IMPACT,
  DS_LISTING_DATA_SOURCE_DELETE_WARNING,
  DELETE_THIS_DATA_SOURCE,
  DS_UPDATE_DATA_SOURCE_DELETE_TITLE,
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
        <EuiToolTip content={DELETE_THIS_DATA_SOURCE}>
          <EuiButtonIcon
            color="danger"
            onClick={() => {
              setIsDeleteModalVisible(true);
            }}
            iconType="trash"
            iconSize="m"
            size="m"
            aria-label={DELETE_THIS_DATA_SOURCE}
          />
        </EuiToolTip>

        {isDeleteModalVisible ? (
          <EuiConfirmModal
            title={DS_UPDATE_DATA_SOURCE_DELETE_TITLE}
            onCancel={() => {
              setIsDeleteModalVisible(false);
            }}
            onConfirm={() => {
              setIsDeleteModalVisible(false);
              onClickDeleteIcon();
            }}
            cancelButtonText={CANCEL_TEXT}
            confirmButtonText={DELETE_TEXT}
            defaultFocusedButton="confirm"
          >
            <p>{DS_LISTING_DATA_SOURCE_DELETE_IMPACT}</p>
            <p>{DS_LISTING_DATA_SOURCE_DELETE_WARNING}</p>
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
