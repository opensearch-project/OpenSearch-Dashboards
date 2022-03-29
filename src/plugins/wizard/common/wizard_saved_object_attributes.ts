/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes } from 'opensearch-dashboards/public';

export const WIZARD_SAVED_OBJECT = 'wizard';

export interface WizardSavedObjectAttributes extends SavedObjectAttributes {
  title: string;
  description?: string;
  state: string;
}
