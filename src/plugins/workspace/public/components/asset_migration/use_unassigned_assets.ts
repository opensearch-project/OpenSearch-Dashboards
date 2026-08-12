/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { HttpSetup, SavedObjectsStart } from 'opensearch-dashboards/public';
import { countUnassignedAssets, formatError, loadMigratableAssetTypes } from './utils';

export interface UnassignedAssetsState {
  total: number;
  types: string[];
  loading: boolean;
  error?: string;
}

export interface UseUnassignedAssetsResult extends UnassignedAssetsState {
  /** Re-run the lookup, to retry after a failure or after a migration changed the total. */
  refresh: () => void;
}

/**
 * Count the saved objects that belong to no workspace.
 */
export const useUnassignedAssets = (
  http: HttpSetup,
  client: SavedObjectsStart['client'],
  enabled: boolean
): UseUnassignedAssetsResult => {
  const [state, setState] = useState<UnassignedAssetsState>({
    total: 0,
    types: [],
    loading: enabled,
  });

  const fetchTotal = useCallback(async () => {
    // The previous error is kept until the new outcome is known, so the caller's retry affordance
    // stays mounted and can show that it is working.
    setState((previous) => ({ ...previous, loading: true }));
    try {
      const types = await loadMigratableAssetTypes(http);
      setState({ total: await countUnassignedAssets(client, types), types, loading: false });
    } catch (e) {
      setState({ total: 0, types: [], loading: false, error: formatError(e) });
    }
  }, [client, http]);

  useEffect(() => {
    if (!enabled) {
      setState({ total: 0, types: [], loading: false });
      return;
    }
    fetchTotal();
  }, [enabled, fetchTotal]);

  return { ...state, refresh: fetchTotal };
};
