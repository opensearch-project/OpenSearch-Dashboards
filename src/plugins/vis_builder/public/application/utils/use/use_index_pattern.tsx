/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import { IndexPattern } from '../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { VisBuilderServices } from '../../../types';
import { useTypedSelector } from '../state_management';

export const useIndexPatterns = () => {
  const { indexPattern: indexId = '' } = useTypedSelector((state) => state.visualization);
  const [indexPatterns, setIndexPatterns] = useState<IndexPattern[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const {
    services: { data },
  } = useOpenSearchDashboards<VisBuilderServices>();

  let foundSelected: IndexPattern | undefined;
  if (!loading && !error) {
    foundSelected = indexPatterns.filter((p) => p.id === indexId)[0];
    if (foundSelected === undefined) {
      setError(
        new Error("Attempted to select an index pattern that wasn't in the index pattern list")
      );
    }
  }

  useEffect(() => {
    const handleUpdate = async () => {
      try {
        const ids = await data.indexPatterns.getIds(true);
        const patterns = await Promise.all(ids.map((id) => data.indexPatterns.get(id)));
        setIndexPatterns(patterns);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    handleUpdate();
  }, [data.indexPatterns]);

  return {
    indexPatterns,
    error,
    loading,
    selected: foundSelected,
  };
};
