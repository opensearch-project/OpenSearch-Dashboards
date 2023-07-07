/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExpressionTypeDefinition, ExpressionFunctionDefinition } from '../../../expressions';
import { VisLayers, VisLayerTypes } from '../';

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

export type VisLayerFunctionDefinition = ExpressionFunctionDefinition<
  string,
  ExprVisLayers,
  any,
  Promise<ExprVisLayers>
>;

export interface VisLayerExpressionFn {
  type: keyof typeof VisLayerTypes;
  name: string;
  // plugin expression fns can freely set custom arguments
  args: { [key: string]: any };
}
