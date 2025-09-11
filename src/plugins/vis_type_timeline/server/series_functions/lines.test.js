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

import fn from './lines';
import invoke from './helpers/invoke_series_fn.js';

describe('lines.js', () => {
  let seriesList;
  beforeEach(() => {
    seriesList = require('./fixtures/series_list.js')();
  });

  it('should simply set show, steps, stack and lineWidth', () => {
    expect(seriesList.list[0]._global).toEqual(undefined);
    return invoke(fn, [seriesList, 1, 2, true, true, false]).then((r) => {
      expect(r.output.list[0].lines.lineWidth).toEqual(1);
      expect(r.output.list[0].lines.show).toEqual(true);
      expect(r.output.list[0].stack).toEqual(true);
      expect(r.output.list[0].lines.steps).toEqual(false);
    });
  });

  it('should set lineWidth to 3 by default, and nothing else', () => {
    expect(seriesList.list[0]._global).toEqual(undefined);
    return invoke(fn, [seriesList]).then((r) => {
      expect(r.output.list[0].lines.lineWidth).toEqual(3);
      expect(r.output.list[0].lines.fill).toEqual(undefined);
      expect(r.output.list[0].lines.show).toEqual(undefined);
      expect(r.output.list[0].stack).toEqual(undefined);
      expect(r.output.list[0].lines.steps).toEqual(undefined);
    });
  });
});
