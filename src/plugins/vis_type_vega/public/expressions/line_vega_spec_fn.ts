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
  addVisEventSignalsToSpecConfig,
  augmentEventChartSpec,
} from '../../../vis_augmenter/public';
import { formatDatatable, createSpecFromXYChartDatatable } from './helpers';
import { VegaVisualizationDependencies } from '../plugin';

type Input = OpenSearchDashboardsDatatable;
type Output = Promise<string>;

interface Arguments {
  visLayers: string | null;
  visParams: string;
  dimensions: string;
  visAugmenterConfig: string;
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
  help: i18n.translate('visTypeVega.function.helpSpec', {
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
    visAugmenterConfig: {
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
    const visAugmenterConfig = JSON.parse(args.visAugmenterConfig);

    // currently only supporting PointInTimeEventsVisLayer type
    const pointInTimeEventsVisLayers = allVisLayers.filter((visLayer: VisLayer) =>
      isPointInTimeEventsVisLayer(visLayer)
    ) as PointInTimeEventsVisLayer[];

    if (!isEmpty(pointInTimeEventsVisLayers) && dimensions.x !== null) {
      table = addPointInTimeEventsLayersToTable(table, dimensions, pointInTimeEventsVisLayers);
    }

    let spec = createSpecFromXYChartDatatable(table, visParams, dimensions, visAugmenterConfig);

    if (!isEmpty(pointInTimeEventsVisLayers) && dimensions.x !== null) {
      spec = addPointInTimeEventsLayersToSpec(table, dimensions, spec);
      // @ts-ignore
      spec.config = enableVisLayersInSpecConfig(spec, pointInTimeEventsVisLayers);
      // @ts-ignore
      spec.config = addVisEventSignalsToSpecConfig(spec);
    }

    // Apply other formatting changes to the spec (show vis data, hide axes, etc.) based on the
    // vis augmenter config. Mostly used for customizing the views on the view events flyout.
    spec = augmentEventChartSpec(visAugmenterConfig, spec);
    return JSON.stringify(spec);
  },
});
