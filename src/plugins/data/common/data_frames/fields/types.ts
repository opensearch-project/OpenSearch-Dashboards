/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IFieldType {
  name: string;
  type: string;
  values: any[];
  count?: number;
  aggregatable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  visualizable?: boolean;
  displayName?: string;
  format?: any;
}
