/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export {
  ILLEGAL_CHARACTERS_KEY,
  CONTAINS_SPACES_KEY,
  ILLEGAL_CHARACTERS_VISIBLE,
  ILLEGAL_CHARACTERS,
  validateDataset,
  getFromSavedObject,
  isDefault,
} from '../../common/datasets/lib';
export { flattenHitWrapper, formatHitProvider, onRedirectNoDataset } from './datasets';

export { DatasetField, IDatasetFieldList } from '../../common/datasets';

export { DatasetsService, DatasetsContract, Dataset, DatasetsApiClient } from './datasets';
export { UiSettingsPublicToCommon } from './ui_settings_wrapper';
export { SavedObjectsClientPublicToCommon } from './saved_objects_client_wrapper';
