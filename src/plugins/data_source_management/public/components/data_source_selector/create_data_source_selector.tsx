/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'src/core/public';
import { DataSourcePluginSetup } from 'src/plugins/data_source/public';
import { DataSourceSelector, DataSourceSelectorProps } from './data_source_selector';

export function createDataSourceSelector(
  uiSettings: IUiSettingsClient,
  dataSourcePluginSetup: DataSourcePluginSetup
) {
  const { hideLocalCluster } = dataSourcePluginSetup;
  return (props: DataSourceSelectorProps) => (
    <DataSourceSelector
      {...props}
      uiSettings={uiSettings}
      // An explicit `hideLocalCluster` prop from the caller wins; otherwise fall back to the
      // cluster-wide data_source config default. (Previously the config value always overrode the
      // prop, so callers like Logs Drilldown that pass `hideLocalCluster` were silently ignored.)
      hideLocalCluster={props.hideLocalCluster ?? hideLocalCluster}
    />
  );
}
