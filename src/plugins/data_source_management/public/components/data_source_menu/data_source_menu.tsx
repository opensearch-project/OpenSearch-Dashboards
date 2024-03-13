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
import { DataSourceAggregatedView } from '../data_source_aggregated_view';
import { DataSourceView } from '../data_source_view';

export interface DataSourceMenuProps {
  showDataSourceSelectable?: boolean;
  showDataSourceView?: boolean;
  showDataSourceAggregatedView?: boolean;
  activeDatasourceIds?: string[];
  appName: string;
  savedObjects?: SavedObjectsClientContract;
  notifications?: NotificationsStart;
  fullWidth: boolean;
  hideLocalCluster?: boolean;
  dataSourceCallBackFunc?: (dataSource: DataSourceOption) => void;
  disableDataSourceSelectable?: boolean;
  className?: string;
  selectedOption?: DataSourceOption[];
  setMenuMountPoint?: (menuMount: MountPoint | undefined) => void;
  filterFn?: (dataSource: any) => boolean;
  displayAllCompatibleDataSources?: boolean;
}

export function DataSourceMenu(props: DataSourceMenuProps): ReactElement | null {
  const {
    savedObjects,
    notifications,
    dataSourceCallBackFunc,
    showDataSourceSelectable,
    disableDataSourceSelectable,
    showDataSourceAggregatedView,
    fullWidth,
    hideLocalCluster,
    selectedOption,
    showDataSourceView,
    filterFn,
    activeDatasourceIds,
    displayAllCompatibleDataSources,
  } = props;

  if (!showDataSourceSelectable && !showDataSourceView && !showDataSourceAggregatedView) {
    return null;
  }

  function renderDataSourceView(className: string): ReactElement | null {
    if (!showDataSourceView) return null;
    return (
      <EuiHeaderLinks data-test-subj="top-nav" gutterSize="xs" className={className}>
        <DataSourceView
          fullWidth={fullWidth}
          selectedOption={selectedOption && selectedOption.length > 0 ? selectedOption : undefined}
        />
      </EuiHeaderLinks>
    );
  }

  function renderDataSourceSelectable(className: string): ReactElement | null {
    if (!showDataSourceSelectable) return null;
    return (
      <EuiHeaderLinks data-test-subj="top-nav" gutterSize="xs" className={className}>
        <DataSourceSelectable
          fullWidth={fullWidth}
          hideLocalCluster={hideLocalCluster || false}
          savedObjectsClient={savedObjects!}
          notifications={notifications!.toasts}
          onSelectedDataSource={dataSourceCallBackFunc!}
          disabled={disableDataSourceSelectable || false}
          selectedOption={selectedOption && selectedOption.length > 0 ? selectedOption : undefined}
          filterFn={filterFn}
        />
      </EuiHeaderLinks>
    );
  }

  function renderDataSourceAggregatedView(): ReactElement | null {
    if (!showDataSourceAggregatedView) return null;
    return (
      <DataSourceAggregatedView
        fullWidth={fullWidth}
        hideLocalCluster={hideLocalCluster || false}
        savedObjectsClient={savedObjects!}
        notifications={notifications!.toasts}
        activeDatasourceIds={activeDatasourceIds}
        filterFn={filterFn}
        displayAllCompatibleDataSources={displayAllCompatibleDataSources || false}
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
            {renderDataSourceAggregatedView()}
            {renderDataSourceSelectable(menuClassName)}
            {renderDataSourceView(menuClassName)}
          </MountPointPortal>
        </>
      );
    } else {
      return (
        <>
          {renderDataSourceSelectable(menuClassName)}
          {renderDataSourceView(menuClassName)}
        </>
      );
    }
  }

  return renderLayout();
}

DataSourceMenu.defaultProps = {
  disableDataSourceSelectable: false,
  showDataSourceAggregatedView: false,
  showDataSourceSelectable: false,
  displayAllCompatibleDataSources: false,
  showDataSourceView: false,
  hideLocalCluster: false,
};
