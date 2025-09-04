/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import fn from './yaxis';
import Bluebird from 'bluebird';
import invoke from './helpers/invoke_series_fn.js';

describe('yaxis.js', () => {
  let seriesList;
  beforeEach(() => {
    seriesList = require('./fixtures/series_list.js')();
  });

  it('creates the yaxes array', () => {
    expect(seriesList._global).toEqual(undefined);
    return invoke(fn, [seriesList, 2]).then((r) => {
      expect(Array.isArray(r.output.list[0]._global.yaxes)).toBe(true);
    });
  });

  it('puts odd numbers of the left, even on the right, by default', () => {
    return Bluebird.all([
      invoke(fn, [seriesList, 1]).then((r) => {
        expect(r.output.list[0]._global.yaxes[0].position).toEqual('left');
      }),
      invoke(fn, [seriesList, 2]).then((r) => {
        expect(r.output.list[0]._global.yaxes[1].position).toEqual('right');
      }),
      invoke(fn, [seriesList, 3]).then((r) => {
        expect(r.output.list[0]._global.yaxes[2].position).toEqual('left');
      }),
    ]);
  });

  it('it lets you override default positions', () => {
    return Bluebird.all([
      invoke(fn, [seriesList, 1, null, null, 'right']).then((r) => {
        expect(r.output.list[0]._global.yaxes[0].position).toEqual('right');
      }),
      invoke(fn, [seriesList, 2, null, null, 'right']).then((r) => {
        expect(r.output.list[0]._global.yaxes[1].position).toEqual('right');
      }),
    ]);
  });

  it('sets the minimum (default: no min)', () => {
    return Bluebird.all([
      invoke(fn, [seriesList, 1, null]).then((r) => {
        expect(r.output.list[0]._global.yaxes[0].min).toEqual(null);
      }),
      invoke(fn, [seriesList, 2, 10]).then((r) => {
        expect(r.output.list[0]._global.yaxes[1].min).toEqual(10);
      }),
    ]);
  });

  it('sets the max (default: no max)', () => {
    return Bluebird.all([
      invoke(fn, [seriesList, 1, null]).then((r) => {
        expect(r.output.list[0]._global.yaxes[0].max).toEqual(undefined);
      }),
      invoke(fn, [seriesList, 2, null, 10]).then((r) => {
        expect(r.output.list[0]._global.yaxes[1].max).toEqual(10);
      }),
    ]);
  });

  it('sets the units (default: no unit', () => {
    return Bluebird.all([
      invoke(fn, [seriesList, 1, null, null, null, null, null, null]).then((r) => {
        expect(r.output.list[0]._global.yaxes[0].units).toEqual(undefined);
      }),
      invoke(fn, [seriesList, 2, null, null, null, null, null, 'bits']).then((r) => {
        expect(typeof r.output.list[0]._global.yaxes[1].units).toBe('object');
      }),
    ]);
  });

  it('throws an error if currency is not three letter code', () => {
    invoke(fn, [seriesList, 1, null, null, null, null, null, 'currency:abcde']).catch((e) => {
      expect(e).toBeInstanceOf(Error);
    });
    invoke(fn, [seriesList, 1, null, null, null, null, null, 'currency:12']).catch((e) => {
      expect(e).toBeInstanceOf(Error);
    });
    invoke(fn, [seriesList, 1, null, null, null, null, null, 'currency:$#']).catch((e) => {
      expect(e).toBeInstanceOf(Error);
    });
    invoke(fn, [seriesList, 1, null, null, null, null, null, 'currency:ab']).catch((e) => {
      expect(e).toBeInstanceOf(Error);
    });
  });
});
