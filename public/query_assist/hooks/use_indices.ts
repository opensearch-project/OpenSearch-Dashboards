/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CatIndicesResponse } from '@opensearch-project/opensearch/api/types';
import { Reducer, useEffect, useReducer, useState } from 'react';
import { IDataPluginServices } from '../../../../../src/plugins/data/public';
import { useOpenSearchDashboards } from '../../../../../src/plugins/opensearch_dashboards_react/public';

interface State<T> {
  data?: T;
  loading: boolean;
  error?: Error;
}

type Action<T> =
  | { type: 'request' }
  | { type: 'success'; payload: State<T>['data'] }
  | { type: 'failure'; error: NonNullable<State<T>['error']> };

// TODO use instantiation expressions when typescript is upgraded to >= 4.7
type GenericReducer<T = any> = Reducer<State<T>, Action<T>>;
export const genericReducer: GenericReducer = (state, action) => {
  switch (action.type) {
    case 'request':
      return { data: state.data, loading: true };
    case 'success':
      return { loading: false, data: action.payload };
    case 'failure':
      return { loading: false, error: action.error };
    default:
      return state;
  }
};

export const useIndices = (dataSourceId: string | undefined) => {
  const reducer: GenericReducer<string[]> = genericReducer;
  const [state, dispatch] = useReducer(reducer, { loading: false });
  const [refresh, setRefresh] = useState({});
  const { services } = useOpenSearchDashboards<IDataPluginServices>();

  useEffect(() => {
    const abortController = new AbortController();
    dispatch({ type: 'request' });
    services.http
      .post('/api/console/proxy', {
        query: { path: '_cat/indices?format=json', method: 'GET', dataSourceId },
        signal: abortController.signal,
      })
      .then((payload: CatIndicesResponse) =>
        dispatch({
          type: 'success',
          payload: payload
            .filter((meta) => meta.index && !meta.index.startsWith('.'))
            .map((meta) => meta.index!),
        })
      )
      .catch((error) => dispatch({ type: 'failure', error }));

    return () => abortController.abort();
  }, [refresh, services.http, dataSourceId]);

  return { ...state, refresh: () => setRefresh({}) };
};

export const useIndexPatterns = () => {
  const reducer: GenericReducer<string[]> = genericReducer;
  const [state, dispatch] = useReducer(reducer, { loading: false });
  const [refresh, setRefresh] = useState({});
  const { services } = useOpenSearchDashboards<IDataPluginServices>();

  useEffect(() => {
    let abort = false;
    dispatch({ type: 'request' });

    services.data.indexPatterns
      .getTitles()
      .then((payload) => {
        if (!abort)
          dispatch({
            type: 'success',
            // temporary solution does not support index patterns from other data sources
            payload: payload.filter((title) => !title.includes('::')),
          });
      })
      .catch((error) => {
        if (!abort) dispatch({ type: 'failure', error });
      });

    return () => {
      abort = true;
    };
  }, [refresh, services.data.indexPatterns]);

  return { ...state, refresh: () => setRefresh({}) };
};
