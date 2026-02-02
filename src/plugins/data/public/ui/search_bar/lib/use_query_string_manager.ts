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

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { Query } from '../../..';
import { QueryStringContract } from '../../../query/query_string';

interface UseQueryStringProps {
  query?: Query;
  queryString: QueryStringContract;
}

/**
 * Hook to subscribe to QueryStringManager state using React 18's useSyncExternalStore.
 *
 * This hook properly handles the synchronization between React's render cycle and
 * external state (the QueryStringManager service). Using useSyncExternalStore ensures:
 * 1. No missed updates between render and effect execution
 * 2. Proper handling of concurrent React features (Suspense, transitions)
 * 3. Consistent state during server-side rendering
 *
 * @param props.query - Optional initial query to use instead of service state
 * @param props.queryString - The QueryStringManager service contract
 * @returns Object containing the current query and an updateQuery function
 */
export const useQueryStringManager = (props: UseQueryStringProps) => {
  // Create stable subscribe function that connects to the RxJS observable
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      // Subscribe to query updates from the service
      const subscription = props.queryString.getUpdates$().subscribe({
        next: onStoreChange,
      });

      // Return unsubscribe function
      return () => {
        subscription.unsubscribe();
      };
    },
    [props.queryString]
  );

  // Create stable getSnapshot function that returns current query state
  // If props.query is provided, use it; otherwise get from service
  const getSnapshot = useCallback(() => {
    return props.query || props.queryString.getQuery();
  }, [props.query, props.queryString]);

  // useSyncExternalStore ensures React always has the latest state from the service
  // It handles the timing issues that occur with useEffect + useState pattern
  const query = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Memoize updateQuery to prevent unnecessary re-renders in consumers
  const updateQuery = useCallback(
    (newQueryPartial: Partial<Query>) => {
      const currentQuery = props.queryString.getQuery();
      const updatedQuery = { ...currentQuery, ...newQueryPartial };
      props.queryString.setQuery(updatedQuery);
    },
    [props.queryString]
  );

  return useMemo(
    () => ({
      query,
      updateQuery,
    }),
    [query, updateQuery]
  );
};
