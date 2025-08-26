/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ColorSchemas, ScaleType, Positions, AggregationType, PointShape } from '../types';

export const getPositions = () => [
  {
    text: i18n.translate('explore.vis.legendPositions.top', {
      defaultMessage: 'Top',
    }),
    value: Positions.TOP,
  },
  {
    text: i18n.translate('explore.vis.legendPositions.left', {
      defaultMessage: 'Left',
    }),
    value: Positions.LEFT,
  },
  {
    text: i18n.translate('explore.vis.legendPositions.right', {
      defaultMessage: 'Right',
    }),
    value: Positions.RIGHT,
  },
  {
    text: i18n.translate('explore.vis.legendPositions.bottom', {
      defaultMessage: 'Bottom',
    }),
    value: Positions.BOTTOM,
  },
];

export const getColorSchemas = () => [
  {
    text: i18n.translate('explore.vis.colorSchemas.blues', {
      defaultMessage: 'Blues',
    }),
    value: ColorSchemas.BLUES,
  },
  {
    text: i18n.translate('explore.vis.colorSchemas.greens', {
      defaultMessage: 'Greens',
    }),
    value: ColorSchemas.GREENS,
  },
  {
    text: i18n.translate('explore.vis.colorSchemas.greys', {
      defaultMessage: 'Greys',
    }),
    value: ColorSchemas.GREYS,
  },
  {
    text: i18n.translate('explore.vis.colorSchemas.reds', {
      defaultMessage: 'Reds',
    }),
    value: ColorSchemas.REDS,
  },
  {
    text: i18n.translate('explore.vis.colorSchemas.greenToBlue', {
      defaultMessage: 'Green to Blue',
    }),
    value: ColorSchemas.GREENBLUE,
  },
  {
    text: i18n.translate('explore.vis.colorSchemas.yellowToOrange', {
      defaultMessage: 'Yellow to Orange',
    }),
    value: ColorSchemas.YELLOWORANGE,
  },
];

export const getScaleType = () => [
  {
    text: i18n.translate('explore.vis.scaleType.linear', {
      defaultMessage: 'Linear',
    }),
    value: ScaleType.LINEAR,
  },

  {
    text: i18n.translate('explore.vis.scaleType.log', {
      defaultMessage: 'Log',
    }),
    value: ScaleType.LOG,
  },

  {
    text: i18n.translate('explore.vis.scaleType.sqrt', {
      defaultMessage: 'Square root',
    }),
    value: ScaleType.SQRT,
  },
];

export const getLabelType = () => [
  {
    text: i18n.translate('explore.vis.aggregationType.sum', {
      defaultMessage: 'Sum',
    }),
    value: AggregationType.SUM,
  },
  {
    text: i18n.translate('explore.vis.aggregationType.mean', {
      defaultMessage: 'Mean',
    }),
    value: AggregationType.MEAN,
  },
  {
    text: i18n.translate('explore.vis.aggregationType.max', {
      defaultMessage: 'Max',
    }),
    value: AggregationType.MAX,
  },
  {
    text: i18n.translate('explore.vis.aggregationType.min', {
      defaultMessage: 'Min',
    }),
    value: AggregationType.MIN,
  },
];

export const getPointShapes = () => [
  {
    text: i18n.translate('explore.vis.scatter.pointShape.circle', {
      defaultMessage: 'Circle',
    }),
    value: PointShape.CIRCLE,
  },
  {
    text: i18n.translate('explore.vis.scatter.pointShape.square', {
      defaultMessage: 'Square',
    }),
    value: PointShape.SQUARE,
  },
  {
    text: i18n.translate('explore.vis.scatter.pointShape.cross', {
      defaultMessage: 'Cross',
    }),
    value: PointShape.CROSS,
  },
  {
    text: i18n.translate('explore.vis.scatter.pointShape.diamond', {
      defaultMessage: 'Diamond',
    }),
    value: PointShape.DIAMOND,
  },
];
