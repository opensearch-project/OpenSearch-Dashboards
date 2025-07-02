/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDataView } from '.';
import { stubFields } from './field.stub';

export const stubDataView: IDataView = {
  id: 'logstash-*',
  fields: stubFields,
  title: 'logstash-*',
  timeFieldName: '@timestamp',
};

export const stubDataViewWithFields: IDataView = {
  id: '1234',
  title: 'logstash-*',
  fields: [
    {
      name: 'response',
      type: 'number',
      esTypes: ['integer'],
      aggregatable: true,
      filterable: true,
      searchable: true,
    },
  ],
};
