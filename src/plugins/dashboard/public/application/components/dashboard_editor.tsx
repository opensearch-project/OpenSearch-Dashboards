/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-console */

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EventEmitter } from 'events';
import { i18n } from '@osd/i18n';
import { DashboardTopNav } from '../components/dashboard_top_nav';
import { useChromeVisibility } from '../utils/use/use_chrome_visibility';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { useSavedDashboardInstance } from '../utils/use/use_saved_dashboard_instance';
import { DashboardServices } from '../../types';
import { useDashboardAppAndGlobalState } from '../utils/use/use_dashboard_app_state';
import { useEditorUpdates } from '../utils/use/use_editor_updates';
import { HeaderVariant } from '../../../../../core/public';

export const DashboardEditor = () => {
  const { id: dashboardIdFromUrl } = useParams<{ id: string }>();
  const { services } = useOpenSearchDashboards<DashboardServices>();
  const { chrome, uiSettings, keyboardShortcut } = services;
  const { setHeaderVariant } = chrome;
  const isChromeVisible = useChromeVisibility({ chrome });
  const [eventEmitter] = useState(new EventEmitter());
  const showActionsInGroup = uiSettings.get('home:useNewHomePage');

  const { savedDashboard: savedDashboardInstance, dashboard } = useSavedDashboardInstance({
    services,
    eventEmitter,
    isChromeVisible,
    dashboardIdFromUrl,
  });

  const { appState, currentContainer, indexPatterns } = useDashboardAppAndGlobalState({
    services,
    eventEmitter,
    savedDashboardInstance,
    dashboard,
  });

  // Notify the plugin when dashboard container is available
  useEffect(() => {
    if (currentContainer && (window as any).dashboardPlugin) {
      console.log('🔗 Dashboard: Setting current container in plugin');
      (window as any).dashboardPlugin.setCurrentDashboardContainer(currentContainer);

      // Wait for embeddables to load before triggering context refresh
      const checkEmbeddables = () => {
        const childCount = currentContainer.getChildIds().length;
        console.log(`🔍 Dashboard: Checking embeddables, current count: ${childCount}`);

        if (childCount > 0) {
          console.log('✅ Dashboard: Embeddables loaded, triggering context refresh');
          if ((window as any).contextProvider) {
            // Force a fresh context capture instead of returning cached context
            console.log('🔄 Dashboard: Forcing fresh context capture...');
            (window as any).contextProvider.refreshCurrentContext();
          }
        } else {
          // Check again in 500ms
          setTimeout(checkEmbeddables, 500);
        }
      };

      // Start checking after a short delay
      setTimeout(checkEmbeddables, 100);
    }
  }, [currentContainer]);

  const { isEmbeddableRendered, currentAppState } = useEditorUpdates({
    services,
    eventEmitter,
    savedDashboardInstance,
    dashboard,
    dashboardContainer: currentContainer,
    appState,
  });

  useEffect(() => {
    if (showActionsInGroup) setHeaderVariant?.(HeaderVariant.APPLICATION);

    return () => {
      setHeaderVariant?.();
    };
  }, [setHeaderVariant, showActionsInGroup]);

  const handleFullScreen = useCallback(() => {
    if (appState) {
      appState.transitions.set('fullScreenMode', true);
    }
  }, [appState]);

  keyboardShortcut?.useKeyboardShortcut({
    id: 'dashboard_fullscreen',
    pluginId: 'dashboard',
    name: i18n.translate('dashboard.editor.toggleFullScreenShortcut', {
      defaultMessage: 'Toggle full-screen',
    }),
    category: i18n.translate('dashboard.editor.panelLayoutCategory', {
      defaultMessage: 'Panel / layout',
    }),
    keys: 'shift+f',
    execute: handleFullScreen,
  });

  return (
    <div>
      <div>
        {savedDashboardInstance && appState && currentAppState && currentContainer && dashboard && (
          <DashboardTopNav
            isChromeVisible={isChromeVisible}
            savedDashboardInstance={savedDashboardInstance}
            appState={appState!}
            dashboard={dashboard}
            currentAppState={currentAppState}
            isEmbeddableRendered={isEmbeddableRendered}
            indexPatterns={indexPatterns}
            currentContainer={currentContainer}
            dashboardIdFromUrl={dashboardIdFromUrl}
          />
        )}
      </div>
    </div>
  );
};
