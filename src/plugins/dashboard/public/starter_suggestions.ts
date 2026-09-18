/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { History, Location } from 'history';
import rison from 'rison-node';
import {
  StarterSuggestionItem,
  StarterSuggestionsContext,
  StarterSuggestionsPluginSetup,
} from '../../starter_suggestions/public';
import { AssistantActionService } from '../../context_provider/public';
import { DashboardConstants } from './dashboard_constants';

const TEXT_TO_DASHBOARD_TOOL = 'text_to_dashboard';

enum DashboardScreen {
  VIEW = 'view',
  CREATING_WITH_DRAFT = 'creating_with_draft',
  CREATING_BLANK = 'creating_blank',
  LIST = 'list',
  UNKNOWN = 'unknown',
}

const readDraftPanelCount = (search: string): number => {
  const appStateParam = new URLSearchParams(search).get('_a');
  if (!appStateParam) {
    return 0;
  }
  try {
    const appState = rison.decode(appStateParam) as { panels?: unknown[] };
    return Array.isArray(appState.panels) ? appState.panels.length : 0;
  } catch {
    return 0;
  }
};

const readDashboardScreen = ({
  pathname,
  search,
}: Pick<Location, 'pathname' | 'search'>): DashboardScreen => {
  if (pathname.startsWith(`${DashboardConstants.VIEW_DASHBOARD_PATH}/`)) {
    return DashboardScreen.VIEW;
  }
  if (pathname === DashboardConstants.CREATE_NEW_DASHBOARD_URL) {
    return readDraftPanelCount(search) > 0
      ? DashboardScreen.CREATING_WITH_DRAFT
      : DashboardScreen.CREATING_BLANK;
  }
  if (
    pathname === DashboardConstants.LANDING_PAGE_PATH ||
    pathname === DashboardConstants.ROOT_PATH ||
    pathname === ''
  ) {
    return DashboardScreen.LIST;
  }
  return DashboardScreen.UNKNOWN;
};

export function registerDashboardStarterSuggestions(
  starterSuggestions: StarterSuggestionsPluginSetup
) {
  let screen = DashboardScreen.UNKNOWN;
  let historyUnlisten: (() => void) | undefined;

  const registration = starterSuggestions.registerProvider({
    id: DashboardConstants.DASHBOARDS_ID,
    appId: DashboardConstants.DASHBOARDS_ID,
    getSuggestions: (context: StarterSuggestionsContext): StarterSuggestionItem[] => {
      switch (screen) {
        case DashboardScreen.VIEW:
          return [
            {
              id: 'summarizeDashboard',
              icon: 'visBarVertical',
              text: 'Summarize this dashboard',
              prompt: 'Summarize this dashboard, using the attached screenshot.',
              attach: { captureScreenshot: true },
            },
          ];

        case DashboardScreen.CREATING_WITH_DRAFT:
          return [
            {
              id: 'summarizeDraftDashboard',
              icon: 'visBarVertical',
              text: 'Summarize this dashboard',
              prompt:
                'Summarize the panels in this draft dashboard, using the attached screenshot.',
              attach: { captureScreenshot: true },
            },
          ];

        case DashboardScreen.CREATING_BLANK:
          return AssistantActionService.getInstance().hasAction(TEXT_TO_DASHBOARD_TOOL)
            ? [
                {
                  id: 'buildDashboard',
                  icon: 'dashboardApp',
                  iconColor: 'primary',
                  text: 'Build a dashboard from my data',
                  prompt:
                    'Show me which indices I have, then build a dashboard with a few charts that summarize one of them.',
                },
              ]
            : context.defaults;

        case DashboardScreen.LIST:
          return [
            {
              id: 'introduceDashboards',
              icon: 'dashboardApp',
              iconColor: 'primary',
              text: 'Introduce my dashboards',
              prompt: 'What dashboards do I have, and what does each one cover?',
            },
            ...context.defaults,
          ];

        default:
          return context.defaults;
      }
    },
  });

  return {
    registration,
    setHistory: (history: History) => {
      historyUnlisten?.();

      // Adopt the current route silently: chat asks for cards on mount anyway.
      screen = readDashboardScreen(history.location);

      historyUnlisten = history.listen((location: Pick<Location, 'pathname' | 'search'>) => {
        const newScreen = readDashboardScreen(location);
        if (newScreen !== screen) {
          screen = newScreen;
          registration?.invalidate();
        }
      });
    },
    clearHistory: () => {
      historyUnlisten?.();
      historyUnlisten = undefined;
      screen = DashboardScreen.UNKNOWN;
    },
  };
}
