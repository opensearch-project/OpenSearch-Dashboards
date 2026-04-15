/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useSavedExplore } from '../../../application/utils/hooks/use_saved_explore';
import { useCurrentExploreId } from '../hooks/use_explore_id';
import { QueryState } from '../query_builder/query_builder';

export const useInitialSaveExplore = () => {
  const exploreId = useCurrentExploreId();
  const { savedExplore, error, isLoading } = useSavedExplore(exploreId);

  // parse savedQueryState and visconfig from saved explore
  const savedQueryState: QueryState | undefined = useMemo(() => {
    if (!savedExplore?.kibanaSavedObjectMeta?.searchSourceJSON) return undefined;
    const searchSource = JSON.parse(savedExplore.kibanaSavedObjectMeta.searchSourceJSON);
    return searchSource.query;
  }, [savedExplore]);

  const savedVisConfig = useMemo(() => {
    if (!savedExplore?.visualization) return undefined;
    return JSON.parse(savedExplore.visualization);
  }, [savedExplore]);

  return { savedExplore, savedQueryState, savedVisConfig, error, isLoading };
};
