/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { get } from 'lodash';
// @ts-expect-error TS2305 TODO(ts-error): fixme
import { IDataset } from '../../../../../../data/public';

export function getFieldFormat(dataset?: IDataset, fieldName?: string): string {
  return dataset && fieldName ? get(dataset, ['fieldFormatMap', fieldName, 'type', 'title']) : '';
}
