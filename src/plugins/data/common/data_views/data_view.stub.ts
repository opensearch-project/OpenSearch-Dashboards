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
  getFieldByName: (name: string) => {
    return stubDataView.fields.find((field) => field.name === name);
  },
  getComputedFields: () => ({
    scriptFields: {},
    docvalueFields: [],
    storedFields: [],
    runtimeFields: {},
  }),
  getScriptedFields: () => [],
  getNonScriptedFields: () => stubDataView.fields,
  addScriptedField: async (name: string, script: string, fieldType?: string): Promise<void> => {
    return;
  },
  removeScriptedField: () => {
    return;
  },
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
  timeFieldName: '@timestamp',
  getFieldByName: (name: string) => {
    return stubDataViewWithFields.fields.find((field) => field.name === name);
  },
  getComputedFields: () => ({
    scriptFields: {},
    docvalueFields: [],
    storedFields: [],
    runtimeFields: {},
  }),
  getScriptedFields: () => [],
  getNonScriptedFields: () => stubDataViewWithFields.fields,
  addScriptedField: async (name: string, script: string, fieldType?: string): Promise<void> => {
    return;
  },
  removeScriptedField: () => {
    return;
  },
};
