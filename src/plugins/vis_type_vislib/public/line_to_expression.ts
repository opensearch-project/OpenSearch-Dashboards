/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildVislibDimensions, Vis, VislibDimensions } from '../../visualizations/public';
import { buildExpression, buildExpressionFunction } from '../../expressions/public';
import { OpenSearchaggsExpressionFunctionDefinition } from '../../data/common/search/expressions';
import {
  VegaExpressionFunctionDefinition,
  LineVegaSpecExpressionFunctionDefinition,
} from '../../vis_type_vega/public';
import { isEligibleForVisLayers } from '../../vis_augmenter/public';

export const toExpressionAst = async (vis: Vis, params: any) => {
  // Construct the existing expr fns that are ran for vislib line chart, up until the render fn.
  // That way we get the exact same data table of results as if it was a vislib chart.
  const opensearchaggsFn = buildExpressionFunction<OpenSearchaggsExpressionFunctionDefinition>(
    'opensearchaggs',
    {
      index: vis.data.indexPattern!.id!,
      metricsAtAllLevels: vis.isHierarchical(),
      partialRows: vis.params.showPartialRows || false,
      aggConfigs: JSON.stringify(vis.data.aggs!.aggs),
      includeFormatHints: false,
    }
  );

  // Checks if there are vislayers to overlay. If not, default to the vislib implementation.
  const dimensions: VislibDimensions = await buildVislibDimensions(vis, params);
  if (
    !isEligibleForVisLayers(vis, dimensions) ||
    params.visLayers == null ||
    Object.keys(params.visLayers).length === 0
  ) {
    // This wont work but is needed so then it will default to the original vis lib renderer
    const visConfig = { ...vis.params, dimensions };
    const vislib = buildExpressionFunction<any>('vislib', {
      type: 'line',
      visConfig: JSON.stringify(visConfig),
    });
    const ast = buildExpression([opensearchaggsFn, vislib]);
    return ast.toAst();
  } else {
    // adding the new expr fn here that takes the datatable and converts to a vega spec
    const vegaSpecFn = buildExpressionFunction<LineVegaSpecExpressionFunctionDefinition>(
      'line_vega_spec',
      {
        visLayers: JSON.stringify(params.visLayers),
        visParams: JSON.stringify(vis.params),
        dimensions: JSON.stringify(dimensions),
      }
    );
    const vegaSpecFnExpressionBuilder = buildExpression([vegaSpecFn]);

    // build vega expr fn. use nested expression fn syntax to first construct the
    // spec via 'line_vega_spec' fn, then set as the arg for the final 'vega' fn
    const vegaFn = buildExpressionFunction<VegaExpressionFunctionDefinition>('vega', {
      spec: vegaSpecFnExpressionBuilder,
    });
    const ast = buildExpression([opensearchaggsFn, vegaFn]);
    return ast.toAst();
  }
};
