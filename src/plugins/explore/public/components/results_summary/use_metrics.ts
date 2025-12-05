/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UsageCollectionSetup } from '../../../../usage_collection/public';

const METRIC_APP = 'query-assist';

export const useMetrics = (usageCollection?: UsageCollectionSetup) => {
  const reportMetric = useCallback(
    (metric: string) => {
      if (usageCollection) {
        usageCollection.reportUiStats(
          METRIC_APP,
          usageCollection.METRIC_TYPE.CLICK,
          metric + '-' + uuidv4()
        );
      }
    },
    [usageCollection]
  );

  const reportCountMetric = useCallback(
    (metric: string, count: number) => {
      if (usageCollection) {
        usageCollection.reportUiStats(
          METRIC_APP,
          usageCollection.METRIC_TYPE.COUNT,
          metric + '-' + uuidv4(),
          count
        );
      }
    },
    [usageCollection]
  );

  return { reportMetric, reportCountMetric };
};
