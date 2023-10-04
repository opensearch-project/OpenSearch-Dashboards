/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiComboBox } from '@elastic/eui';
import { DataSourceOptionType } from './types';

export const DataSourceSelector = ({
  dataSourceList,
  selectedOptions,
  onDataSourceChange,
  singleSelection = true,
}: {
  dataSourceList: DataSourceOptionType[];
  selectedOptions: DataSourceOptionType[];
  onDataSourceChange: (selectedDataSourceOptions: DataSourceOptionType[]) => void;
  singleSelection?: boolean;
}) => {
  const onDataSourceSelectionChange = (selectedDataSourceOptions: DataSourceOptionType[]) => {
    onDataSourceChange(selectedDataSourceOptions);
  };

  return (
    <EuiComboBox
      data-test-subj="dataExplorerDSSelect"
      placeholder={i18n.translate('data.datasource.selectADatasource', {
        defaultMessage: 'Select a datasource',
      })}
      options={dataSourceList}
      selectedOptions={selectedOptions}
      onChange={onDataSourceSelectionChange}
      singleSelection={singleSelection}
      async
    />
  );
};
