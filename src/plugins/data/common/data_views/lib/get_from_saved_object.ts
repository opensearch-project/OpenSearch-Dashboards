/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from 'src/core/public';
import { get } from 'lodash';
import { IDataView, DataViewAttributes } from '../../data_views';

export function getFromSavedObject(
  savedObject: SavedObject<DataViewAttributes>
): IDataView | undefined {
  if (get(savedObject, 'attributes.fields') === undefined) {
    return;
  }

  const rawFields = savedObject.attributes.fields!;
  const fields = Array.isArray(rawFields) ? rawFields : JSON.parse(rawFields);
  return {
    id: savedObject.id,
    fields,
    title: savedObject.attributes.title,
  };
}
