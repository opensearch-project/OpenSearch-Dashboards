/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from '../../../saved_objects/public';
import { VisLayerExpressionFn } from '../expressions';

export interface ISavedPluginResource {
  type: string;
  id: string;
}

export interface ISavedAugmentVis {
  id?: string;
  title: string;
  description?: string;
  originPlugin: string;
  pluginResource: ISavedPluginResource;
  visName?: string;
  visId?: string;
  visLayerExpressionFn: VisLayerExpressionFn;
  version?: number;
}

export interface AugmentVisSavedObject extends SavedObject, ISavedAugmentVis {}
