/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';

import { toExpression } from './utils/to_expression';
import { ExecutionContextSearch } from '../../../../expressions/common/';
import { ExpressionRendererEvent, ExpressionsStart } from '../../../../expressions/public';
import { opensearchFilters, TimeRange } from '../../../../data/public';
import { VisData } from './visualization_builder.types';
import { RenderChartConfig } from './types';
import { createVisSpec } from './utils/create_vis_spec';

interface Props {
  searchContext?: ExecutionContextSearch;
  ExpressionRenderer?: ExpressionsStart['ReactExpressionRenderer'];
  onSelectTimeRange?: (timeRange?: TimeRange) => void;
  timeRange: TimeRange;
  data?: VisData;
  config?: RenderChartConfig;
}

export const VegaRender = ({
  searchContext,
  ExpressionRenderer,
  onSelectTimeRange,
  data,
  config,
  timeRange,
}: Props) => {
  const onExpressionEvent = useCallback(
    async (e: ExpressionRendererEvent) => {
      if (!onSelectTimeRange) {
        return;
      }
      if (e.name === 'applyFilter') {
        if (e.data && e.data.filters) {
          const { timeRange: extractedTimeRange } = opensearchFilters.extractTimeRange(
            e.data.filters,
            e.data.timeFieldName
          );
          onSelectTimeRange(extractedTimeRange);
        }
      }
    },
    [onSelectTimeRange]
  );

  const spec = useMemo(() => {
    return createVisSpec({ data, config, timeRange });
  }, [config, data, timeRange]);

  const expression = toExpression(searchContext, spec);

  if (!ExpressionRenderer) {
    return null;
  }

  return (
    <ExpressionRenderer
      key={JSON.stringify(searchContext) + expression}
      expression={expression}
      searchContext={searchContext}
      onEvent={onExpressionEvent}
    />
  );
};
