/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes } from 'opensearch-dashboards/server';

export interface AugmentVisSavedObjectAttributes extends SavedObjectAttributes {
  id: string;
  title: string;
  description?: string;
  originPlugin: string;
  pluginResource: {
    type: string;
    id: string;
  };
  visLayerExpressionFn: {
    type: string;
    name: string;
  };
  version: number;
  // Following fields are optional since they will get set/removed during the extraction/injection
  // of the vis reference
  visName?: string;
  visId?: string;
  visReference?: {
    id: string;
    name: string;
  };
  // Error may be populated if there is some issue when parsing the attribute values
  error?: string;
}
