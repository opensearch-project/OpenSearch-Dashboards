/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createMemoryHistory, History } from 'history';
import rison from 'rison-node';
import { registerDashboardStarterSuggestions } from './starter_suggestions';
import type {
  StarterSuggestionItem,
  StarterSuggestionsContext,
  StarterSuggestionsPluginSetup,
  StarterSuggestionsProvider,
} from '../../starter_suggestions/public';
import { AssistantActionService } from '../../context_provider/public';
import { T2_DASHBOARD_TOOL_NAME } from '../../explore/public/components/visualizations/actions/utils';

const TEXT_TO_DASHBOARD_TOOL = 'text_to_dashboard';

const registerTextToDashboardTool = () =>
  AssistantActionService.getInstance().registerAction({
    name: TEXT_TO_DASHBOARD_TOOL,
    description: 'Creates multiple visualizations and builds an ad-hoc dashboard.',
    parameters: { type: 'object', properties: {}, required: [] },
    handler: async () => ({}),
  });

const ASK_DATA: StarterSuggestionItem = { id: 'askData', icon: 'search', text: 'Ask your data' };
const EXPLAIN: StarterSuggestionItem = { id: 'explain', icon: 'help', text: 'Explain a concept' };

const context: StarterSuggestionsContext = {
  appId: 'dashboards',
  pathname: '/app/dashboards',
  defaults: [ASK_DATA, EXPLAIN],
};

const draftRoute = (panelCount: number) =>
  `/create?_a=${encodeURIComponent(
    rison.encode({ panels: new Array(panelCount).fill({ panelIndex: '1' }), viewMode: 'edit' })
  )}`;

describe('registerDashboardStarterSuggestions', () => {
  let registerProvider: jest.Mock;
  let invalidate: jest.Mock;
  let history: History;
  let suggestions: ReturnType<typeof registerDashboardStarterSuggestions>;

  const provider = () => registerProvider.mock.calls[0][0] as StarterSuggestionsProvider;
  const cards = () => provider().getSuggestions(context) as StarterSuggestionItem[];

  const at = (route: string) => {
    history = createMemoryHistory({ initialEntries: [route] });
    suggestions.setHistory(history);
  };

  beforeEach(() => {
    invalidate = jest.fn();
    registerProvider = jest.fn().mockReturnValue({ invalidate, unregister: jest.fn() });
    suggestions = registerDashboardStarterSuggestions({
      registerProvider,
    } as unknown as StarterSuggestionsPluginSetup);
    at('/list');
  });

  afterEach(() => {
    suggestions.clearHistory();
    // The action registry is a process-wide singleton shared with every other suite.
    AssistantActionService.getInstance().unregisterAction(TEXT_TO_DASHBOARD_TOOL);
  });

  it('registers for the dashboards app', () => {
    expect(provider().id).toBe('dashboards');
    expect(provider().appId).toBe('dashboards');
  });

  it('gates the build card on the name Explore actually registers the tool under', () => {
    expect(TEXT_TO_DASHBOARD_TOOL).toBe(T2_DASHBOARD_TOOL_NAME);
  });

  it('keeps the defaults on a route it knows nothing about', () => {
    at('/some-future-route');

    expect(cards()).toEqual([ASK_DATA, EXPLAIN]);
  });

  describe('a saved dashboard', () => {
    beforeEach(() => at('/view/abc-123'));

    it('offers a summarize card that brings a screenshot along', () => {
      expect(cards()).toEqual([
        expect.objectContaining({
          id: 'summarizeDashboard',
          attach: { captureScreenshot: true },
        }),
      ]);
    });

    it('replaces the defaults, since the dashboard on screen is what to ask about', () => {
      expect(cards()).toHaveLength(1);
    });
  });

  describe('an unsaved draft', () => {
    it('summarizes a draft that already holds panels', () => {
      at(draftRoute(3));

      const [card] = cards();
      expect(card.id).toBe('summarizeDraftDashboard');
      expect(card.attach).toEqual({ captureScreenshot: true });
      expect(card.prompt).toContain('draft');
    });

    it('finds the panels behind a _g that carries its own question mark', () => {
      const globalState = rison.encode({ query: 'status:200?' });
      const appState = rison.encode({ panels: [{ panelIndex: '1' }], viewMode: 'edit' });
      at(`/create?_g=${globalState}&_a=${encodeURIComponent(appState)}`);

      expect(cards()).toEqual([expect.objectContaining({ id: 'summarizeDraftDashboard' })]);
    });

    it.each([
      ['no panels yet', '/create?_a=' + encodeURIComponent(rison.encode({ panels: [] }))],
      ['no app state at all', '/create'],
      ['unparsable app state', '/create?_a=!!!not-rison'],
    ])('treats a draft with %s as blank', (_label, route) => {
      registerTextToDashboardTool();
      at(route);

      expect(cards()).toEqual([expect.objectContaining({ id: 'buildDashboard' })]);
    });
  });

  describe('a blank dashboard', () => {
    beforeEach(() => at('/create'));

    it('offers to build one when the tool is registered', () => {
      registerTextToDashboardTool();

      const [card] = cards();
      expect(card.id).toBe('buildDashboard');
      expect(card.attach).toBeUndefined();
    });

    it('keeps the defaults when the tool is missing', () => {
      expect(cards()).toEqual([ASK_DATA, EXPLAIN]);
    });
  });

  describe('the listing page', () => {
    it.each([['/list'], ['/']])(
      'adds to the defaults at %p rather than replacing them',
      (route) => {
        at(route);

        expect(cards()).toEqual([
          expect.objectContaining({ id: 'introduceDashboards' }),
          ASK_DATA,
          EXPLAIN,
        ]);
      }
    );

    it('never asks for a screenshot, since the listing page has none enabled', () => {
      at('/list');

      expect(cards().some((card) => card.attach)).toBe(false);
    });
  });

  describe('watching the route', () => {
    it('invalidates when the screen changes', () => {
      history.push('/create');

      expect(invalidate).toHaveBeenCalledTimes(1);
      expect(cards()).toEqual([ASK_DATA, EXPLAIN]);
    });

    it('invalidates when the first panel lands in a blank draft', () => {
      history.push('/create');
      invalidate.mockClear();

      history.replace(draftRoute(1));

      expect(invalidate).toHaveBeenCalledTimes(1);
      expect(cards()[0].id).toBe('summarizeDraftDashboard');
    });

    it('stays quiet while the screen is unchanged', () => {
      history.push(draftRoute(1));
      invalidate.mockClear();

      history.replace(draftRoute(2));
      history.replace(draftRoute(3));

      expect(invalidate).not.toHaveBeenCalled();
    });

    it('stops listening once the app unmounts', () => {
      suggestions.clearHistory();
      invalidate.mockClear();

      history.push('/create');

      expect(invalidate).not.toHaveBeenCalled();
    });

    it('drops the previous listener when a history is attached twice', () => {
      const stale = history;
      at('/list');
      invalidate.mockClear();

      stale.push('/create');

      expect(invalidate).not.toHaveBeenCalled();
    });
  });
});
