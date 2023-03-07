/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from '../../../saved_objects/public';
import { VisLayerExpressionFn } from '../expressions';

export interface ISavedAugmentVis {
  id?: string;
  title: string;
  description?: string;
  pluginResourceId: string;
  visName?: string;
  visId?: string;
  visLayerExpressionFn: VisLayerExpressionFn;
  version?: number;
}

export interface AugmentVisSavedObject extends SavedObject, ISavedAugmentVis {}
