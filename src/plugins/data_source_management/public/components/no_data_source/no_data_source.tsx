/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';

import {
  EuiButton,
  EuiPanel,
  EuiPopover,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
} from '@elastic/eui';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { FormattedMessage } from 'react-intl';
import { DataSourceDropDownHeader } from '../drop_down_header';
import { DSM_APP_ID } from '../../plugin';
import { EmptyIcon } from '../custom_database_icon';
import {
  ADD_COMPATIBLE_DATASOURCES_MESSAGE,
  CONNECT_DATASOURCES_MESSAGE,
  NO_COMPATIBLE_DATASOURCES_MESSAGE,
  NO_DATASOURCES_CONNECTED_MESSAGE,
} from '../constants';

interface DataSourceDropDownHeaderProps {
  incompatibleDataSourcesExist: boolean;
  application?: ApplicationStart;
}

export const NoDataSource: React.FC<DataSourceDropDownHeaderProps> = ({
  application,
  incompatibleDataSourcesExist,
}) => {
  const [showPopover, setShowPopover] = useState<boolean>(false);
  const button = (
    <EuiButtonIcon
      className="euiHeaderLink"
      data-test-subj="dataSourceEmptyMenuHeaderLink"
      aria-label={i18n.translate('dataSourceEmpty.dataSourceEmptyMenuHeaderLink', {
        defaultMessage: 'dataSourceEmptyMenuHeaderLink',
      })}
      iconType={() => <EmptyIcon />}
      size="s"
      onClick={() => setShowPopover(!showPopover)}
    />
  );

  const redirectButton = (
    <EuiButton
      data-test-subj="dataSourceEmptyStateManageDataSourceButton"
      fill={false}
      size="s"
      onClick={() =>
        application?.navigateToApp('management', {
          path: `opensearch-dashboards/${DSM_APP_ID}`,
        })
      }
    >
      <FormattedMessage
        id="dataSourcesManagement.dataSourceMenu.manageDataSource"
        defaultMessage="Manage data sources"
      />
    </EuiButton>
  );
  const text = (
    <>
      <EuiText size="s" textAlign="center">
        {
          <FormattedMessage
            id="dataSourcesManagement.dataSourceEmptyMenu.noData"
            defaultMessage={
              incompatibleDataSourcesExist
                ? NO_COMPATIBLE_DATASOURCES_MESSAGE
                : NO_DATASOURCES_CONNECTED_MESSAGE
            }
          />
        }
      </EuiText>

      <EuiText size="s" textAlign="center">
        {
          <FormattedMessage
            id="dataSourcesManagement.dataSourceEmptyMenu.connect"
            defaultMessage={
              incompatibleDataSourcesExist
                ? ADD_COMPATIBLE_DATASOURCES_MESSAGE
                : CONNECT_DATASOURCES_MESSAGE
            }
          />
        }
      </EuiText>
    </>
  );

  return (
    <EuiPopover
      id={'dataSourceEmptyStatePopover'}
      button={button}
      isOpen={showPopover}
      closePopover={() => setShowPopover(false)}
      panelPaddingSize="none"
      anchorPosition="downLeft"
      data-test-subj={'dataSourceEmptyStatePopover'}
    >
      <DataSourceDropDownHeader totalDataSourceCount={0} application={application} />
      <EuiPanel
        hasBorder={false}
        hasShadow={false}
        className="dataSourceEmptyStatePanel"
        data-test-subj="dataSourceEmptyStatePanel"
      >
        <EuiFlexGroup justifyContent={'center'}>
          <EuiFlexItem grow={false}>{text}</EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup justifyContent={'center'}>
          <EuiFlexItem grow={false}>{redirectButton}</EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </EuiPopover>
  );
};
