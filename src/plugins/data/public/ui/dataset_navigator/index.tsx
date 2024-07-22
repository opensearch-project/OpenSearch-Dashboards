/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { DataSetNavigatorProps } from './dataset_navigator';

const Fallback = () => <div />;

const LazyDataSetNavigator = React.lazy(() => import('./dataset_navigator'));
export const DataSetNavigator = (props: DataSetNavigatorProps) => (
  <React.Suspense fallback={<Fallback />}>
    <LazyDataSetNavigator {...props} />
  </React.Suspense>
);

export * from './create_dataset_navigator';
export type { DataSetNavigatorProps } from './dataset_navigator';

export { fetchDataSources } from './fetch_datasources';
export { fetchIndexPatterns } from './fetch_index_patterns';
export { fetchIndices } from './fetch_indices';
