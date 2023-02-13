/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from '../../saved_objects/public';
import { VisLayerTypes } from '../common';

export interface ISavedAugmentVis {
  id?: string;
  description?: string;
  pluginResourceId: string;
  visName?: string;
  visId?: string;
  visLayerExpressionFn: VisLayerExpressionFn;
  version?: number;
}

export interface VisLayerExpressionFn {
  type: keyof typeof VisLayerTypes;
  name: string;
  // plugin expression fns can freely set custom arguments
  args: { [key: string]: any };
}

export interface AugmentVisSavedObject extends SavedObject, ISavedAugmentVis {}
