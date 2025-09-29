/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { IFieldType } from '../../../../../../plugins/data/public';

export interface IndexedFieldItem extends IFieldType {
  info: string[];
  excluded: boolean;
}
