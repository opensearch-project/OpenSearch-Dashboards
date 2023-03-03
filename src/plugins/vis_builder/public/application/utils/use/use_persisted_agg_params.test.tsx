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
  beforeEach(() => {});

  test('return the correct metric to metric, bucket to bucket mapping', () => {});

  test('drop the aggregations if it exceeds the max count', () => {});

  test('drop the aggregation when there is no schema', () => {});
});

describe('updateAggParams', () => {
  let oldAggParam: CreateAggConfigParams;
  let aggMap: Map<string, AggMapping>;
  let assignNewSchemaType: any;

  beforeEach(() => {
    oldAggParam = {
      type: '',
      enabled: true,
      schema: '',
    };
    aggMap = new Map<string, AggMapping>();
    aggMap.set('old metric', {
      currentCount: 0,
      maxCount: 1,
      name: 'new metric',
    });
    aggMap.set('old bucket', {
      currentCount: 0,
      maxCount: 1,
      name: 'new bucket',
    });
    assignNewSchemaType = jest.fn();
  });

  test('return with the undefined schema if the old schema title does not get a mapping', () => {
    const newAgg = updateAggParams(oldAggParam, aggMap);
    expect(newAgg).toEqual(oldAggParam);
  });

  test('return the original aggregation with undefined schema', () => {
    oldAggParam.schema = 'noMappingSchema';
    const newAgg = updateAggParams(oldAggParam, aggMap);
    expect(newAgg).toEqual({
      type: '',
      enabled: true,
      schema: undefined,
    });
  });

  test('return with the updated schema for metric', () => {
    oldAggParam.schema = 'old metric';
    const newAgg = updateAggParams(oldAggParam, aggMap);
    expect(newAgg).toEqual({
      type: '',
      enabled: true,
      schema: 'new metric',
    });
    expect(aggMap.get('old metric')).toEqual({
      currentCount: 1,
      maxCount: 1,
      name: 'new metric',
    });
  });

  test('return with the undefined schema if the mapped schema fields already reach max count', () => {
    oldAggParam.schema = 'old metric';
    aggMap.set('old metric', {
      currentCount: 1,
      maxCount: 1,
      name: 'new metric',
    });
    const newAgg = updateAggParams(oldAggParam, aggMap);
    expect(newAgg).toEqual({
      type: '',
      enabled: true,
      schema: undefined,
    });
  });
});

describe('getSchemaMapping', () => {
  let oldVisualizationType: Schema[];
  let newVisualizationType: Schema[];
  let schemaMetricTemplate: Schema;
  let schemaBucketTemplate: Schema;

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
  });

  test('map metric schema to metric schema, bucket schema to bucket schema according to order', async () => {
    oldVisualizationType = [
      { ...schemaMetricTemplate, name: 'old metric 1' },
      { ...schemaBucketTemplate, name: 'old bucket 1' },
      { ...schemaMetricTemplate, name: 'old metric 2' },
      { ...schemaBucketTemplate, name: 'old bucket 2' },
      { ...schemaBucketTemplate, name: 'old bucket 3' },
      { ...schemaBucketTemplate, name: 'old bucket 4' },
      { ...schemaBucketTemplate, group: AggGroupNames.None, name: 'none' },
    ];
    newVisualizationType = [
      { ...schemaMetricTemplate, name: 'new metric 1', max: 1 },
      { ...schemaMetricTemplate, name: 'new metric 2', max: 2 },
      { ...schemaMetricTemplate, name: 'new metric 3', max: 3 },
      { ...schemaBucketTemplate, name: 'new bucket 1', max: 4 },
      { ...schemaBucketTemplate, name: 'new bucket 2', max: 5 },
      { ...schemaBucketTemplate, name: 'new bucket 3', max: 6 },
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
  });
});

describe('usePersistedAggParams', () => {
  let mockServices: jest.Mocked<VisBuilderServices>;
  let types: any;
  let aggConfigParams: CreateAggConfigParams[];
  let oldVisType: string | undefined;
  let newVisType: string | undefined;

  beforeEach(() => {
    mockServices = createVisBuilderServicesMock();
    types = mockServices.types;
    aggConfigParams = [];
    oldVisType = 'oldVisType';
    newVisType = 'newVisType';
  });

  test('return an empty array when there is no old vis type or new vis type', async () => {
    oldVisType = '';
    const persistResult = usePersistedAggParams(types, aggConfigParams, oldVisType, newVisType);
    expect(persistResult).toEqual([]);
  });
});
