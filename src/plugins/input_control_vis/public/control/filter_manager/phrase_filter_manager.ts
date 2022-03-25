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

import { FilterManager } from './filter_manager';
import {
  PhraseFilter,
  opensearchFilters,
  IndexPattern,
  FilterManager as QueryFilterManager,
} from '../../../../data/public';

export class PhraseFilterManager extends FilterManager {
  constructor(
    controlId: string,
    fieldName: string,
    indexPattern: IndexPattern,
    queryFilter: QueryFilterManager
  ) {
    super(controlId, fieldName, indexPattern, queryFilter);
  }

  createFilter(phrases: any): PhraseFilter {
    let newFilter: PhraseFilter;
    const value = this.indexPattern.fields.getByName(this.fieldName);

    if (!value) {
      throw new Error(`Unable to find field with name: ${this.fieldName} on indexPattern`);
    }

    if (phrases.length === 1) {
      newFilter = opensearchFilters.buildPhraseFilter(value, phrases[0], this.indexPattern);
    } else {
      newFilter = opensearchFilters.buildPhrasesFilter(value, phrases, this.indexPattern);
    }

    newFilter.meta.key = this.fieldName;
    newFilter.meta.controlledBy = this.controlId;
    return newFilter;
  }

  getValueFromFilterBar() {
    const osdFilters = this.findFilters();
    if (osdFilters.length === 0) {
      return;
    }

    const values = osdFilters
      .map((osdFilter) => {
        return this.getValueFromFilter(osdFilter);
      })
      .filter((value) => value != null);

    if (values.length === 0) {
      return;
    }

    return values.reduce((accumulator, currentValue) => {
      return accumulator.concat(currentValue);
    }, []);
  }

  /**
   * Extract filtering value from OpenSearch Dashboards filters
   *
   * @param  {PhraseFilter} osdFilter
   * @return {Array.<string>} array of values pulled from filter
   */
  private getValueFromFilter(osdFilter: PhraseFilter): any {
    // bool filter - multiple phrase filters
    if (_.has(osdFilter, 'query.bool.should')) {
      return _.get(osdFilter, 'query.bool.should')
        .map((osdQueryFilter: PhraseFilter) => {
          return this.getValueFromFilter(osdQueryFilter);
        })
        .filter((value: any) => {
          if (value) {
            return true;
          }
          return false;
        });
    }

    // scripted field filter
    if (_.has(osdFilter, 'script')) {
      return _.get(osdFilter, 'script.script.params.value');
    }

    // single phrase filter
    if (opensearchFilters.isPhraseFilter(osdFilter)) {
      if (opensearchFilters.getPhraseFilterField(osdFilter) !== this.fieldName) {
        return;
      }

      return opensearchFilters.getPhraseFilterValue(osdFilter);
    }

    // single phrase filter from bool filter
    if (_.has(osdFilter, ['match_phrase', this.fieldName])) {
      return _.get(osdFilter, ['match_phrase', this.fieldName]);
    }
  }
}
