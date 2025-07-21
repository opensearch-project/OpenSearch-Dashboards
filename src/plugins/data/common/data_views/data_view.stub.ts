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
  getFieldByName: (name: string) => stubFields.find((field) => field.name === name),
  getComputedFields: () => ({}),
  getScriptedFields: () => stubFields.filter((field) => field.scripted),
  getNonScriptedFields: () => stubFields.filter((field) => !field.scripted),
  addScriptedField: async () => {},
  removeScriptedField: () => {},
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
  getFieldByName(name: string) {
    return this.fields.find((field) => field.name === name);
  },
  getComputedFields: () => ({}),
  getScriptedFields() {
    return this.fields.filter((field) => field.scripted);
  },
  getNonScriptedFields() {
    return this.fields.filter((field) => !field.scripted);
  },
  addScriptedField: async () => {},
  removeScriptedField: () => {},
};
