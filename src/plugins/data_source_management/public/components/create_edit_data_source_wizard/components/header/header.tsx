/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import {
  EuiBetaBadge,
  EuiSpacer,
  EuiTitle,
  EuiText,
  EuiCode,
  EuiLink,
  EuiFlexItem,
  EuiFlexGroup,
  EuiToolTip,
  EuiButtonIcon,
  EuiConfirmModal,
} from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { DocLinksStart } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext } from '../../../../types';

export const Header = ({
  prompt,
  showDeleteIcon,
  onClickDeleteIcon,
  dataSourceName,
  isBeta = false,
  docLinks,
}: {
  prompt?: React.ReactNode;
  dataSourceName: string;
  showDeleteIcon: boolean;
  onClickDeleteIcon: () => void;
  isBeta?: boolean;
  docLinks: DocLinksStart;
}) => {
  /* State Variables */
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const changeTitle = useOpenSearchDashboards<DataSourceManagementContext>().services.chrome
    .docTitle.change;

  const createDataSourceHeader = i18n.translate('dataSourcesManagement.createDataSourceHeader', {
    defaultMessage: ` ${dataSourceName}`,
    values: { dataSourceName },
  });

  changeTitle(createDataSourceHeader);

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
              {createDataSourceHeader}
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
          <EuiText>
            <p>
              <FormattedMessage
                id="dataSourcesManagement.createDataSource.description"
                defaultMessage="A data source is an OpenSearch cluster endpoint (for now) to query against."
                values={{
                  multiple: <strong>multiple</strong>,
                  single: <EuiCode>filebeat-4-3-22</EuiCode>,
                  star: <EuiCode>filebeat-*</EuiCode>,
                }}
              />
              <br />
              <EuiLink
                href={docLinks.links.noDocumentation.indexPatterns.introduction}
                target="_blank"
                external
              >
                <FormattedMessage
                  id="dataSourcesManagement.createDataSource.documentation"
                  defaultMessage="Read documentation"
                />
              </EuiLink>
            </p>
          </EuiText>
          {prompt ? (
            <>
              <EuiSpacer size="m" />
              {prompt}
            </>
          ) : null}
        </div>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>{showDeleteIcon ? renderDeleteButton() : null}</EuiFlexItem>
    </EuiFlexGroup>
  );
};
