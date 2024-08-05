/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HttpStart, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { DataSetNavigator, DataSetNavigatorProps } from './';
import { DataSetContract } from '../../query';

// Updated function signature to include additional dependencies
export function createDataSetNavigator(
  savedObjectsClient: SavedObjectsClientContract,
  http: HttpStart,
  dataSetManager: DataSetContract
) {
  // Return a function that takes props, omitting the dependencies from the props type
  return (props: Omit<DataSetNavigatorProps, 'savedObjectsClient' | 'http' | 'dataSetManager'>) => (
    <DataSetNavigator
      {...props}
      savedObjectsClient={savedObjectsClient}
      http={http}
      dataSetManager={dataSetManager}
    />
  );
}
