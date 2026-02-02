/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DataView as Dataset,
  DataViewsContract as DatasetsContract,
} from '../../../../../../../data/public';

async function popularizeField(
  dataset: Dataset,
  fieldName: string,
  datasetsService: DatasetsContract
) {
  if (!dataset.id) return;
  const field = dataset.fields.getByName(fieldName);
  if (!field) {
    return;
  }

  field.count++;
  // Catch 409 errors caused by user adding columns in a higher frequency that the changes can be persisted to OpenSearch
  try {
    await datasetsService.updateSavedObject(dataset, 0, true);
    // eslint-disable-next-line no-empty
  } catch {}
}

export { popularizeField };
