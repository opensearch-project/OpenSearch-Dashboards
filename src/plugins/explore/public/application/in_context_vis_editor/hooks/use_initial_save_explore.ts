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
    try {
      const searchSource = JSON.parse(savedExplore.kibanaSavedObjectMeta.searchSourceJSON);
      return searchSource.query;
    } catch {
      return undefined;
    }
  }, [savedExplore]);

  // parse saved vis state and transformation from saved explore
  const { savedVisConfig } = useMemo(() => {
    if (!savedExplore?.visualization)
      return { savedVisConfig: undefined, savedTransformationPipeline: undefined };
    try {
      const parsedVisualization = JSON.parse(savedExplore.visualization);

      return {
        savedVisConfig: parsedVisualization,
      };
    } catch {
      return { savedVisConfig: undefined, savedTransformationPipeline: undefined };
    }
  }, [savedExplore]);

  return {
    savedExplore,
    savedQueryState,
    savedVisConfig,
    error,
    isLoading,
  };
};
