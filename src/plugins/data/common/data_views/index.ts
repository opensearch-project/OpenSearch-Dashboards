/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './fields';
export * from './types';
export { DataViewsService } from './data_views';
export type { DataView } from './data_views';
export * from './errors';
export {
  validateDataViewDataSourceReference,
  getDataViewTitle,
  findByTitle,
  getDataSourceReference,
  extractDatasetTypeFromUri,
  extractDataSourceInfoFromUri,
  constructDataSourceUri,
  getDatasetTypeFromReference,
} from './utils';
