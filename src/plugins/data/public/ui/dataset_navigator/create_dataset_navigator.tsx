/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SavedObjectsClientContract } from 'src/core/public';
import { IndexPatternsContract } from 'src/plugins/data/public';
import { DataSetNavigator, DataSetNavigatorProps } from './';

// Updated function signature to include additional dependencies
export function createDataSetNavigator(
  savedObjectsClient: SavedObjectsClientContract,
  indexPatternsService: IndexPatternsContract,
  search: any
) {
  // Return a function that takes props, omitting the dependencies from the props type
  return (
    props: Omit<DataSetNavigatorProps, 'savedObjectsClient' | 'indexPatternsService' | 'search'>
  ) => (
    <DataSetNavigator
      {...props}
      savedObjectsClient={savedObjectsClient}
      indexPatternsService={indexPatternsService}
      search={search}
    />
  );
}
