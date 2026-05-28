/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import { IndexPattern } from '../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { VisBuilderServices } from '../../../types';
import { useTypedSelector } from '../state_management';
import { UNSUPPORTED_ENGINE_TYPES } from '../../../../../data/common';

export const useIndexPatterns = () => {
  const { indexPattern: indexId = '' } = useTypedSelector((state) => state.visualization);
  const [indexPatterns, setIndexPatterns] = useState<IndexPattern[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const {
    services: { data, savedObjects },
  } = useOpenSearchDashboards<VisBuilderServices>();

  let foundSelected: IndexPattern | undefined;
  if (!loading && !error && indexId) {
    foundSelected = indexPatterns.filter((p) => p.id === indexId)[0];
    // If the selected index pattern was filtered out (e.g., it's an AnalyticEngine data source),
    // don't treat it as an error - it will be handled by selecting the first available pattern
    if (foundSelected === undefined && indexPatterns.length === 0) {
      setError(new Error('No index patterns available'));
    }
  }

  useEffect(() => {
    const handleUpdate = async () => {
      try {
        const ids = await data.indexPatterns.getIds(true);
        const patterns = await Promise.all(ids.map((id) => data.indexPatterns.get(id)));

        const indexPatternList =
          (await data.indexPatterns.getCache({
            excludeEngineTypes: UNSUPPORTED_ENGINE_TYPES,
          })) ?? [];

        const indexPatternIds = new Set(indexPatternList.map((item) => item.id));
        setIndexPatterns(patterns.filter((i) => indexPatternIds.has(i.id)));
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    handleUpdate();
  }, [data.indexPatterns, savedObjects.client]);

  return {
    indexPatterns,
    error,
    loading,
    selected: foundSelected,
  };
};
