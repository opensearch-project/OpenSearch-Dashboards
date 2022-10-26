/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes } from '../../../core/types';

export const VISBUILDER_SAVED_OBJECT = 'wizard';

export interface VisBuilderSavedObjectAttributes extends SavedObjectAttributes {
  title: string;
  description?: string;
  visualizationState?: string;
  styleState?: string;
  version: number;
  searchSourceFields?: {
    index?: string;
  };
}
