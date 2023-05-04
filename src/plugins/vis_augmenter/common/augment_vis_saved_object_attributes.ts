/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes } from 'opensearch-dashboards/server';

export interface AugmentVisSavedObjectAttributes extends SavedObjectAttributes {
  title: string;
  description?: string;
  originPlugin: string;
  pluginResource: {
    type: string;
    id: string;
  };
  visName: string;
  visLayerExpressionFn: {
    type: string;
    name: string;
  };
  version: number;
}
