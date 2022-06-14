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
