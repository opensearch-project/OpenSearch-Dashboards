/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import React from 'react';

import { DatasetSelector, DatasetSelectorProps } from '.';

// Takes in stateful runtime dependencies and pre-wires them to the component
export function createDatasetSelector() {
  return (props: DatasetSelectorProps) => <DatasetSelector {...props} />;
}
