/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { integer } from '@opensearch-project/opensearch/api/types';
import { SavedObjectAttributes } from '../../../core/types';

export const WIZARD_SAVED_OBJECT = 'wizard';

export interface WizardSavedObjectAttributes extends SavedObjectAttributes {
  title: string;
  description?: string;
  visualizationState?: string;
  styleState?: string;
  version: integer;
}
