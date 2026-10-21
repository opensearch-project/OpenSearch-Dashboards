/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset } from '../../../../common';
import { DatasetTypeConfig } from './types';

/**
 * Whether queries on the dataset wait for the user (DatasetTypeConfig `meta.requiresExplicitRun`):
 * an app then runs none on its own, not even on page load, whatever `searchOnLoad` and the
 * `discover:searchOnPageLoad` setting say.
 *
 * Apps read the setting through this function rather than the meta field, so it can later depend
 * on the dataset without changing them.
 *
 * @param typeConfig the config of the dataset's type, if registered
 * @param dataset the dataset the query runs on
 */
export const datasetTypeRequiresExplicitRun = (
  typeConfig: Pick<DatasetTypeConfig, 'meta'> | undefined,
  // Not read yet: the setting is per type for now.

  dataset?: Pick<Dataset, 'type'>
): boolean => typeConfig?.meta?.requiresExplicitRun === true;
