/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DataSourceSelector, DataSourceSelectorProps } from './data_source_selector';

export function createDataSourceSelector() {
  return (props: DataSourceSelectorProps) => <DataSourceSelector {...props} />;
}
