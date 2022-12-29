/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateAggConfigParams } from '../../../../../data/common';
import { Schema } from '../../../../../vis_default_editor/public';
import { VisBuilderServices } from '../../../types';
import { createVisBuilderServicesMock } from '../mocks';
import { updateAggParams, usePersistedAggParams } from './use_persisted_agg_param';

describe('test use persisted agg param', () => {
  let mockServices: jest.Mocked<VisBuilderServices>;
  let oldAggParams: any;
  let oldVisType: string | undefined;
  let newVisType: string | undefined;
  let oldAggParam: CreateAggConfigParams;
  let newVisualizationType: Schema[];

  beforeEach(() => {
    mockServices = createVisBuilderServicesMock();
    oldAggParams = [
      {
        schema: 'metric',
      },
    ];
    oldVisType = 'area';
    newVisType = 'line';
    oldAggParam = {
      schema: 'metric',
      type: 'metric',
    };
    newVisualizationType = [
      {
        aggFilter: [],
        editor: true,
        group: 'metrics',
        max: 3,
        min: 0,
        name: 'metric',
        params: [],
        title: '',
        defaults: '',
      },
    ];
  });

  test('when old vis type is metric or table', () => {
    oldVisType = 'table';
    const returnParams = usePersistedAggParams(
      mockServices.types,
      oldAggParams,
      oldVisType,
      newVisType
    );
    expect(returnParams).toStrictEqual([]);
  });

  test('when new vis type is metric or table', () => {
    newVisType = 'metric';
    const returnParams = usePersistedAggParams(
      mockServices.types,
      oldAggParams,
      oldVisType,
      newVisType
    );
    expect(returnParams).toStrictEqual([]);
  });

  test('agg param is persisted when there is matching schema', () => {
    const result = updateAggParams(oldAggParam, newVisualizationType);
    expect(result).toBeTruthy();
  });

  test('agg param is not persisted when there is not matching schema', () => {
    oldAggParam = {
      schema: 'group',
      type: 'group',
    };
    const result = updateAggParams(oldAggParam, newVisualizationType);
    expect(result).toBeFalsy();
  });
});
