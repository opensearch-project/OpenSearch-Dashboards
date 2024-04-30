/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiHeaderLinks } from '@elastic/eui';
import { DataSourceMenu } from './data_source_menu';
import { DataSourceMenuProps } from './types';
import { MountPointPortal } from '../../../../opensearch_dashboards_react/public';
import { getApplication, getHideLocalCluster, getUiSettings } from '../utils';

export function createDataSourceMenu<T>() {
  const application = getApplication();
  const uiSettings = getUiSettings();
  const hideLocalCluster = getHideLocalCluster().enabled;
  return (props: DataSourceMenuProps<T>) => {
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
