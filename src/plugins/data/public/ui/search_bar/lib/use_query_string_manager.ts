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

import { useState, useEffect, useCallback } from 'react';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Query } from '../../..';
import { QueryStringContract } from '../../../query/query_string';
import { SearchData } from '../../../../../discover/public';

interface UseQueryStringProps {
  query?: Query;
  queryString: QueryStringContract;
  data$?: BehaviorSubject<SearchData>;
}

export const useQueryStringManager = (props: UseQueryStringProps) => {
  // Filters should be either what's passed in the initial state or the current state of the filter manager
  const [query, setQuery] = useState(() => props.query || props.queryString.getQuery());
  const [queryResult, setQueryResult] = useState<SearchData | undefined>(undefined);

  useEffect(() => {
    const subscriptions = new Subscription();
    subscriptions.add(
      props.queryString.getUpdates$().subscribe({
        next: () => {
          setQuery((prevQuery) => {
            const newQuery = props.queryString.getQuery();
            // Only update if the query has actually changed
            return JSON.stringify(prevQuery) !== JSON.stringify(newQuery) ? newQuery : prevQuery;
          });
        },
      })
    );
    return () => {
      subscriptions.unsubscribe();
    };
  }, [props.queryString]);

  useEffect(() => {
    if (!props.data$) {
      return;
    }
    const subscription = props.data$.subscribe((d) => {
      setQueryResult(d);
    });
  }, [props.data$]);

  // Use callback to memoize the function
  const updateQuery = useCallback(
    (newQueryPartial: Partial<Query>) => {
      const updatedQuery = { ...query, ...newQueryPartial };
      props.queryString.setQuery(updatedQuery);
      setQuery(updatedQuery);
    },
    [query, props.queryString]
  );

  return {
    query,
    updateQuery,
    queryResult,
  };
};
