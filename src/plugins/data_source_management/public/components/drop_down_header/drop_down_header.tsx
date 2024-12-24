/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './drop_down_header.scss';
import { EuiFlexGroup, EuiFlexItem, EuiLink, EuiPopoverTitle } from '@elastic/eui';
import React from 'react';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { DSM_APP_ID } from '../../plugin';

interface DataSourceOptionItemProps {
  totalDataSourceCount: number;
  activeDataSourceCount?: number;
  application?: ApplicationStart;
  onManageDataSource: () => void;
}

export const DataSourceDropDownHeader: React.FC<DataSourceOptionItemProps> = ({
  activeDataSourceCount,
  totalDataSourceCount,
  application,
  onManageDataSource,
}) => {
  const dataSourceCounterPrefix = totalDataSourceCount === 1 ? 'DATA SOURCE' : 'DATA SOURCES';
  const dataSourceCounter =
    activeDataSourceCount !== undefined
      ? `${activeDataSourceCount}/${totalDataSourceCount}`
      : totalDataSourceCount;

  return (
    <EuiPopoverTitle paddingSize="s">
      <EuiFlexGroup responsive={false} alignItems="center">
        <EuiFlexItem>
          {dataSourceCounterPrefix} ({dataSourceCounter})
        </EuiFlexItem>
        <div tabIndex={0} className="dataSourceDropDownHeaderInvisibleFocusable" />
        <EuiFlexItem grow={false}>
          <EuiLink
            onClick={() => {
              onManageDataSource();
              application?.navigateToApp('management', {
                path: `opensearch-dashboards/${DSM_APP_ID}`,
              });
            }}
          >
            Manage
          </EuiLink>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPopoverTitle>
  );
};
