/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IUiSettingsClient } from 'src/core/public';
import { DataSourceSelector, DataSourceSelectorProps } from './data_source_selector';

export function createDataSourceSelector(uiSettings: IUiSettingsClient) {
  return (props: DataSourceSelectorProps) => (
    <DataSourceSelector {...props} uiSettings={uiSettings} />
  );
}
