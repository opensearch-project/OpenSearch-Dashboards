/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EventEmitter } from 'events';
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

  // Memoized callback for full-screen action
  const handleFullScreen = useCallback(() => {
    // Find and click the full-screen button
    const fullScreenButton = document.querySelector('[data-test-subj="dashboardFullScreenMode"]');
    if (fullScreenButton) {
      (fullScreenButton as HTMLElement).click();
    }
  }, []);

  // Register full-screen keyboard shortcut using the hook
  keyboardShortcut?.useKeyboardShortcut({
    id: 'dashboard_fullscreen',
    pluginId: 'dashboard',
    name: 'Toggle Full-Screen Results Table',
    category: 'Panel / Layout',
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
