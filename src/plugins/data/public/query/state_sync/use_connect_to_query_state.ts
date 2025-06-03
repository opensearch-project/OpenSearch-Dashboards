/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { QuerySetup, QueryStart } from '../query_service';
import { IOsdUrlStateStorage } from '../../../../opensearch_dashboards_utils/public';
import { connectStorageToQueryState, ISyncConfig } from './connect_to_query_state';

/**
 * Hook version of connectStorageToQueryState, automatically unSub
 * from OsdUrlStateStorage
 * @param queryService: either setup or start
 * @param osdUrlStateStorage to use for syncing and store data
 * @param syncConfig app filter and query
 */
export const useConnectStorageToQueryState = (
  queryService: Pick<
    QueryStart | QuerySetup,
    'timefilter' | 'filterManager' | 'queryString' | 'state$'
  >,
  osdUrlStateStorage: IOsdUrlStateStorage,
  syncConfig: ISyncConfig
) => {
  useEffect(() => {
    const unSub = connectStorageToQueryState(queryService, osdUrlStateStorage, syncConfig);
    return () => {
      if (unSub) {
        unSub();
      }
    };
  }, [osdUrlStateStorage, queryService, syncConfig]);
};
