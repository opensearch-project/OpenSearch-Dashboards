/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  MountPoint,
  NotificationsStart,
  SavedObjectsClientContract,
  SavedObject,
  IUiSettingsClient,
  ApplicationStart,
} from '../../../../../core/public';
import { DataSourceAttributes } from '../../types';

export interface DataSourceOption {
  id: string;
  label?: string;
  checked?: string;
}

export interface DataSourceGroupLabelOption extends DataSourceOption {
  label: string;
  isGroupLabel: true;
}

export interface DataSourceBaseConfig {
  fullWidth: boolean;
  disabled?: boolean;
}

export interface DataSourceBaseState {
  showEmptyState: boolean;
  showError: boolean;
}

export interface DataSourceMenuProps<T = any> {
  componentType: DataSourceComponentType;
  componentConfig: T;
  hideLocalCluster?: boolean;
  uiSettings?: IUiSettingsClient;
  application?: ApplicationStart;
  setMenuMountPoint?: (menuMount: MountPoint | undefined) => void;
  onManageDataSource: () => void;
}

export const DataSourceComponentType = {
  DataSourceSelectable: 'DataSourceSelectable',
  DataSourceView: 'DataSourceView',
  DataSourceAggregatedView: 'DataSourceAggregatedView',
  DataSourceMultiSelectable: 'DataSourceMultiSelectable',
} as const;

export type DataSourceComponentType = typeof DataSourceComponentType[keyof typeof DataSourceComponentType];

export interface DataSourceViewConfig extends DataSourceBaseConfig {
  activeOption: DataSourceOption[];
  savedObjects?: SavedObjectsClientContract;
  notifications?: NotificationsStart;
  dataSourceFilter?: (dataSource: SavedObject<DataSourceAttributes>) => boolean;
  onSelectedDataSources?: (dataSources: DataSourceOption[]) => void;
}

interface DataSourceAggregatedViewBaseConfig extends DataSourceBaseConfig {
  savedObjects: SavedObjectsClientContract;
  notifications: NotificationsStart;
  dataSourceFilter?: (dataSource: SavedObject<DataSourceAttributes>) => boolean;
}

export type DataSourceAggregatedViewConfig =
  | (DataSourceAggregatedViewBaseConfig & {
      activeDataSourceIds: string[];
      displayAllCompatibleDataSources: false;
    })
  | (DataSourceAggregatedViewBaseConfig & {
      activeDataSourceIds?: string[];
      displayAllCompatibleDataSources: true;
    });

export interface DataSourceSelectableConfig extends DataSourceBaseConfig {
  onSelectedDataSources: (dataSources: DataSourceOption[]) => void;
  savedObjects: SavedObjectsClientContract;
  notifications: NotificationsStart;
  activeOption?: DataSourceOption[];
  dataSourceFilter?: (dataSource: SavedObject<DataSourceAttributes>) => boolean;
  onManageDataSource: () => void;
}

export interface DataSourceMultiSelectableConfig extends DataSourceBaseConfig {
  onSelectedDataSources: (dataSources: DataSourceOption[]) => void;
  savedObjects: SavedObjectsClientContract;
  notifications: NotificationsStart;
}
