/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import {
  EuiButton,
  EuiButtonEmpty,
  EuiContextMenuPanel,
  EuiHorizontalRule,
  EuiPanel,
  EuiPopover,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { FormattedMessage } from 'react-intl';
import { DataSourceDropDownHeader } from '../drop_down_header';
import { DSM_APP_ID } from '../../plugin';

interface DataSourceDropDownHeaderProps {
  totalDataSourceCount: number;
  activeDataSourceCount?: number;
  application?: ApplicationStart;
}

export const NoDataSource: React.FC<DataSourceDropDownHeaderProps> = ({
  activeDataSourceCount,
  totalDataSourceCount,
  application,
}) => {
  const [showPopover, setShowPopover] = useState<boolean>(false);
  const label = ' No data sources';
  const button = (
    <EuiButtonEmpty
      className="euiHeaderLink"
      data-test-subj="dataSourceEmptyStateHeaderButton"
      iconType="alert"
      iconSide="left"
      size="s"
      color="primary"
      onClick={() => {
        setShowPopover(!showPopover);
      }}
    >
      {label}
    </EuiButtonEmpty>
  );

  const redirectButton = (
    <EuiButton
      iconType="popout"
      iconSide="right"
      data-test-subj="dataSourceEmptyStateManageDataSourceButton"
      fill={false}
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
      <EuiText>
        {
          <FormattedMessage
            id="dataSourcesManagement.dataSourceMenu.noData"
            defaultMessage="There is no data sources to display."
          />
        }
      </EuiText>

      <EuiText>
        {
          <FormattedMessage
            id="dataSourcesManagement.dataSourceMenu.connect"
            defaultMessage="Connect data source to get started"
          />
        }
      </EuiText>
    </>
  );

  return (
    <EuiPopover
      initialFocus={'.euiSelectableSearch'}
      id={'dataSourceEmptyStatePopover'}
      button={button}
      isOpen={showPopover}
      closePopover={() => setShowPopover(false)}
      panelPaddingSize="none"
      anchorPosition="downLeft"
      data-test-subj={'dataSourceEmptyStatePopover'}
    >
      <EuiContextMenuPanel>
        <EuiPanel className={'dataSourceSelectableOuiPanel'} color="transparent" paddingSize="s">
          <DataSourceDropDownHeader
            activeDataSourceCount={activeDataSourceCount}
            totalDataSourceCount={totalDataSourceCount}
            application={application}
          />
          <EuiHorizontalRule margin="none" />
          <EuiSpacer size="s" />
          <EuiPanel
            hasBorder={false}
            hasShadow={false}
            className="dataSourceEmptyStatePanel"
            data-test-subj="datasourceTableEmptyState"
          >
            {text}
            <EuiSpacer />
            {redirectButton}
          </EuiPanel>
        </EuiPanel>
      </EuiContextMenuPanel>
    </EuiPopover>
  );
};
