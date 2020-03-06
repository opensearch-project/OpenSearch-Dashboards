/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { getChartSize } from './chart_size';

describe('chart size utilities', () => {
  test('array', () => {
    expect(getChartSize([100, 100])).toEqual({
      width: 100,
      height: 100,
    });
    expect(getChartSize([undefined, 100])).toEqual({
      width: '100%',
      height: 100,
    });
    expect(getChartSize([100, undefined])).toEqual({
      width: 100,
      height: '100%',
    });
    expect(getChartSize([undefined, undefined])).toEqual({
      width: '100%',
      height: '100%',
    });
    expect(getChartSize([0, '100em'])).toEqual({
      width: 0,
      height: '100em',
    });
  });
  test('value', () => {
    expect(getChartSize(1)).toEqual({
      width: 1,
      height: 1,
    });
    expect(getChartSize('100em')).toEqual({
      width: '100em',
      height: '100em',
    });
    expect(getChartSize(0)).toEqual({
      width: 0,
      height: 0,
    });
  });
  test('object', () => {
    expect(getChartSize({ width: 100, height: 100 })).toEqual({
      width: 100,
      height: 100,
    });
    expect(getChartSize({ height: 100 })).toEqual({
      width: '100%',
      height: 100,
    });
    expect(getChartSize({ width: 100 })).toEqual({
      width: 100,
      height: '100%',
    });
    expect(getChartSize({})).toEqual({
      width: '100%',
      height: '100%',
    });
    expect(getChartSize({ width: 0, height: '100em' })).toEqual({
      width: 0,
      height: '100em',
    });
  });
});
