/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IUiSettingsClient } from 'src/core/public';
import { DataSourcePluginSetup } from 'src/plugins/data_source/public';
import { DataSourceSelector, DataSourceSelectorProps } from './data_source_selector';

export function createDataSourceSelector(
  uiSettings: IUiSettingsClient,
  dataSourcePluginSetup: DataSourcePluginSetup
) {
  const { hideLocalCluster } = dataSourcePluginSetup;
  return (props: DataSourceSelectorProps) => (
    <DataSourceSelector {...props} uiSettings={uiSettings} hideLocalCluster={hideLocalCluster} />
  );
}
