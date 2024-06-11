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

import fn from './label';

import _ from 'lodash';
const expect = require('chai').expect;
import invoke from './helpers/invoke_series_fn.js';

describe('label.js', () => {
  let seriesList;
  beforeEach(() => {
    seriesList = require('./fixtures/series_list.js')();
  });

  it('changes the label on the series', () => {
    return invoke(fn, [seriesList, 'free beer']).then((r) => {
      _.each(r.output.list, (series) => expect(series.label).to.equal('free beer'));
    });
  });

  it('can use a regex to capture parts of a series label', () => {
    return invoke(fn, [seriesList, 'beer$1', 'Neg(.*)']).then((r) => {
      expect(r.output.list[0].label).to.equal('beerative');
    });
  });

  it('can use a regex to capture groups to modify series label', () => {
    return invoke(fn, [seriesList, 'beer$2', '(N)(egative)']).then((r) => {
      expect(r.output.list[0].label).to.equal('beeregative');
    });
  });

  it('can handle different regex patterns', () => {
    const seriesListCopy1 = JSON.parse(JSON.stringify(seriesList));
    const seriesListCopy2 = JSON.parse(JSON.stringify(seriesList));

    return Promise.all([
      invoke(fn, [seriesListCopy1, 'beer$1 - $2', '(N)(egative)']).then((r) => {
        expect(r.output.list[0].label).to.equal('beerN - egative');
      }),
      invoke(fn, [seriesListCopy2, 'beer$1_$2', '(N)(eg.*)']).then((r) => {
        expect(r.output.list[0].label).to.equal('beerN_egative');
      }),
    ]);
  });
});
