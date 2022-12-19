/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExpressionTypeDefinition } from '../types';
import { VisLayers } from '../../../../vis_augmenter/common';

const name = 'vis_layers';

export interface ExprVisLayers {
  type: typeof name;
  layers: VisLayers;
}

// Setting default empty arrays for null & undefined edge cases
export const visLayers: ExpressionTypeDefinition<typeof name, ExprVisLayers> = {
  name,
  from: {
    null: () => {
      return {
        type: name,
        layers: [] as VisLayers,
      } as ExprVisLayers;
    },
    undefined: () => {
      return {
        type: name,
        layers: [] as VisLayers,
      } as ExprVisLayers;
    },
  },
};
