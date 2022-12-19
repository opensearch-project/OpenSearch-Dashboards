/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// import { get } from 'lodash';
import { buildVislibDimensions, Vis } from '../../visualizations/public';
import { buildExpression, buildExpressionFunction } from '../../expressions/public';
import { OpenSearchaggsExpressionFunctionDefinition } from '../../data/common/search/expressions';
import {
  VegaExpressionFunctionDefinition,
  VegaSpecExpressionFunctionDefinition,
} from '../../vis_type_vega/public';

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
  if (params.visLayers == null || Object.keys(params.visLayers).length === 0) {
    // This wont work but is needed so then it will default to the original vis lib renderer
    const dimensions = await buildVislibDimensions(vis, params);
    const visConfig = { ...vis.params, dimensions };
    const vislib = buildExpressionFunction<any>('vislib', {
      type: 'line',
      visConfig: JSON.stringify(visConfig),
    });
    const ast = buildExpression([opensearchaggsFn, vislib]);
    return ast.toAst();
  } else {
    const dimensions = await buildVislibDimensions(vis, params);
    // adding the new expr fn here that takes the datatable and converts to a vega spec
    const vegaSpecFn = buildExpressionFunction<VegaSpecExpressionFunctionDefinition>('vega_spec', {
      visLayers: JSON.stringify([]),
      visParams: JSON.stringify(vis.params),
      dimensions: JSON.stringify(dimensions),
    });
    const vegaSpecFnExpressionBuilder = buildExpression([vegaSpecFn]);

    // build vega expr fn. use nested expression fn syntax to first construct the
    // spec via 'vega_spec' fn, then set as the arg for the final 'vega' fn
    const vegaFn = buildExpressionFunction<VegaExpressionFunctionDefinition>('vega', {
      spec: vegaSpecFnExpressionBuilder,
    });
    const ast = buildExpression([opensearchaggsFn, vegaFn]);
    return ast.toAst();
  }
};
