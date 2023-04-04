/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep, isEmpty } from 'lodash';
import { i18n } from '@osd/i18n';
import {
  ExpressionFunctionDefinition,
  OpenSearchDashboardsDatatable,
} from '../../../expressions/public';
import { VislibDimensions, VisParams } from '../../../visualizations/public';
import {
  VisLayer,
  VisLayers,
  PointInTimeEventsVisLayer,
  isPointInTimeEventsVisLayer,
  addPointInTimeEventsLayersToTable,
  addPointInTimeEventsLayersToSpec,
  enableVisLayersInSpecConfig,
  addPointInTimeInteractionsConfig,
} from '../../../vis_augmenter/public';
import { formatDatatable, createSpecFromDatatable } from './helpers';
import { VegaVisualizationDependencies } from '../plugin';

type Input = OpenSearchDashboardsDatatable;
type Output = Promise<string>;

interface Arguments {
  visLayers: string | null;
  visParams: string;
  dimensions: string;
}

export type LineVegaSpecExpressionFunctionDefinition = ExpressionFunctionDefinition<
  'line_vega_spec',
  Input,
  Arguments,
  Output
>;

export const createLineVegaSpecFn = (
  dependencies: VegaVisualizationDependencies
): LineVegaSpecExpressionFunctionDefinition => ({
  name: 'line_vega_spec',
  type: 'string',
  inputTypes: ['opensearch_dashboards_datatable'],
  help: i18n.translate('visTypeVega.function.help', {
    defaultMessage: 'Construct line vega spec',
  }),
  args: {
    visLayers: {
      types: ['string', 'null'],
      default: '',
      help: '',
    },
    visParams: {
      types: ['string'],
      default: '""',
      help: '',
    },
    dimensions: {
      types: ['string'],
      default: '""',
      help: '',
    },
  },
  async fn(input, args, context) {
    let table = formatDatatable(cloneDeep(input));

    const visParams = JSON.parse(args.visParams) as VisParams;
    const dimensions = JSON.parse(args.dimensions) as VislibDimensions;
    const allVisLayers = (args.visLayers ? JSON.parse(args.visLayers) : []) as VisLayers;

    // currently only supporting PointInTimeEventsVisLayer type
    const pointInTimeEventsVisLayers = allVisLayers.filter((visLayer: VisLayer) =>
      isPointInTimeEventsVisLayer(visLayer)
    ) as PointInTimeEventsVisLayer[];

    if (!isEmpty(pointInTimeEventsVisLayers) && dimensions.x !== null) {
      table = addPointInTimeEventsLayersToTable(table, dimensions, pointInTimeEventsVisLayers);
    }

    let spec = createSpecFromDatatable(table, visParams, dimensions);

    if (!isEmpty(pointInTimeEventsVisLayers) && dimensions.x !== null) {
      spec = addPointInTimeEventsLayersToSpec(table, dimensions, spec);
      spec.config = enableVisLayersInSpecConfig(spec, pointInTimeEventsVisLayers);
      spec.config = addPointInTimeInteractionsConfig(spec.config);
    }
    return JSON.stringify(spec);
  },
});
