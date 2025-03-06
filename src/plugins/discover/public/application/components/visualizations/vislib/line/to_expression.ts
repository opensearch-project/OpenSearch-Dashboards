/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildExpression,
  buildExpressionFunction,
  ExpressionFunctionOpenSearchDashboards,
  IExpressionLoaderParams,
  SerializedFieldFormat,
} from '../../../../../../../expressions/public';

export interface SchemaConfig {
  accessor: number;
  label: string;
  format: SerializedFieldFormat;
  params: any;
  aggType: string;
}

interface VislibDimensions {
  x: any;
  y: SchemaConfig[];
  z?: any[];
  width?: any[];
  series?: any[];
  splitRow?: any[];
  splitColumn?: any[];
}

export const toExpression = async (searchContext: IExpressionLoaderParams['searchContext']) => {
  // Determine dimensions and its config for the visualization
  const dimensions = await buildVislibDimensions(vis, params);
  const valueAxes = getValueAxes(dimensions.y);

  // TODO: what do we want to put in this "vis config"?
  const visConfig = {
    addLegend,
    legendPosition,
    addTimeMarker: false,
    addTooltip,
    dimensions,
    valueAxes,
  };

  const opensearchDashboards = buildExpressionFunction<ExpressionFunctionOpenSearchDashboards>(
    'opensearchDashboards',
    {}
  );

  // This expression function is to convert rows data into the format of opensearch_dashboards_datatable
  // so that it can be processed by vislib expression function
  const discoverVis = buildExpressionFunction('discoverVis', {});

  const vislib = buildExpressionFunction<any>('vislib', {
    type: 'line',
    visConfig: JSON.stringify(visConfig),
  });

  return buildExpression([opensearchDashboards, discoverVis, vislib]).toString();
};

export const buildVislibDimensions = async (vis: any, params: any): Promise<VislibDimensions> => {};
