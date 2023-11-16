/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vis } from '../../visualizations/public';
import { buildExpression, buildExpressionFunction } from '../../expressions/public';
import { DrilldownVisExpressionFunctionDefinition } from './drilldown_fn';

export const toExpressionAst = (vis: Vis) => {
  const { markdown, fontSize, openLinksInNewTab } = vis.params;

  const drilldownVis = buildExpressionFunction<DrilldownVisExpressionFunctionDefinition>(
    'markdownVis',
    {
      markdown,
      font: buildExpression(`font size=${fontSize}`),
      openLinksInNewTab,
    }
  );

  const ast = buildExpression([drilldownVis]);

  return ast.toAst();
};
