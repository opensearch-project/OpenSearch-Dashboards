/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiHeaderLinks } from '@elastic/eui';
import { UiSettingScope } from 'opensearch-dashboards/public';
import { DataSourceMenu } from './data_source_menu';
import { DataSourceMenuProps } from './types';
import { MountPointPortal } from '../../../../opensearch_dashboards_react/public';
import { getApplication, getHideLocalCluster, getUiSettings, getWorkspaces } from '../utils';

export function createDataSourceMenu<T>() {
  const application = getApplication();
  const uiSettings = getUiSettings();
  const workspaces = getWorkspaces();
  const currentWorkspaceId = workspaces.currentWorkspaceId$.getValue();

  const scope: UiSettingScope = !!currentWorkspaceId
    ? UiSettingScope.WORKSPACE
    : UiSettingScope.GLOBAL;

  const hideLocalCluster = getHideLocalCluster().enabled;
  return (
    props: Omit<DataSourceMenuProps<T>, 'uiSettings' | 'hideLocalCluster' | 'application' | 'scope'>
  ) => {
    if (props.setMenuMountPoint) {
      return (
        <MountPointPortal setMountPoint={props.setMenuMountPoint}>
          <EuiHeaderLinks data-test-subj="top-nav" gutterSize="xs" popoverBreakpoints={'none'}>
            <DataSourceMenu
              {...props}
              uiSettings={uiSettings}
              hideLocalCluster={hideLocalCluster}
              application={application}
              scope={scope}
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
        scope={scope}
      />
    );
  };
}
