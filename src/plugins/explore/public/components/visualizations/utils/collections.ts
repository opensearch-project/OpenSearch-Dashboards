/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

export enum Positions {
  RIGHT = 'right',
  LEFT = 'left',
  TOP = 'top',
  BOTTOM = 'bottom',
}
export type PositionsType = Positions;

export const getPositions = () => [
  {
    text: i18n.translate('explore.vis.legendPositions.topText', {
      defaultMessage: 'Top',
    }),
    value: Positions.TOP,
  },
  {
    text: i18n.translate('explore.vis.legendPositions.leftText', {
      defaultMessage: 'Left',
    }),
    value: Positions.LEFT,
  },
  {
    text: i18n.translate('explore.vis.legendPositions.rightText', {
      defaultMessage: 'Right',
    }),
    value: Positions.RIGHT,
  },
  {
    text: i18n.translate('explore.vis.legendPositions.bottomText', {
      defaultMessage: 'Bottom',
    }),
    value: Positions.BOTTOM,
  },
];
