import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { UI_SETTINGS } from '../../../../../src/plugins/data/common';
import { PersistedLog } from '../../../../../src/plugins/data/public';
import { IStorageWrapper } from '../../../../../src/plugins/opensearch_dashboards_utils/public';

export function getPersistedLog(
  uiSettings: IUiSettingsClient,
  storage: IStorageWrapper,
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
