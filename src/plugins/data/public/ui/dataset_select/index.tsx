/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { DatasetSelectProps } from './dataset_select';

const Fallback = () => <div />;

const LazyDatasetSelect = React.lazy(() => import('./dataset_select'));
export const DatasetSelect = (props: DatasetSelectProps) => (
  <React.Suspense fallback={<Fallback />}>
    <LazyDatasetSelect {...props} />
  </React.Suspense>
);

export * from './create_dataset_select';
export type { DatasetSelectProps, DetailedDataset } from './dataset_select';
