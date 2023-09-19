/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OuiComboBoxOptionOption } from '@elastic/eui';
import { DataSourceType } from '../datasource_services';

export interface DataSourceList {
  label: string;
  options: DataSourceOption[];
}

export interface DataSourceOption {
  label: string;
}

export type DataSourceOptionType = OuiComboBoxOptionOption<unknown>;

export interface DataSourceSelectableProps {
  dataSources: DataSourceType[];
  dataSourceOptionList: DataSourceList[];
  selectedSources: DataSourceOption[];
  setSelectedSources: (dataSourceOption: DataSourceOption[]) => void;
  setDataSourceOptionList: (dataSourceList: DataSourceList) => void;
  singleSelection: boolean;
  onFetchDataSetError: (error: Error) => void;
}
