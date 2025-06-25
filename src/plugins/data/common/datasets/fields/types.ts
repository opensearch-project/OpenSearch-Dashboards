/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetFieldSpec, IDatasetFieldSubType, Dataset } from '../..';

export interface IDatasetFieldType {
  name: string;
  type: string;
  script?: string;
  lang?: string;
  count?: number;
  // esTypes might be undefined on old index patterns that have not been refreshed since we added
  // this prop. It is also undefined on scripted fields.
  esTypes?: string[];
  aggregatable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  visualizable?: boolean;
  readFromDocValues?: boolean;
  scripted?: boolean;
  subType?: IDatasetFieldSubType;
  displayName?: string;
  format?: any;
  toSpec?: (options?: {
    getFormatterForField?: Dataset['getFormatterForField'];
  }) => DatasetFieldSpec;
}
