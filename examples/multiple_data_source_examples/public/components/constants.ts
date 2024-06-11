/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { EuiBasicTableColumn } from '@elastic/eui';
import { ComponentProp } from './types';

export const COLUMNS: Array<EuiBasicTableColumn<ComponentProp>> = [
  {
    field: 'name',
    name: 'Name',
  },
  {
    field: 'required',
    name: 'Required',
  },
  {
    field: 'defaultValue',
    name: 'Default Value',
  },
  {
    field: 'description',
    name: 'Description',
  },
  {
    field: 'deprecated',
    name: 'Deprecated',
  },
];
