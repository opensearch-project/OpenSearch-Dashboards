/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DataSourceOption {
  label?: string;
  id: string;
}

export interface DataSourceBaseConfig {
  fullWidth: boolean;
  disabled?: boolean;
}

export enum DataSourceType {
  DataSourceSelectable = 'DataSourceSelectable',
  DataSourceView = 'DataSourceView',
  DataSourceAggregatedView = 'DataSourceAggregatedView',
}

export interface DataSourceViewConfig extends DataSourceBaseConfig {
  displayedOption: DataSourceOption[];
}

export interface DataSourceAggregatedViewConfig extends DataSourceBaseConfig {
  activeDataSourceIds: string[];
  hideLocalCluster?: boolean;
  displayAllCompatibleDataSources?: boolean;
  onSelectedDataSources: (dataSource: DataSourceOption) => void;
}

export interface DataSourceSelectableConfig extends DataSourceBaseConfig {
  displayedOption?: DataSourceOption[];
  hideLocalCluster?: boolean;
  onSelectedDataSources: (dataSource: DataSourceOption) => void;
}
