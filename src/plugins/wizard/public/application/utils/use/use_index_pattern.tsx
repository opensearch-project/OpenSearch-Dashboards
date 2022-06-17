/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useState } from 'react';
import { IndexPattern } from '../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { WizardServices } from '../../../types';
import { useTypedSelector } from '../state_management';

export const useIndexPattern = (): IndexPattern | undefined => {
  const { indexPattern: indexId = '' } = useTypedSelector((state) => state.visualization);
  const [indexPattern, setIndexPattern] = useState<IndexPattern>();
  const {
    services: {
      data: { indexPatterns },
    },
  } = useOpenSearchDashboards<WizardServices>();

  const handleIndexUpdate = useCallback(async () => {
    const currentIndex = await indexPatterns.get(indexId);
    setIndexPattern(currentIndex);
  }, [indexId, indexPatterns]);

  useEffect(() => {
    handleIndexUpdate();
  }, [handleIndexUpdate]);

  return indexPattern;
};

export const useIndexPatterns = () => {
  const { indexPattern: indexId = '' } = useTypedSelector((state) => state.visualization);
  const [indexPatterns, setIndexPatterns] = useState<IndexPattern[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const {
    services: { data },
  } = useOpenSearchDashboards<WizardServices>();

  let foundSelected;
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
        const ids = await data.indexPatterns.getIds(indexId);
        const patterns = await Promise.all(ids.map((id) => data.indexPatterns.get(id)));
        setIndexPatterns(patterns);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    handleUpdate();
    // we want to run this hook exactly once, which you do by an empty dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    indexPatterns,
    error,
    loading,
    selected: foundSelected!,
  };
};
