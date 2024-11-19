/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { QueryStateTrigger, QUERY_STATE_TRIGGER_TYPES } from '../types';

export const DATASET_CHANGED_TRIGGER: QueryStateTrigger = {
  id: QUERY_STATE_TRIGGER_TYPES.DATASET_CHANGED,
  title: i18n.translate('data.triggers.datasetChangedTriggerTitle', {
    defaultMessage: 'Dataset changed',
  }),
  description: i18n.translate('data.triggers.datasetChangedTriggerDescription', {
    defaultMessage: 'When a dataset is changed',
  }),
};
