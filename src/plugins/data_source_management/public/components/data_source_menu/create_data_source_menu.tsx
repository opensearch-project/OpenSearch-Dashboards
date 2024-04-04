/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiHeaderLinks } from '@elastic/eui';
import { IUiSettingsClient } from 'src/core/public';
import { DataSourceMenu } from './data_source_menu';
import { DataSourceMenuProps } from './types';
import { MountPointPortal } from '../../../../opensearch_dashboards_react/public';

export function createDataSourceMenu<T>(uiSettings: IUiSettingsClient) {
  return (props: DataSourceMenuProps<T>) => {
    if (props.setMenuMountPoint) {
      return (
        <MountPointPortal setMountPoint={props.setMenuMountPoint}>
          <EuiHeaderLinks data-test-subj="top-nav" gutterSize="xs">
            <DataSourceMenu {...props} uiSettings={uiSettings} />
          </EuiHeaderLinks>
        </MountPointPortal>
      );
    }
    return <DataSourceMenu {...props} />;
  };
}
