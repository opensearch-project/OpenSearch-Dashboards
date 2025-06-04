/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 */

import { i18n } from '@osd/i18n';
import { $Values } from '@osd/utility-types';
export const Positions = Object.freeze({
  RIGHT: 'right' as 'right',
  LEFT: 'left' as 'left',
  TOP: 'top' as 'top',
  BOTTOM: 'bottom' as 'bottom',
});
export type Positions = $Values<typeof Positions>;

export const getPositions = () => [
  {
    text: i18n.translate('visTypeVislib.legendPositions.topText', {
      defaultMessage: 'Top',
    }),
    value: Positions.TOP,
  },
  {
    text: i18n.translate('visTypeVislib.legendPositions.leftText', {
      defaultMessage: 'Left',
    }),
    value: Positions.LEFT,
  },
  {
    text: i18n.translate('visTypeVislib.legendPositions.rightText', {
      defaultMessage: 'Right',
    }),
    value: Positions.RIGHT,
  },
  {
    text: i18n.translate('visTypeVislib.legendPositions.bottomText', {
      defaultMessage: 'Bottom',
    }),
    value: Positions.BOTTOM,
  },
];
