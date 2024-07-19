/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import React from 'react';

import { SavedObjectsClientContract } from 'src/core/public';
import { DataSetNavigator, DataSetNavigatorProps } from './';

// Takes in stateful runtime dependencies and pre-wires them to the component
export function createDataSetNavigator(savedObjectsClient: SavedObjectsClientContract) {
  return (props: Omit<DataSetNavigatorProps, 'savedObjectsClient'>) => (
    <DataSetNavigator {...props} savedObjectsClient={savedObjectsClient} />
  );
}
