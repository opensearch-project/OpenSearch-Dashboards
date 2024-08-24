/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Subscription } from 'rxjs';
import { Query } from '../../../../../data/common';
import { QueryStringContract } from '../../../../../data/public';

interface UseQueryStringManager {
  query?: Query;
  queryString: QueryStringContract;
}

export const useQueryStringManager = (props: UseQueryStringManager) => {
  const [query, setQuery] = useState<Query | undefined>(
    props.query || props.queryString.getQuery()
  );

  useEffect(() => {
    const subscriptions = new Subscription();

    subscriptions.add(
      props.queryString.getUpdates$().subscribe({
        next: () => {
          const newQuery = props.queryString.getQuery();
          setQuery(newQuery);
        },
      })
    );

    return () => {
      subscriptions.unsubscribe();
    };
  }, [query, props.query, props.queryString]);

  return { query };
};
