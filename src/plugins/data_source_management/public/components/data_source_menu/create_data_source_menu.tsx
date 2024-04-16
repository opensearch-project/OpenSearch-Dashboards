/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiHeaderLinks } from '@elastic/eui';
import { IUiSettingsClient } from 'src/core/public';
import { DataSourcePluginSetup } from 'src/plugins/data_source/public';
import { DataSourceMenu } from './data_source_menu';
import { DataSourceMenuProps } from './types';
import { MountPointPortal } from '../../../../opensearch_dashboards_react/public';
import { getApplication } from '../utils';

export function createDataSourceMenu<T>(
  uiSettings: IUiSettingsClient,
  dataSourcePluginSetup: DataSourcePluginSetup
) {
  const application = getApplication();
  return (props: DataSourceMenuProps<T>) => {
    const { hideLocalCluster } = dataSourcePluginSetup;
    if (props.setMenuMountPoint) {
      return (
        <MountPointPortal setMountPoint={props.setMenuMountPoint}>
          <EuiHeaderLinks data-test-subj="top-nav" gutterSize="xs">
            <DataSourceMenu
              {...props}
              uiSettings={uiSettings}
              hideLocalCluster={hideLocalCluster}
              application={application}
            />
          </EuiHeaderLinks>
        </MountPointPortal>
      );
    }
    return (
      <DataSourceMenu
        {...props}
        uiSettings={uiSettings}
        hideLocalCluster={hideLocalCluster}
        application={application}
      />
    );
  };
}
