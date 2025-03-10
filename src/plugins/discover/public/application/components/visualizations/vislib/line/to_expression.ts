/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildExpression,
  buildExpressionFunction,
  IExpressionLoaderParams,
  SerializedFieldFormat,
} from '../../../../../../../expressions/public';
import { OpenSearchSearchHit } from '../../../../doc_views/doc_views_types';
import { VislibDimensions } from '../../../../../../../visualizations/public';
import { IndexPattern } from '../../../../../../../data/public';
import { createVisualizationConfigs } from '../../../../components/chart/utils/create_visualization_configs';
import { DiscoverViewServices } from '../../../../../build_services';

export const toExpression = async (
  services: DiscoverViewServices,
  searchContext: IExpressionLoaderParams['searchContext'],
  rows: OpenSearchSearchHit[],
  indexPattern: IndexPattern
) => {
  // This expression function is to convert rows data into the format of opensearch_dashboards_datatable
  // so that it can be processed by vislib expression function
  const discoverSearch = buildExpressionFunction('discoverSearch', {
    hits: JSON.stringify(rows),
  });

  // Determine dimensions and its config for the visualization
  const dimensions = await buildVislibDimensions(services, indexPattern, rows[0]);
  const valueAxes = getValueAxes(dimensions.y);

  // TODO: what do we want to put in this "vis config"?
  const visConfig = {
    addLegend: true,
    legendPosition: 'right',
    addTimeMarker: true,
    addTooltip: true,
    dimensions,
    valueAxes,
  };

  const vislib = buildExpressionFunction<any>('vislib', {
    type: 'line',
    visConfig: JSON.stringify(visConfig),
  });

  return buildExpression([discoverSearch, vislib]).toString();
};

// TODO: for right now, just pick the date field as the x-axis and every other field as y-axis
// The rules are mainly for metrics visualizations
// For non-metrics visualizations, there are more scenarios to consider and we should refine this function
export const buildVislibDimensions = async (
  services: DiscoverViewServices,
  dataset: IndexPattern,
  row: OpenSearchSearchHit
): Promise<VislibDimensions> => {
  // need the current columns
  // need the column schema to determine what is x and what is y
  // we can have the index pattern fields schema passed down
  // but how can we get the aggregated fields schema?

  // We always build x-axis as date histogram using the time field defined in the dataset
  // We build y-axis using the non-time field in the columns
  const configs = dataset.timeFieldName
    ? createVisualizationConfigs(dataset, 'auto', services.data, row)
    : null;

  const dimensions = getDimensions(configs, services.data);

  const x = {
    accessor: 0,
    format: {
      id: 'string',
      params: {
        id: 'string',
      },
    } as SerializedFieldFormat,
    label: 'x',
    params: {
      format: {
        id: 'string',
        params: {
          id: 'string',
        },
      },
    },
    title: 'x',
  };
  const y = {
    accessor: 1,
    format: {
      id: 'number',
      params: {
        id: 'number',
      },
    } as SerializedFieldFormat,
    label: 'y',
    params: {
      format: {
        id: 'number',
        params: {
          id: 'number',
        },
      },
    },
    title: 'y',
  };
};
