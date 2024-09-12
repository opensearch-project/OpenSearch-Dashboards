/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { DataStorage, UI_SETTINGS } from '../../../../data/common';
import { PersistedLog } from '../../../../data/public';

export function getPersistedLog(
  uiSettings: IUiSettingsClient,
  storage: DataStorage,
  language: string
) {
  return new PersistedLog(
    `typeahead:${language}`,
    {
      maxLength: uiSettings.get(UI_SETTINGS.HISTORY_LIMIT),
      filterDuplicates: true,
    },
    storage
  );
}
