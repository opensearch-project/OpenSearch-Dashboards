/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerDiscoverStarterSuggestions } from './starter_suggestions';
import type {
  StarterSuggestionItem,
  StarterSuggestionsContext,
  StarterSuggestionsPluginSetup,
  StarterSuggestionsProvider,
} from '../../starter_suggestions/public';
import { ResultStatus } from './application/view_components/utils';
import { DISCOVER_PAGE_CONTEXT_ID } from '../common';

const DEFAULTS: StarterSuggestionItem[] = [
  { id: 'askData', icon: 'search', text: 'Ask questions about your data' },
  { id: 'investigate', icon: 'notebookApp', text: '/investigate an issue' },
  { id: 'explain', icon: 'help', text: 'Explain a concept' },
];

const RETAINED_DEFAULTS = [DEFAULTS[0], DEFAULTS[1]];

/** Pass null for "no page context published at all". */
const makeContext = (pageValue: Record<string, unknown> | null): StarterSuggestionsContext => ({
  appId: 'discover',
  pathname: '/app/discover',
  defaults: DEFAULTS,
  contexts:
    pageValue === null
      ? []
      : [
          {
            id: DISCOVER_PAGE_CONTEXT_ID,
            description: 'Discover application page context',
            value: pageValue,
            label: 'Page',
          },
        ],
});

/** Page context carrying a query and the outcome it produced. */
const withQuery = (query: Record<string, unknown>) =>
  makeContext({ appId: 'discover', dataset: { title: 'logs' }, query });

describe('registerDiscoverStarterSuggestions', () => {
  let registerProvider: jest.Mock;
  let starterSuggestions: StarterSuggestionsPluginSetup;
  let handle: ReturnType<typeof registerDiscoverStarterSuggestions>;

  const provider = () => registerProvider.mock.calls[0][0] as StarterSuggestionsProvider;
  const cardsFor = (context: StarterSuggestionsContext) =>
    provider().getSuggestions(context) as StarterSuggestionItem[];

  beforeEach(() => {
    registerProvider = jest.fn().mockReturnValue({ invalidate: jest.fn(), unregister: jest.fn() });
    starterSuggestions = { registerProvider } as unknown as StarterSuggestionsPluginSetup;
    handle = registerDiscoverStarterSuggestions(starterSuggestions);
  });

  it('registers for data-explorer, the app that actually renders Discover', () => {
    expect(registerProvider).toHaveBeenCalledTimes(1);
    expect(provider().id).toBe('discover');
    // The 'discover' app immediately redirects to data-explorer, so that is
    // what currentAppId$ reports while the Discover UI is on screen.
    expect(provider().appId).toBe('data-explorer');
  });

  it("passes chat's registration straight back so stop() can unregister", () => {
    expect(handle).toBe(registerProvider.mock.results[0].value);
  });

  describe('cards per query outcome', () => {
    it('offers a fix card on error, with the reason in the prompt', () => {
      const cards = cardsFor(
        withQuery({ query: 'status:200', status: ResultStatus.ERROR, error: 'bad field' })
      );

      expect(cards[0].id).toBe('fixQueryError');
      expect(cards[0].prompt).toContain('status:200');
      expect(cards[0].prompt).toContain('bad field');
    });

    it('leaves the reason out when the error text is missing', () => {
      const cards = cardsFor(withQuery({ query: 'status:200', status: ResultStatus.ERROR }));

      expect(cards[0].prompt).toBe(
        'My query "status:200" failed. Help me fix it and run the corrected query on the page.'
      );
    });

    it('offers a no-results card', () => {
      const cards = cardsFor(withQuery({ query: 'status:999', status: ResultStatus.NO_RESULTS }));

      expect(cards[0].id).toBe('explainNoResults');
      expect(cards[0].text).toBe('Why did my query return no results?');
      expect(cards[0].prompt).toContain('status:999');
    });

    it('offers a card that describes the search, without asking for a data pull', () => {
      const cards = cardsFor(
        withQuery({ query: 'status:200', status: ResultStatus.READY, resultsCount: 1204 })
      );

      expect(cards[0].id).toBe('describeSearch');
      expect(cards[0].text).toBe('Explain the current search');
      expect(cards[0].prompt).toBe('Describe the current search on the page.');
    });

    it.each([
      [ResultStatus.ERROR, 'fixQueryError'],
      [ResultStatus.NO_RESULTS, 'explainNoResults'],
      [ResultStatus.READY, 'describeSearch'],
    ])('leads with its own card on %s and keeps the remaining defaults', (status, id) => {
      expect(cardsFor(withQuery({ query: 'status:200', status }))).toEqual([
        expect.objectContaining({ id }),
        ...RETAINED_DEFAULTS,
      ]);
    });

    it.each([[ResultStatus.UNINITIALIZED], [ResultStatus.LOADING]])(
      'keeps the defaults while %s',
      (status) => {
        expect(cardsFor(withQuery({ query: '', status }))).toEqual(DEFAULTS);
      }
    );

    it('falls back to a generic prompt when the query text is empty', () => {
      const cards = cardsFor(withQuery({ query: '', status: ResultStatus.ERROR, error: 'boom' }));

      expect(cards[0].prompt).toBe(
        'My query failed with error: "boom". Help me fix it and run the corrected query on the page.'
      );
    });
  });

  describe('page context lookup', () => {
    it('keeps the defaults when discover has published nothing yet', () => {
      expect(cardsFor(makeContext(null))).toEqual(DEFAULTS);
    });

    it('keeps the defaults when the context carries no query outcome', () => {
      expect(cardsFor(makeContext({ appId: 'discover' }))).toEqual(DEFAULTS);
    });

    it("picks Discover's entry out of a crowded context list", () => {
      const context: StarterSuggestionsContext = {
        ...makeContext(null),
        contexts: [
          { id: 'ppl-lint-fix', description: 'lint', value: { foo: 1 }, label: 'a' },
          {
            id: DISCOVER_PAGE_CONTEXT_ID,
            description: 'Discover application page context',
            value: { query: { query: 'x', status: ResultStatus.READY, resultsCount: 2 } },
            label: 'b',
          },
          { id: 'selection-capture', description: 'selection', value: { bar: 2 }, label: 'c' },
        ],
      };

      expect(cardsFor(context)[0].id).toBe('describeSearch');
    });

    it('ignores entries published by other apps', () => {
      const context: StarterSuggestionsContext = {
        ...makeContext(null),
        contexts: [
          {
            id: 'explore-page-context',
            description: 'other app',
            value: { query: { query: 'x', status: ResultStatus.READY } },
            label: 'b',
          },
        ],
      };

      expect(cardsFor(context)).toEqual(DEFAULTS);
    });
  });
});
