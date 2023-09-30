/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiComboBox } from '@elastic/eui';
import { DataSourceList, DataSourceOptionType } from './types';

export const DataSourceSelector = ({
  dataSourceList,
  selectedOptions,
  onDataSourceChange,
  singleSelection = true,
}: {
  dataSourceList: DataSourceList[];
  selectedOptions: DataSourceOptionType[];
  onDataSourceChange: (selectedDataSourceOptions: DataSourceOptionType[]) => void;
  singleSelection?: boolean;
}) => {
  const onDataSourceSelectionChange = (selectedDataSourceOptions: DataSourceOptionType[]) => {
    onDataSourceChange(selectedDataSourceOptions);
  };

  return (
    <EuiComboBox
      placeholder="Select a datasource"
      options={dataSourceList}
      selectedOptions={selectedOptions}
      onChange={onDataSourceSelectionChange}
      singleSelection={singleSelection}
      async
    />
  );
};
