/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { ApplicationStart } from 'opensearch-dashboards/public';
import {
  EuiButtonIcon,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPopover,
  EuiPopoverFooter,
  EuiText,
} from '@elastic/eui';
import { ErrorIcon } from '../custom_database_icon';
import { DataSourceDropDownHeader } from '../drop_down_header';

interface DataSourceErrorMenuProps {
  application?: ApplicationStart;
}

export const DataSourceErrorMenu = ({ application }: DataSourceErrorMenuProps) => {
  const [showPopover, setShowPopover] = useState<boolean>(false);

  const refreshButton = (
    <EuiButton
      data-test-subj="dataSourceErrorRefreshButton"
      fill={false}
      iconType={'refresh'}
      size="s"
      onClick={() => window.location.reload()}
    >
      {i18n.translate('dataSourcesManagement.dataSourceErrorMenu.refreshPage', {
        defaultMessage: 'Refresh the page',
      })}
    </EuiButton>
  );

  const iconButton = (
    <EuiButtonIcon
      className="euiHeaderLink"
      data-test-subj="dataSourceErrorMenuHeaderLink"
      aria-label={i18n.translate(
        'dataSourcesManagement.dataSourceError.dataSourceErrorMenuHeaderLink',
        {
          defaultMessage: 'dataSourceErrorMenuHeaderLink',
        }
      )}
      iconType={() => <ErrorIcon />}
      size="s"
      onClick={() => setShowPopover(!showPopover)}
    />
  );

  return (
    <>
      <EuiPopover
        id={'dataSourceErrorPopover'}
        button={iconButton}
        isOpen={showPopover}
        closePopover={() => setShowPopover(false)}
        panelPaddingSize="none"
        anchorPosition="downLeft"
        data-test-subj={'dataSourceErrorPopover'}
      >
        <DataSourceDropDownHeader totalDataSourceCount={0} application={application} />
        <EuiPanel
          hasBorder={false}
          hasShadow={false}
          className="dataSourceEmptyStatePanel"
          data-test-subj="datasourceTableEmptyState"
        >
          <EuiText size="s" textAlign="center">
            {i18n.translate('dataSourcesManagement.dataSourceErrorMenu.text', {
              defaultMessage: 'Failed to fetch data sources',
            })}
          </EuiText>
        </EuiPanel>
        <EuiPopoverFooter>
          <EuiFlexGroup justifyContent="spaceAround">
            <EuiFlexItem>{refreshButton}</EuiFlexItem>
          </EuiFlexGroup>
        </EuiPopoverFooter>
      </EuiPopover>
    </>
  );
};
