/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from 'src/core/public';
import { get } from 'lodash';
import { IDataset, DatasetAttributes } from '../..';

export function getFromSavedObject(
  savedObject: SavedObject<DatasetAttributes>
): IDataset | undefined {
  if (get(savedObject, 'attributes.fields') === undefined) {
    return;
  }

  return {
    id: savedObject.id,
    fields: JSON.parse(savedObject.attributes.fields!),
    title: savedObject.attributes.title,
  };
}
