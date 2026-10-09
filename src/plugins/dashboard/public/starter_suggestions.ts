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
const AUTO_VISUALIZATION_TOOL = 'auto_create_visualization';

const MAX_SUGGESTIONS = 3;

const SUMMARIZE_DASHBOARD_CARD: StarterSuggestionItem = {
  id: 'summarizeDashboard',
  icon: 'visBarVertical',
  text: 'Summarize this dashboard',
  prompt: 'Summarize this dashboard, using the attached screenshot.',
  attach: { captureScreenshot: true },
};

const SUMMARIZE_DRAFT_DASHBOARD_CARD: StarterSuggestionItem = {
  ...SUMMARIZE_DASHBOARD_CARD,
  prompt: 'Summarize this draft dashboard, using the attached screenshot.',
};

const SUGGEST_PANELS_CARD: StarterSuggestionItem = {
  id: 'suggestPanels',
  icon: 'notebookApp',
  text: 'What panels could I add?',
  prompt: `Using the attached screenshot, work out what this dashboard already covers, then suggest a few panels it is missing. For each one, say what it would show and what it adds that the existing panels do not.`,
  attach: { captureScreenshot: true },
};

const ADD_PANEL_CARD: StarterSuggestionItem = {
  id: 'addPanel',
  icon: 'plusInCircle',
  iconColor: 'primary',
  text: 'Add a panel to this dashboard',
  prompt:
    'Add a panel to this dashboard showing [metric or topic]. First check which indices I have, then tell me which one you plan to use and wait for me to confirm before building the panel.',
};

const BUILD_DASHBOARD_CARD: StarterSuggestionItem = {
  id: 'buildDashboard',
  icon: 'dashboardApp',
  iconColor: 'primary',
  text: 'Build a dashboard from my data',
  prompt:
    'Show me which indices I have, then build a dashboard with a few charts that summarize one of them.',
};

const INTRODUCE_DASHBOARDS_CARD: StarterSuggestionItem = {
  id: 'introduceDashboards',
  icon: 'dashboardApp',
  iconColor: 'primary',
  text: 'Introduce my dashboards',
  prompt: `Give me an overview of my dashboards: how many there are in total, what topics they group into, and their scale in panel counts.`,
};

const addPanelCards = (): StarterSuggestionItem[] =>
  AssistantActionService.getInstance().hasAction(AUTO_VISUALIZATION_TOOL) ? [ADD_PANEL_CARD] : [];

const buildDashboardCards = (): StarterSuggestionItem[] =>
  AssistantActionService.getInstance().hasAction(TEXT_TO_DASHBOARD_TOOL)
    ? [BUILD_DASHBOARD_CARD]
    : [];

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

const cardsForScreen = (screen: DashboardScreen): StarterSuggestionItem[] => {
  switch (screen) {
    case DashboardScreen.VIEW:
      return [SUMMARIZE_DASHBOARD_CARD, SUGGEST_PANELS_CARD, ...addPanelCards()];

    case DashboardScreen.CREATING_WITH_DRAFT:
      return [SUMMARIZE_DRAFT_DASHBOARD_CARD, SUGGEST_PANELS_CARD, ...addPanelCards()];

    case DashboardScreen.CREATING_BLANK:
      return buildDashboardCards();

    case DashboardScreen.LIST:
      return [INTRODUCE_DASHBOARDS_CARD];

    default:
      return [];
  }
};

export function registerDashboardStarterSuggestions(
  starterSuggestions: StarterSuggestionsPluginSetup
) {
  let screen = DashboardScreen.UNKNOWN;
  let cardIds = '';
  let stopWatching: Array<() => void> = [];

  const readCardIds = () =>
    cardsForScreen(screen)
      .map((card) => card.id)
      .join();

  const goToScreen = (next: DashboardScreen) => {
    screen = next;
    cardIds = readCardIds();
  };

  const registration = starterSuggestions.registerProvider({
    id: DashboardConstants.DASHBOARDS_ID,
    appId: DashboardConstants.DASHBOARDS_ID,
    getSuggestions: ({ defaults }: StarterSuggestionsContext): StarterSuggestionItem[] =>
      [...cardsForScreen(screen), ...defaults].slice(0, MAX_SUGGESTIONS),
  });

  // Some cards are gated. Comparing the card ids keeps
  // this to the tools the current screen actually gates on.
  const watchGatingTools = () => {
    const subscription = AssistantActionService.getInstance()
      .getState$()
      .subscribe(() => {
        const ids = readCardIds();
        if (ids === cardIds) {
          return;
        }
        cardIds = ids;
        registration.invalidate();
      });
    return () => subscription.unsubscribe();
  };

  const watchRoute = (history: History) => {
    const unlisten = history.listen((location: Pick<Location, 'pathname' | 'search'>) => {
      const newScreen = readDashboardScreen(location);
      if (newScreen !== screen) {
        goToScreen(newScreen);
        registration.invalidate();
      }
    });
    return unlisten;
  };

  return {
    registration,
    setHistory: (history: History) => {
      stopWatching.forEach((stop) => stop());

      // Adopt the current route silently: chat asks for cards on mount anyway.
      goToScreen(readDashboardScreen(history.location));

      stopWatching = [watchRoute(history), watchGatingTools()];
    },
    clearHistory: () => {
      stopWatching.forEach((stop) => stop());
      stopWatching = [];
      goToScreen(DashboardScreen.UNKNOWN);
    },
  };
}
