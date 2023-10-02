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

import _ from 'lodash';
import { UrlParams } from '../../autocomplete/url_params';
import { populateContext } from '../../autocomplete/engine';
import { Term } from '../types';
import { PartialAutoCompleteContext } from '../components/autocomplete_component';
import { SharedComponent } from '../components';

describe('Url params', () => {
  function paramTest(
    name: string,
    description: Record<string, unknown>,
    tokenPath: string | Array<string | string[]>,
    expectedContext: PartialAutoCompleteContext,
    globalParams?: Record<string, unknown>
  ) {
    test(name, function () {
      const urlParams = new UrlParams(description, globalParams || {});
      if (typeof tokenPath === 'string') {
        tokenPath = _.map(tokenPath.split('/'), function (p) {
          const pSplit = p.split(',');
          if (pSplit.length === 1) {
            return pSplit[0];
          }
          return pSplit;
        });
      }

      if (expectedContext.autoCompleteSet) {
        expectedContext.autoCompleteSet = _.map(expectedContext.autoCompleteSet, function (term) {
          if (_.isString(term)) {
            term = { name: term };
          }
          return term;
        });
        expectedContext.autoCompleteSet = _.sortBy(expectedContext.autoCompleteSet, 'name');
      }

      const context: PartialAutoCompleteContext = {};

      populateContext(
        tokenPath,
        context,
        null,
        expectedContext.autoCompleteSet ? true : false,
        urlParams.getTopLevelComponents() as SharedComponent[]
      );

      const populatedContext = context;

      if (populatedContext.autoCompleteSet) {
        populatedContext.autoCompleteSet = _.sortBy(populatedContext.autoCompleteSet, 'name');
      }

      expect(populatedContext).toEqual(expectedContext);
    });
  }

  function createTerm(name: string, meta?: string, insertValue?: string) {
    const term: Term = { name };
    if (meta) {
      term.meta = meta;
      if (meta === 'param' && !insertValue) {
        insertValue = name + '=';
      }
    }
    if (insertValue) {
      term.insertValue = insertValue;
    }
    return term;
  }

  (function () {
    const params = {
      a: ['1', '2'],
      b: '__flag__',
    };
    paramTest('settings params', params, 'a/1', { a: ['1'] });

    paramTest('autocomplete top level', params, [], {
      autoCompleteSet: [createTerm('a', 'param'), createTerm('b', 'flag')],
    });

    paramTest(
      'autocomplete top level, with defaults',
      params,
      [],
      {
        autoCompleteSet: [
          createTerm('a', 'param'),
          createTerm('b', 'flag'),
          createTerm('c', 'param'),
        ],
      },
      {
        c: [2],
      }
    );

    paramTest('autocomplete values', params, 'a', {
      autoCompleteSet: [createTerm('1', 'a'), createTerm('2', 'a')],
    });

    paramTest('autocomplete values flag', params, 'b', {
      autoCompleteSet: [createTerm('true', 'b'), createTerm('false', 'b')],
    });
  })();
});
