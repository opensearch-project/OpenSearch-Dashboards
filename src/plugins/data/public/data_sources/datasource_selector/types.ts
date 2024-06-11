/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @experimental These interfaces are experimental and might change in future releases.
 */

import { EuiComboBoxProps, EuiComboBoxSingleSelectionShape } from '@elastic/eui';
import { DataSource } from '../datasource/datasource';

export interface DataSourceGroup {
  label: string;
  id: string;
  options: DataSourceOption[];
  groupType: string;
}

export interface DataSourceOption {
  key: string;
  name: string;
  label: string;
  value: string;
  type: string;
  ds: DataSource;
}

export interface DataSourceSelectableProps extends Pick<EuiComboBoxProps<unknown>, 'fullWidth'> {
  dataSources: DataSource[];
  onDataSourceSelect: (dataSourceOption: DataSourceOption[]) => void;
  singleSelection?: boolean | EuiComboBoxSingleSelectionShape;
  onGetDataSetError: (error: Error) => void;
  dataSourceOptionList: DataSourceGroup[];
  selectedSources: DataSourceOption[];
  setDataSourceOptionList: (dataSourceList: DataSourceGroup[]) => void;
  onRefresh: () => void;
}
