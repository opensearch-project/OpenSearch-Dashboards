/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  MountPoint,
  NotificationsStart,
  SavedObjectsClientContract,
  SavedObject,
} from '../../../../../core/public';
import { DataSourceAttributes } from '../../types';

export interface DataSourceOption {
  label?: string;
  id: string;
}

export interface DataSourceBaseConfig {
  fullWidth: boolean;
  disabled?: boolean;
}

export interface DataSourceMenuProps<T = any> {
  componentType: DataSourceComponentType;
  savedObjects?: SavedObjectsClientContract;
  notifications?: NotificationsStart;
  setMenuMountPoint?: (menuMount: MountPoint | undefined) => void;
  dataSourceFilter?: (dataSource: SavedObject<DataSourceAttributes>) => boolean;
  componentConfig: T;
}

export const DataSourceComponentType = {
  DataSourceSelectable: 'DataSourceSelectable',
  DataSourceView: 'DataSourceView',
  DataSourceAggregatedView: 'DataSourceAggregatedView',
} as const;

export type DataSourceComponentType = typeof DataSourceComponentType[keyof typeof DataSourceComponentType];

export interface DataSourceViewConfig extends DataSourceBaseConfig {
  activeOption: DataSourceOption[];
}

export interface DataSourceAggregatedViewConfig extends DataSourceBaseConfig {
  activeDataSourceIds?: string[];
  hideLocalCluster?: boolean;
  displayAllCompatibleDataSources?: boolean;
}

export interface DataSourceSelectableConfig extends DataSourceBaseConfig {
  activeOption?: DataSourceOption[];
  hideLocalCluster?: boolean;
  onSelectedDataSources: (dataSources: DataSourceOption[]) => void;
}
