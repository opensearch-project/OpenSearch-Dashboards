/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IUiSettingsClient } from 'src/core/public';
import { DataSourcePluginSetup } from 'src/plugins/data_source/public';
import { DataSourceSelector, DataSourceSelectorProps } from './data_source_selector';
import { DataSourceSelection } from '../../service/data_source_selection_service';

export function createDataSourceSelector(
  uiSettings: IUiSettingsClient,
  dataSourcePluginSetup: DataSourcePluginSetup,
  dataSourceSelection: DataSourceSelection
) {
  const { hideLocalCluster } = dataSourcePluginSetup;
  return (props: DataSourceSelectorProps) => (
    <DataSourceSelector
      {...props}
      uiSettings={uiSettings}
      hideLocalCluster={hideLocalCluster}
      dataSourceSelection={dataSourceSelection}
    />
  );
}
