/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { IOsdUrlStateStorage } from '../../../../opensearch_dashboards_utils/public';
import { QuerySetup, QueryStart } from '../query_service';
import { syncQueryStateWithUrl } from './sync_state_with_url';

/**
 * Hook version of syncQueryStateWithUrl, automatically clean up subscriptions
 * @param QueryService: either setup or start
 * @param osdUrlStateStorage to use for syncing
 */
export const useSyncQueryStateWithUrl = (
  query: Pick<QueryStart | QuerySetup, 'filterManager' | 'timefilter' | 'queryString' | 'state$'>,
  osdUrlStateStorage: IOsdUrlStateStorage
) => {
  const [startSync, setStartSync] = useState(false);
  useEffect(() => {
    let stopSync: () => void;

    if (startSync) {
      // starts syncing `_g` portion of url with query services
      stopSync = syncQueryStateWithUrl(query, osdUrlStateStorage).stop;
    }

    return () => {
      if (stopSync) {
        stopSync();
      }
    };
  }, [osdUrlStateStorage, query, startSync]);

  const startSyncingQueryStateWithUrl = () => {
    setStartSync(true);
  };

  return { startSyncingQueryStateWithUrl };
};
