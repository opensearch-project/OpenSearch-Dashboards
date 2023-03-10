/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateAggConfigParams } from '../../../../../data/common';
import { AggGroupNames } from '../../../../../data/common';
import { Schema } from '../../../../../vis_default_editor/public';
import { VisBuilderServices } from '../../../types';
import { createVisBuilderServicesMock } from '../mocks';
import {
  AggMapping,
  getSchemaMapping,
  updateAggParams,
  usePersistedAggParams,
} from './use_persisted_agg_params';

describe('new usePersistedAggParams', () => {
  const types = {
    get: jest.fn(),
  };
  let schemaMetricTemplate: Schema;
  let schemaBucketTemplate: Schema;
  let oldVisualizationType: Schema[];
  let newVisualizationType: Schema[];
  let aggConfigParam: CreateAggConfigParams;
  let aggConfigParams: CreateAggConfigParams[];

  beforeEach(() => {
    schemaMetricTemplate = {
      aggFilter: [],
      editor: '',
      group: AggGroupNames.Metrics,
      max: 1,
      min: 1,
      name: '',
      params: [],
      title: '',
      defaults: '',
    };
    schemaBucketTemplate = {
      aggFilter: [],
      editor: '',
      group: AggGroupNames.Buckets,
      max: 1,
      min: 1,
      name: '',
      params: [],
      title: '',
      defaults: '',
    };
    aggConfigParam = {
      type: '',
      schema: '',
    };
  });

  test('return the correct metric-to-metric, bucket-to-bucket mapping and correct persisted aggregations', () => {
    oldVisualizationType = [
      { ...schemaMetricTemplate, name: 'old metric 1' },
      { ...schemaBucketTemplate, name: 'old bucket 1' },
      { ...schemaMetricTemplate, name: 'old metric 2' },
      { ...schemaBucketTemplate, name: 'old bucket 2' },
      { ...schemaBucketTemplate, name: 'old bucket 3' },
    ];
    newVisualizationType = [
      { ...schemaMetricTemplate, name: 'new metric 1', max: 1 },
      { ...schemaMetricTemplate, name: 'new metric 2', max: 2 },
      { ...schemaBucketTemplate, name: 'new bucket 1', max: 4 },
      { ...schemaBucketTemplate, name: 'new bucket 2', max: 5 },
      { ...schemaBucketTemplate, name: 'new bucket 3', max: 6 },
    ];
    types.get
      .mockReturnValueOnce({
        ui: {
          containerConfig: {
            data: {
              schemas: {
                all: oldVisualizationType,
              },
            },
          },
        },
      })
      .mockReturnValueOnce({
        ui: {
          containerConfig: {
            data: {
              schemas: {
                all: newVisualizationType,
              },
            },
          },
        },
      });
    aggConfigParams = [
      { ...aggConfigParam, schema: 'old metric 1' },
      { ...aggConfigParam, schema: 'old bucket 1' },
      { ...aggConfigParam, schema: 'old metric 2' },
      { ...aggConfigParam, schema: 'old bucket 2' },
      { ...aggConfigParam, schema: 'old bucket 3' },
      { ...aggConfigParam, schema: 'old metric 2' },
    ];

    const mappingResult = getSchemaMapping(oldVisualizationType, newVisualizationType);
    expect(mappingResult).toMatchInlineSnapshot(`
      Map {
        "old metric 1" => Object {
          "currentCount": 0,
          "maxCount": 1,
          "name": "new metric 1",
        },
        "old metric 2" => Object {
          "currentCount": 0,
          "maxCount": 2,
          "name": "new metric 2",
        },
        "old bucket 1" => Object {
          "currentCount": 0,
          "maxCount": 4,
          "name": "new bucket 1",
        },
        "old bucket 2" => Object {
          "currentCount": 0,
          "maxCount": 5,
          "name": "new bucket 2",
        },
        "old bucket 3" => Object {
          "currentCount": 0,
          "maxCount": 6,
          "name": "new bucket 3",
        },
      }
    `);
    const persistResult = usePersistedAggParams(
      types,
      aggConfigParams,
      'old vis type',
      'new vis type'
    );
    expect(persistResult).toMatchInlineSnapshot(`
      Array [
        Object {
          "schema": "new metric 1",
          "type": "",
        },
        Object {
          "schema": "new bucket 1",
          "type": "",
        },
        Object {
          "schema": "new metric 2",
          "type": "",
        },
        Object {
          "schema": "new bucket 2",
          "type": "",
        },
        Object {
          "schema": "new bucket 3",
          "type": "",
        },
        Object {
          "schema": "new metric 2",
          "type": "",
        },
      ]
    `);
  });

  test('drop the schema fields when it can not be mapped or do not belong to either metric or bucket group', () => {
    oldVisualizationType = [
      { ...schemaMetricTemplate, name: 'old metric 1' },
      { ...schemaMetricTemplate, name: 'old metric 2' },
      { ...schemaBucketTemplate, name: 'old bucket 1' },
      { ...schemaMetricTemplate, name: 'undefined group', group: AggGroupNames.None },
    ];
    newVisualizationType = [
      { ...schemaMetricTemplate, name: 'new metric 1', max: 1 },
      { ...schemaBucketTemplate, name: 'new bucket 2', max: 1 },
    ];
    types.get
      .mockReturnValueOnce({
        ui: {
          containerConfig: {
            data: {
              schemas: {
                all: oldVisualizationType,
              },
            },
          },
        },
      })
      .mockReturnValueOnce({
        ui: {
          containerConfig: {
            data: {
              schemas: {
                all: newVisualizationType,
              },
            },
          },
        },
      });
    aggConfigParams = [
      { ...aggConfigParam, schema: 'old metric 1' },
      { ...aggConfigParam, schema: 'old bucket 1' },
    ];

    const mappingResult = getSchemaMapping(oldVisualizationType, newVisualizationType);
    expect(mappingResult).toMatchInlineSnapshot(`
      Map {
        "old metric 1" => Object {
          "currentCount": 0,
          "maxCount": 1,
          "name": "new metric 1",
        },
        "old bucket 1" => Object {
          "currentCount": 0,
          "maxCount": 1,
          "name": "new bucket 2",
        },
      }
    `);
    const persistResult = usePersistedAggParams(
      types,
      aggConfigParams,
      'old vis type',
      'new vis type'
    );
    expect(persistResult).toMatchInlineSnapshot(`
      Array [
        Object {
          "schema": "new metric 1",
          "type": "",
        },
        Object {
          "schema": "new bucket 2",
          "type": "",
        },
      ]
    `);
  });

  test('aggregations with undefined schema remain undefined; schema will be set to undefined if aggregations that exceeds the max amount', () => {
    oldVisualizationType = [{ ...schemaMetricTemplate, name: 'old metric 1' }];
    newVisualizationType = [{ ...schemaMetricTemplate, name: 'new metric 1', max: 1 }];
    types.get
      .mockReturnValueOnce({
        ui: {
          containerConfig: {
            data: {
              schemas: {
                all: oldVisualizationType,
              },
            },
          },
        },
      })
      .mockReturnValueOnce({
        ui: {
          containerConfig: {
            data: {
              schemas: {
                all: newVisualizationType,
              },
            },
          },
        },
      });
    aggConfigParams = [
      { ...aggConfigParam, schema: undefined },
      { ...aggConfigParam, schema: 'old metric 1' },
      { ...aggConfigParam, schema: 'old metric 1' },
    ];

    const mappingResult = getSchemaMapping(oldVisualizationType, newVisualizationType);
    expect(mappingResult).toMatchInlineSnapshot(`
      Map {
        "old metric 1" => Object {
          "currentCount": 0,
          "maxCount": 1,
          "name": "new metric 1",
        },
      }
    `);
    const persistResult = usePersistedAggParams(
      types,
      aggConfigParams,
      'old vis type',
      'new vis type'
    );
    expect(persistResult).toMatchInlineSnapshot(`
      Array [
        Object {
          "schema": undefined,
          "type": "",
        },
        Object {
          "schema": "new metric 1",
          "type": "",
        },
        Object {
          "schema": undefined,
          "type": "",
        },
      ]
    `);
  });

  test('return an empty array when there are no aggregations for persistence', () => {
    oldVisualizationType = [{ ...schemaMetricTemplate, name: 'old metric 1' }];
    newVisualizationType = [{ ...schemaMetricTemplate, name: 'new metric 1', max: 1 }];
    types.get
      .mockReturnValueOnce({
        ui: {
          containerConfig: {
            data: {
              schemas: {
                all: oldVisualizationType,
              },
            },
          },
        },
      })
      .mockReturnValueOnce({
        ui: {
          containerConfig: {
            data: {
              schemas: {
                all: newVisualizationType,
              },
            },
          },
        },
      });

    aggConfigParams = [];
    const persistResult = usePersistedAggParams(
      types,
      aggConfigParams,
      'old vis type',
      'new vis type'
    );
    expect(persistResult).toMatchInlineSnapshot(`Array []`);
  });

  test('return an empty array when there are no new vis type or old vis type', () => {
    const persistResult = usePersistedAggParams(types, aggConfigParams);
    expect(persistResult).toMatchInlineSnapshot(`Array []`);
  });
});
