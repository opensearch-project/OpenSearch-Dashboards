/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SavedObjectsClientContract } from 'src/core/public';
import { DataSetNavigator, DataSetNavigatorProps } from './';

// Updated function signature to include additional dependencies
export function createDataSetNavigator(savedObjectsClient: SavedObjectsClientContract) {
  // Return a function that takes props, omitting the dependencies from the props type
  return (props: Omit<DataSetNavigatorProps, 'savedObjectsClient'>) => (
    <DataSetNavigator {...props} savedObjectsClient={savedObjectsClient} />
  );
}
