/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AggGroupName, AggGroupNames, CreateAggConfigParams } from '../../../../data/common';
import { Schema } from '../../../../vis_default_editor/public';
import { getPersistedAggParams } from './get_persisted_agg_params';

describe('getPersistedAggParams', () => {
  const getSchema = (
    name: string,
    group: AggGroupName,
    aggFilter: string[] = ['*'],
    max: number = Infinity
  ): Schema => ({
    name,
    group,
    max,
    min: 0,
    aggFilter,
    defaults: [],
    editor: true,
    params: [],
    title: name,
  });

  test('Should return the same aggConfigParams when the new vis type schemas have the same schemas as the existing schemas', () => {
    const aggConfigParams: CreateAggConfigParams[] = [
      { type: 'avg', schema: 'm1' },
      { type: 'avg', schema: 'm2' },
      { type: 'avg', schema: 'b2' },
      { type: 'avg', schema: 'b2' },
    ];

    const schemas = [
      getSchema('m1', AggGroupNames.Metrics),
      getSchema('m2', AggGroupNames.Metrics),
      getSchema('b2', AggGroupNames.Buckets),
    ];

    const persistResult = getPersistedAggParams(aggConfigParams, schemas, schemas);

    expect(persistResult).toEqual(aggConfigParams);
  });

  test('Should select the next compatible schema when aggConfigParam schema exists but exceeds the max count of the schema', () => {
    const aggConfigParams: CreateAggConfigParams[] = [
      { type: 'avg', schema: 'm1' },
      { type: 'avg', schema: 'm1' },
      { type: 'avg', schema: 'b2' },
      { type: 'avg', schema: 'b2' },
    ];

    const schemas = [
      getSchema('m1', AggGroupNames.Metrics, ['avg'], 1),
      getSchema('m2', AggGroupNames.Metrics),
      getSchema('b2', AggGroupNames.Buckets),
    ];

    const persistResult = getPersistedAggParams(aggConfigParams, schemas, schemas);

    const expected: CreateAggConfigParams[] = [...aggConfigParams];
    expected[1].schema = 'm2';
    expect(persistResult).toEqual(expected);
  });

  test('Should select the next compatible schema when aggConfigParam schema exists but does not match the group in the new schema', () => {
    const aggConfigParams: CreateAggConfigParams[] = [
      { type: 'avg', schema: 'm1' },
      { type: 'avg', schema: 'm1' },
      { type: 'avg', schema: 'b1' },
      { type: 'avg', schema: 'b1' },
    ];

    const oldSchemas = [
      getSchema('m1', AggGroupNames.Metrics),
      getSchema('b1', AggGroupNames.Buckets),
    ];

    const newSchemas = [
      getSchema('m1', AggGroupNames.Buckets),
      getSchema('m2', AggGroupNames.Metrics),
      getSchema('b1', AggGroupNames.Buckets),
    ];

    const persistResult = getPersistedAggParams(aggConfigParams, oldSchemas, newSchemas);

    const expected: CreateAggConfigParams[] = [...aggConfigParams];
    expected[0].schema = 'm2';
    expected[1].schema = 'm2';
    expect(persistResult).toEqual(expected);
  });

  test('Should select the next compatible schema with the correct aggfilters', () => {
    const aggConfigParams: CreateAggConfigParams[] = [
      { type: 'count', schema: 'm1' },
      { type: 'avg', schema: 'm1' },
      { type: 'avg', schema: 'b1' },
      { type: 'avg', schema: 'b1' },
    ];

    const oldSchemas = [
      getSchema('m1', AggGroupNames.Metrics),
      getSchema('b1', AggGroupNames.Buckets),
    ];

    const newSchemas = [
      getSchema('m2', AggGroupNames.Metrics, ['count']),
      getSchema('m3', AggGroupNames.Metrics, ['!count']),
      getSchema('b1', AggGroupNames.Buckets),
    ];

    const persistResult = getPersistedAggParams(aggConfigParams, oldSchemas, newSchemas);

    const expected: CreateAggConfigParams[] = [...aggConfigParams];
    expected[0].schema = 'm2';
    expected[1].schema = 'm3';
    expect(persistResult).toEqual(expected);
  });

  test('Should drop aggConfigParam when no compatible schema is found', () => {
    const aggConfigParams: CreateAggConfigParams[] = [
      { type: 'avg', schema: 'm1' },
      { type: 'avg', schema: 'm1' },
      { type: 'avg', schema: 'b1' },
      { type: 'avg', schema: 'b1' },
    ];

    const oldSchemas = [
      getSchema('m1', AggGroupNames.Metrics),
      getSchema('b1', AggGroupNames.Buckets),
    ];

    const newSchemas = [
      getSchema('m2', AggGroupNames.Metrics, ['count']),
      getSchema('m3', AggGroupNames.Metrics, ['!count'], 1),
      getSchema('b1', AggGroupNames.Buckets),
    ];

    const persistResult = getPersistedAggParams(aggConfigParams, oldSchemas, newSchemas);

    expect(persistResult.length).toBe(3);
  });
});
