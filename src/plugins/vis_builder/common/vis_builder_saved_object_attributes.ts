/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes } from '../../../core/types';

export const VISBUILDER_SAVED_OBJECT = 'visualization-visbuilder';

export interface VisBuilderSavedObjectAttributes extends SavedObjectAttributes {
  title: string;
  description?: string;
  visualizationState?: string;
  updated_at?: string;
  styleState?: string;
  uiState?: string;
  version: number;
  searchSourceFields?: {
    index?: string;
  };
}
