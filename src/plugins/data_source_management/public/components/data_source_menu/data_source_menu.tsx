/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactElement } from 'react';
import { EuiHeaderLinks } from '@elastic/eui';

import {
  MountPoint,
  NotificationsStart,
  SavedObjectsClientContract,
  SavedObject,
} from '../../../../../core/public';
import { DataSourceSelectable } from './data_source_selectable';
import { DataSourceOption } from '../data_source_selector/data_source_selector';
import { DataSourceAggregatedView } from '../data_source_aggregated_view';
import { DataSourceView } from '../data_source_view';
import { DataSourceAttributes } from '../../types';
import {
  DataSourceAggregatedViewConfig,
  DataSourceSelectableConfig,
  DataSourceType,
  DataSourceViewConfig,
} from './data_source_config';

export interface DataSourceMenuProps<T> {
  dataSourceType: string;
  savedObjects?: SavedObjectsClientContract;
  notifications?: NotificationsStart;
  setMenuMountPoint?: (menuMount: MountPoint | undefined) => void;
  dataSourceFilter?: (dataSource: SavedObject<DataSourceAttributes>) => boolean;
  config: T;
}

export function DataSourceMenu<T>(props: DataSourceMenuProps<T>): ReactElement | null {
  const { savedObjects, notifications, dataSourceFilter, dataSourceType, config } = props;

  console.log('shud');
  function renderDataSourceView(config: DataSourceViewConfig): ReactElement | null {
    return (
      <EuiHeaderLinks data-test-subj="top-nav" gutterSize="xs">
        <DataSourceView {...config} />
      </EuiHeaderLinks>
    );
  }

  function renderDataSourceSelectable(config: DataSourceSelectableConfig): ReactElement | null {
    const {
      onSelectedDataSources,
      disabled,
      displayedOption,
      hideLocalCluster,
      fullWidth,
    } = config;
    console.log('inside render');
    return (
      <EuiHeaderLinks data-test-subj="top-nav" gutterSize="xs">
        <DataSourceSelectable
          savedObjectsClient={savedObjects!}
          notifications={notifications!.toasts}
          onSelectedDataSource={onSelectedDataSources}
          disabled={disabled || false}
          selectedOption={
            displayedOption && displayedOption.length > 0 ? displayedOption : undefined
          }
          dataSourceFilter={dataSourceFilter}
          hideLocalCluster={hideLocalCluster || false}
          fullWidth={fullWidth}
        />
      </EuiHeaderLinks>
    );
  }

  function renderDataSourceAggregatedView(
    config: DataSourceAggregatedViewConfig
  ): ReactElement | null {
    const {
      fullWidth,
      hideLocalCluster,
      activeDataSourceIds,
      displayAllCompatibleDataSources,
    } = config;
    return (
      <DataSourceAggregatedView
        fullWidth={fullWidth}
        hideLocalCluster={hideLocalCluster || false}
        savedObjectsClient={savedObjects!}
        notifications={notifications!.toasts}
        activeDataSourceIds={activeDataSourceIds}
        dataSourceFilter={dataSourceFilter}
        displayAllCompatibleDataSources={displayAllCompatibleDataSources || false}
      />
    );
  }

  function renderLayout(): ReactElement | null {
    console.log('what', dataSourceType);
    console.log('ss', DataSourceType.DataSourceSelectable.toString());
    switch (dataSourceType) {
      case DataSourceType.DataSourceAggregatedView.toString():
        renderDataSourceAggregatedView(config as DataSourceAggregatedViewConfig);
        break;
      case DataSourceType.DataSourceSelectable.toString():
        console.log('am ihere ');
        return renderDataSourceSelectable(config as DataSourceSelectableConfig);
        break;
      case DataSourceType.DataSourceView.toString():
        renderDataSourceView(config as DataSourceViewConfig);
        break;
      default:
        // throw error
        return null;
        break;
    }
  }

  return renderLayout();
}

// DataSourceMenu.defaultProps = {
//   disableDataSourceSelectable: false,
//   showDataSourceAggregatedView: false,
//   showDataSourceSelectable: false,
//   displayAllCompatibleDataSources: false,
//   showDataSourceView: false,
//   hideLocalCluster: false,
// };
