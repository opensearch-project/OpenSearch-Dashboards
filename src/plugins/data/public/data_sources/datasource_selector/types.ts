/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @experimental These interfaces are experimental and might change in future releases.
 */

import { EuiComboBoxSingleSelectionShape } from '@elastic/eui';
import { GenericDataSource } from '../datasource_services';

export interface DataSourceGroup {
  label: string;
  options: DataSourceOption[];
}

export interface DataSourceOption {
  label: string;
  value: string;
  type: string;
  ds: GenericDataSource;
}

export interface DataSourceSelectableProps {
  dataSources: GenericDataSource[];
  onDataSourceSelect: (dataSourceOption: DataSourceOption[]) => void;
  singleSelection?: boolean | EuiComboBoxSingleSelectionShape;
  onGetDataSetError: (error: Error) => void;
  dataSourceOptionList: DataSourceGroup[];
  selectedSources: DataSourceOption[];
  setDataSourceOptionList: (dataSourceList: DataSourceGroup[]) => void;
}
