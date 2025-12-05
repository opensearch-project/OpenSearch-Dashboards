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

  const fields = JSON.parse(savedObject.attributes.fields!);
  return {
    id: savedObject.id,
    fields,
    title: savedObject.attributes.title,
  };
}
