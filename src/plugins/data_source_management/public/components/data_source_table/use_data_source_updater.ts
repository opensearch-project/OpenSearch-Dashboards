/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback } from 'react';
import { DEFAULT_DATA_SOURCE_UI_SETTINGS_ID } from '../constants';
import { UiSettingScope } from '../../../../../core/public';
import { DataSourceTableItem } from '../../types';
import { WorkspaceObject, IUiSettingsClient, NotificationsStart } from '../../../../../core/public';

interface UseDataSourceUpdaterDeps {
  fetchDataSources: () => Promise<DataSourceTableItem[]>;
  defaultDataSourceIdRef: React.MutableRefObject<string | null>;
  uiSettings: IUiSettingsClient;
  loadDefaultDataSourceId: () => Promise<void>;
  currentWorkspace: WorkspaceObject | null | undefined;
  notifications: NotificationsStart;
}

export const useDataSourceUpdater = ({
  fetchDataSources,
  defaultDataSourceIdRef,
  uiSettings,
  loadDefaultDataSourceId,
  currentWorkspace,
  notifications,
}: UseDataSourceUpdaterDeps) => {
  const handleDataSourceUpdated = useCallback(async () => {
    try {
      const res = await fetchDataSources();
      if (!defaultDataSourceIdRef.current && res.length > 0) {
        await uiSettings.set(
          DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
          res[0].id,
          currentWorkspace ? UiSettingScope.WORKSPACE : UiSettingScope.GLOBAL
        );
        await loadDefaultDataSourceId();
      }
    } catch (error) {
      notifications.toasts.addWarning(error.message);
    }
  }, [
    fetchDataSources,
    defaultDataSourceIdRef,
    uiSettings,
    loadDefaultDataSourceId,
    currentWorkspace,
    notifications.toasts,
  ]);

  return {
    handleDataSourceUpdated,
  };
};
