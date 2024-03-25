/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactElement } from 'react';
import { EuiHeaderLinks } from '@elastic/eui';
import classNames from 'classnames';

import {
  MountPoint,
  NotificationsStart,
  SavedObjectsClientContract,
} from '../../../../../core/public';
import { MountPointPortal } from '../../../../opensearch_dashboards_react/public';
import { DataSourceSelectable } from './data_source_selectable';
import { DataSourceOption } from '../data_source_selector/data_source_selector';

export interface DataSourceMenuProps {
  showDataSourceSelectable: boolean;
  appName: string;
  savedObjects: SavedObjectsClientContract;
  notifications: NotificationsStart;
  fullWidth: boolean;
  hideLocalCluster: boolean;
  dataSourceCallBackFunc: (dataSource: DataSourceOption) => void;
  disableDataSourceSelectable?: boolean;
  className?: string;
  selectedOption?: DataSourceOption[];
  setMenuMountPoint?: (menuMount: MountPoint | undefined) => void;
  filterFn?: (dataSource: any) => boolean;
}

export function DataSourceMenu(props: DataSourceMenuProps): ReactElement | null {
  const {
    savedObjects,
    notifications,
    dataSourceCallBackFunc,
    showDataSourceSelectable,
    disableDataSourceSelectable,
    fullWidth,
    hideLocalCluster,
    selectedOption,
    filterFn,
  } = props;

  if (!showDataSourceSelectable) {
    return null;
  }

  function renderMenu(className: string): ReactElement | null {
    if (!showDataSourceSelectable) return null;
    return (
      <EuiHeaderLinks data-test-subj="top-nav" gutterSize="xs" className={className}>
        {renderDataSourceSelectable()}
      </EuiHeaderLinks>
    );
  }

  function renderDataSourceSelectable(): ReactElement | null {
    if (!showDataSourceSelectable) return null;
    return (
      <DataSourceSelectable
        fullWidth={fullWidth}
        hideLocalCluster={hideLocalCluster}
        savedObjectsClient={savedObjects}
        notifications={notifications.toasts}
        onSelectedDataSource={dataSourceCallBackFunc}
        disabled={disableDataSourceSelectable || false}
        selectedOption={selectedOption && selectedOption.length > 0 ? selectedOption : undefined}
        filterFn={filterFn}
      />
    );
  }

  function renderLayout() {
    const { setMenuMountPoint } = props;
    const menuClassName = classNames('osdTopNavMenu', props.className);
    if (setMenuMountPoint) {
      return (
        <>
          <MountPointPortal setMountPoint={setMenuMountPoint}>
            {renderMenu(menuClassName)}
          </MountPointPortal>
        </>
      );
    } else {
      return <>{renderMenu(menuClassName)}</>;
    }
  }

  return renderLayout();
}

DataSourceMenu.defaultProps = {
  disableDataSourceSelectable: false,
};
