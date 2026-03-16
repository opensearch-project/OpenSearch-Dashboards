/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';

import { toExpression } from './utils/to_expression';
import { ExecutionContextSearch } from '../../../../expressions/common/';
import { ExpressionRendererEvent, ExpressionsStart } from '../../../../expressions/public';
import { opensearchFilters, TimeRange } from '../../../../data/public';

interface Props {
  searchContext?: ExecutionContextSearch;
  ExpressionRenderer?: ExpressionsStart['ReactExpressionRenderer'];
  onSelectTimeRange?: (timeRange?: TimeRange) => void;
  spec: any;
}

export const VegaRender = ({
  searchContext,
  ExpressionRenderer,
  onSelectTimeRange,
  spec,
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
