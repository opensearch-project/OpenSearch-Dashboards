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
} from '../../../../../core/public';
import { DataSourceAttributes } from '../../types';

export interface DataSourceOption {
  id: string;
  label?: string;
}

export interface DataSourceGroupLabelOption extends DataSourceOption {
  label: string;
  isGroupLabel: true;
}

export interface DataSourceBaseConfig {
  fullWidth: boolean;
  disabled?: boolean;
}

export interface DataSourceMenuProps<T = any> {
  componentType: DataSourceComponentType;
  componentConfig: T;
  hideLocalCluster?: boolean;
  uiSettings?: IUiSettingsClient;
  setMenuMountPoint?: (menuMount: MountPoint | undefined) => void;
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
}

export interface DataSourceAggregatedViewConfig extends DataSourceBaseConfig {
  savedObjects: SavedObjectsClientContract;
  notifications: NotificationsStart;
  activeDataSourceIds?: string[];
  displayAllCompatibleDataSources?: boolean;
  dataSourceFilter?: (dataSource: SavedObject<DataSourceAttributes>) => boolean;
}

export interface DataSourceSelectableConfig extends DataSourceBaseConfig {
  onSelectedDataSources: (dataSources: DataSourceOption[]) => void;
  savedObjects: SavedObjectsClientContract;
  notifications: NotificationsStart;
  activeOption?: DataSourceOption[];
  dataSourceFilter?: (dataSource: SavedObject<DataSourceAttributes>) => boolean;
}

export interface DataSourceMultiSelectableConfig extends DataSourceBaseConfig {
  onSelectedDataSources: (dataSources: DataSourceOption[]) => void;
  savedObjects: SavedObjectsClientContract;
  notifications: NotificationsStart;
}
