/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactElement } from 'react';

import { DataSourceAggregatedView } from '../data_source_aggregated_view';
import { DataSourceView } from '../data_source_view';
import { DataSourceMultiSelectable } from '../data_source_multi_selectable';
import {
  DataSourceAggregatedViewConfig,
  DataSourceComponentType,
  DataSourceMenuProps,
  DataSourceMultiSelectableConfig,
  DataSourceSelectableConfig,
  DataSourceViewConfig,
} from './types';
import { DataSourceSelectable } from '../data_source_selectable';

export function DataSourceMenu<T>(props: DataSourceMenuProps<T>): ReactElement | null {
  const { componentType, componentConfig, uiSettings } = props;

  function renderDataSourceView(config: DataSourceViewConfig): ReactElement | null {
    const { activeOption, fullWidth, savedObjects, notifications } = config;
    return (
      <DataSourceView
        fullWidth={fullWidth}
        selectedOption={activeOption}
        savedObjectsClient={savedObjects}
        notifications={notifications?.toasts}
      />
    );
  }

  function renderDataSourceMultiSelectable(
    config: DataSourceMultiSelectableConfig
  ): ReactElement | null {
    const {
      fullWidth,
      hideLocalCluster,
      savedObjects,
      notifications,
      onSelectedDataSources,
    } = config;
    return (
      <DataSourceMultiSelectable
        fullWidth={fullWidth}
        hideLocalCluster={hideLocalCluster || false}
        savedObjectsClient={savedObjects!}
        notifications={notifications!.toasts}
        onSelectedDataSources={onSelectedDataSources!}
      />
    );
  }

  function renderDataSourceSelectable(config: DataSourceSelectableConfig): ReactElement | null {
    const {
      onSelectedDataSources,
      disabled,
      activeOption,
      hideLocalCluster,
      fullWidth,
      savedObjects,
      notifications,
      dataSourceFilter,
    } = config;
    return (
      <DataSourceSelectable
        savedObjectsClient={savedObjects!}
        notifications={notifications!.toasts}
        onSelectedDataSources={onSelectedDataSources}
        disabled={disabled || false}
        selectedOption={activeOption && activeOption.length > 0 ? activeOption : undefined}
        dataSourceFilter={dataSourceFilter}
        hideLocalCluster={hideLocalCluster || false}
        fullWidth={fullWidth}
        uiSettings={uiSettings}
      />
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
      savedObjects,
      notifications,
      dataSourceFilter,
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
    switch (componentType) {
      case DataSourceComponentType.DataSourceAggregatedView:
        return renderDataSourceAggregatedView(componentConfig as DataSourceAggregatedViewConfig);
      case DataSourceComponentType.DataSourceSelectable:
        return renderDataSourceSelectable(componentConfig as DataSourceSelectableConfig);
      case DataSourceComponentType.DataSourceView:
        return renderDataSourceView(componentConfig as DataSourceViewConfig);
      case DataSourceComponentType.DataSourceMultiSelectable:
        return renderDataSourceMultiSelectable(componentConfig as DataSourceMultiSelectableConfig);
      default:
        return null;
    }
  }

  return renderLayout();
}
