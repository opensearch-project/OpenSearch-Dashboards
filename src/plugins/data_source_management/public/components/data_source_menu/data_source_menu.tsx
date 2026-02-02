/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactElement } from 'react';
import { UiSettingScope } from 'opensearch-dashboards/public';
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
import { getWorkspaces } from '../utils';

export function DataSourceMenu<T>(props: DataSourceMenuProps<T>): ReactElement | null {
  const {
    componentType,
    componentConfig,
    uiSettings,
    hideLocalCluster,
    application,
    onManageDataSource,
    workspaces = getWorkspaces(),
    // This is intentionally designed for sample data as it’s the only case where
    // DataSourceMenu is imported directly (not via createDataSourceMenu) in tutorial_directory.js
    // Includes a fallback check to ensure the workspace scope is properly consumed.
  } = props;

  const currentWorkspaceId = workspaces.currentWorkspaceId$.getValue();
  const scope: UiSettingScope = !!currentWorkspaceId
    ? UiSettingScope.WORKSPACE
    : UiSettingScope.GLOBAL;

  function renderDataSourceView(config: DataSourceViewConfig): ReactElement | null {
    const {
      activeOption,
      fullWidth,
      savedObjects,
      notifications,
      dataSourceFilter,
      onSelectedDataSources,
    } = config;
    return (
      <DataSourceView
        fullWidth={fullWidth}
        selectedOption={activeOption}
        savedObjectsClient={savedObjects}
        notifications={notifications?.toasts}
        hideLocalCluster={hideLocalCluster || false}
        dataSourceFilter={dataSourceFilter}
        onSelectedDataSources={onSelectedDataSources}
        uiSettings={uiSettings}
        application={application}
        scope={scope}
      />
    );
  }

  function renderDataSourceMultiSelectable(
    config: DataSourceMultiSelectableConfig
  ): ReactElement | null {
    const { fullWidth, savedObjects, notifications, onSelectedDataSources } = config;
    return (
      <DataSourceMultiSelectable
        fullWidth={fullWidth}
        hideLocalCluster={hideLocalCluster || false}
        savedObjectsClient={savedObjects!}
        notifications={notifications!.toasts}
        onSelectedDataSources={onSelectedDataSources!}
        uiSettings={uiSettings}
        application={application}
        scope={scope}
      />
    );
  }

  function renderDataSourceSelectable(config: DataSourceSelectableConfig): ReactElement | null {
    const {
      onSelectedDataSources,
      disabled,
      activeOption,
      fullWidth,
      savedObjects,
      notifications,
      dataSourceFilter,
    } = config;
    return (
      <DataSourceSelectable
        onManageDataSource={onManageDataSource}
        savedObjectsClient={savedObjects!}
        notifications={notifications!.toasts}
        onSelectedDataSources={onSelectedDataSources}
        disabled={disabled || false}
        selectedOption={activeOption && activeOption.length > 0 ? activeOption : undefined}
        dataSourceFilter={dataSourceFilter}
        hideLocalCluster={hideLocalCluster || false}
        fullWidth={fullWidth}
        uiSettings={uiSettings}
        application={application}
        scope={scope}
      />
    );
  }

  function renderDataSourceAggregatedView(
    config: DataSourceAggregatedViewConfig
  ): ReactElement | null {
    const {
      fullWidth,
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
        displayAllCompatibleDataSources={displayAllCompatibleDataSources}
        uiSettings={uiSettings}
        application={application}
        scope={scope}
      />
    );
  }

  function renderLayout(): ReactElement | null {
    switch (componentType) {
      case DataSourceComponentType.DataSourceAggregatedView:
        return renderDataSourceAggregatedView(
          (componentConfig as unknown) as DataSourceAggregatedViewConfig
        );
      case DataSourceComponentType.DataSourceSelectable:
        return renderDataSourceSelectable(
          (componentConfig as unknown) as DataSourceSelectableConfig
        );
      case DataSourceComponentType.DataSourceView:
        return renderDataSourceView((componentConfig as unknown) as DataSourceViewConfig);
      case DataSourceComponentType.DataSourceMultiSelectable:
        return renderDataSourceMultiSelectable(
          (componentConfig as unknown) as DataSourceMultiSelectableConfig
        );
      default:
        return null;
    }
  }

  return renderLayout();
}
