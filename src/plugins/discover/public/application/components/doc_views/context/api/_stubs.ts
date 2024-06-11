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

import sinon, { SinonSpy } from 'sinon';
import moment from 'moment';
import { OpenSearchHitRecordList } from './context';

type Hit = {
  [key in string]: number;
} & {
  sort: [number, number];
};

interface SearchSourceStub {
  _stubHits: any[];
  _stubTimeField?: string;
  _createStubHit: (timestamp: any, tiebreaker?: number) => Record<string, any>;
  setParent: SinonSpy;
  setField: SinonSpy;
  getField: SinonSpy;
  fetch: SinonSpy;
}

export function createIndexPatternsStub() {
  return {
    get: sinon.spy((indexPatternId) =>
      Promise.resolve({
        id: indexPatternId,
        isTimeNanosBased: () => false,
        popularizeField: () => {},
      })
    ),
  };
}

/**
 * A stubbed search source with a `fetch` method that returns all of `_stubHits`.
 */
export function createSearchSourceStub(hits: OpenSearchHitRecordList, timeField?: string) {
  const searchSourceStub: Partial<SearchSourceStub> = {
    _stubHits: hits,
    _stubTimeField: timeField,
    _createStubHit: (timestamp: number, tiebreaker = 0) => ({
      [searchSourceStub._stubTimeField]: timestamp,
      sort: [timestamp, tiebreaker],
    }),
  };

  searchSourceStub.setParent = sinon.spy(() => searchSourceStub);
  searchSourceStub.setField = sinon.spy(() => searchSourceStub);

  searchSourceStub.getField = sinon.spy((key: string) => {
    const previousSetCall = searchSourceStub.setField?.withArgs(key).lastCall;
    return previousSetCall ? previousSetCall.args[1] : null;
  });

  searchSourceStub.fetch = sinon.spy(() =>
    Promise.resolve({
      hits: {
        hits: searchSourceStub._stubHits,
        total: searchSourceStub._stubHits.length,
      },
    })
  );

  return searchSourceStub as SearchSourceStub;
}

/**
 * A stubbed search source with a `fetch` method that returns a filtered set of `_stubHits`.
 */
export function createContextSearchSourceStub(
  hits: OpenSearchHitRecordList,
  timeField: string = '@timestamp'
) {
  const searchSourceStub = createSearchSourceStub(hits, timeField);

  searchSourceStub.fetch = sinon.spy(() => {
    const timeFieldStr = searchSourceStub._stubTimeField as string;
    const lastQuery = searchSourceStub.setField.withArgs('query').lastCall.args[1];
    const timeRange = lastQuery.query.bool.must.constant_score.filter.range[timeFieldStr];
    const lastSort = searchSourceStub.setField.withArgs('sort').lastCall.args[1];
    const sortDirection = lastSort[0][timeFieldStr];
    const sortFunction =
      sortDirection === 'asc'
        ? (first: Hit, second: Hit) => first[timeFieldStr] - second[timeFieldStr]
        : (first: Hit, second: Hit) => second[timeFieldStr] - first[timeFieldStr];
    const filteredHits = searchSourceStub._stubHits
      .filter(
        (hit: Hit) =>
          moment(hit[timeFieldStr]).isSameOrAfter(timeRange.gte) &&
          moment(hit[timeFieldStr]).isSameOrBefore(timeRange.lte)
      )
      .sort(sortFunction);

    return Promise.resolve({
      hits: {
        hits: filteredHits,
        total: filteredHits.length,
      },
    });
  });

  return searchSourceStub;
}
