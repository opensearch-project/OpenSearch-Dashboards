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

import { Filter, IndexPatternsContract, IndexPattern } from 'src/plugins/data/public';
import { reverseSortDir, SortDirection } from './utils/sorting';
import { extractNanos, convertIsoToMillis } from './utils/date_conversion';
import { fetchHitsInInterval } from './utils/fetch_hits_in_interval';
import { generateIntervals } from './utils/generate_intervals';
import { getOpenSearchQuerySearchAfter } from './utils/get_opensearch_query_search_after';
import { getOpenSearchQuerySort } from './utils/get_opensearch_query_sort';
import { getServices } from '../../../../../opensearch_dashboards_services';

export enum SurrDocType {
  SUCCESSORS = 'successors',
  PREDECESSORS = 'predecessors',
}
export interface OpenSearchHitRecord {
  fields: Record<string, any>;
  sort: number[];
  _source: Record<string, any>;
  _id: string;
  isAnchor?: boolean;
}
export type OpenSearchHitRecordList = OpenSearchHitRecord[];

const DAY_MILLIS = 24 * 60 * 60 * 1000;

// look from 1 day up to 10000 days into the past and future
const LOOKUP_OFFSETS = [0, 1, 7, 30, 365, 10000].map((days) => days * DAY_MILLIS);

/**
 * Fetch successor or predecessor documents of a given anchor document
 *
 * @param {SurrDocType} type - `successors` or `predecessors`
 * @param {string} indexPatternId
 * @param {OpenSearchHitRecord} anchor - anchor record
 * @param {string} timeField - name of the timefield, that's sorted on
 * @param {string} tieBreakerField - name of the tie breaker, the 2nd sort field
 * @param {SortDirection} sortDir - direction of sorting
 * @param {number} size - number of records to retrieve
 * @param {Filter[]} filters - to apply in the query
 * @returns {Promise<object[]>}
 */

export async function fetchSurroundingDocs(
  type: SurrDocType,
  indexPattern: IndexPattern,
  anchor: OpenSearchHitRecord,
  tieBreakerField: string,
  sortDir: SortDirection,
  size: number,
  filters: Filter[]
) {
  if (typeof anchor !== 'object' || anchor === null || !size) {
    return [];
  }
  const timeField = indexPattern.timeFieldName!;
  const searchSource = await createSearchSource(indexPattern, filters);
  const sortDirToApply = type === 'successors' ? sortDir : reverseSortDir(sortDir);

  const nanos = indexPattern.isTimeNanosBased() ? extractNanos(anchor._source[timeField]) : '';
  const timeValueMillis =
    nanos !== '' ? convertIsoToMillis(anchor._source[timeField]) : anchor.sort[0];

  const intervals = generateIntervals(LOOKUP_OFFSETS, timeValueMillis, type, sortDir);
  let documents: OpenSearchHitRecordList = [];

  for (const interval of intervals) {
    const remainingSize = size - documents.length;

    if (remainingSize <= 0) {
      break;
    }

    const searchAfter = getOpenSearchQuerySearchAfter(type, documents, timeField, anchor, nanos);

    const sort = getOpenSearchQuerySort(timeField, tieBreakerField, sortDirToApply);

    const hits = await fetchHitsInInterval(
      searchSource,
      timeField,
      sort,
      sortDirToApply,
      interval,
      searchAfter,
      remainingSize,
      nanos,
      anchor._id
    );

    documents =
      type === 'successors' ? [...documents, ...hits] : [...hits.slice().reverse(), ...documents];
  }

  return documents;
}

export async function createSearchSource(indexPattern: IndexPattern, filters: Filter[]) {
  const { data } = getServices();

  const searchSource = await data.search.searchSource.create();
  return searchSource
    .setParent(undefined)
    .setField('index', indexPattern)
    .setField('filter', filters);
}
