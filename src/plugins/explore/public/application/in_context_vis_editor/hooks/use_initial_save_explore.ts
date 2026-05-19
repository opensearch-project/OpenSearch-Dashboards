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
  const { savedVisConfig, savedTransformationPipeline } = useMemo(() => {
    if (!savedExplore?.visualization)
      return { savedVisConfig: undefined, savedTransformationPipeline: undefined };
    try {
      const parsedVisualization = JSON.parse(savedExplore.visualization);
      const pipeline = parsedVisualization?.dataTransformationJSON
        ? JSON.parse(parsedVisualization.dataTransformationJSON)
        : undefined;
      return {
        savedVisConfig: parsedVisualization,
        savedTransformationPipeline: pipeline,
      };
    } catch {
      return { savedVisConfig: undefined, savedTransformationPipeline: undefined };
    }
  }, [savedExplore]);

  return {
    savedExplore,
    savedQueryState,
    savedVisConfig,
    savedTransformationPipeline,
    error,
    isLoading,
  };
};
