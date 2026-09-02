/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StarterSuggestionsService } from './starter_suggestions_service';
import {
  StarterSuggestionItem,
  StarterSuggestionsContext,
  StarterSuggestionsProvider,
} from './types';

const CARD_A: StarterSuggestionItem = { id: 'a', icon: 'search', text: 'From provider A' };
const CARD_B: StarterSuggestionItem = { id: 'b', icon: 'bolt', text: 'From provider B' };
const DEFAULT_CARD: StarterSuggestionItem = { id: 'default', icon: 'help', text: 'A default' };

const makeProvider = (
  overrides: Partial<StarterSuggestionsProvider> = {}
): StarterSuggestionsProvider => ({
  id: 'provider',
  appId: 'explore',
  getSuggestions: () => [CARD_A],
  ...overrides,
});

const makeContext = (
  overrides: Partial<StarterSuggestionsContext> = {}
): StarterSuggestionsContext => ({
  appId: 'explore',
  pathname: '/app/explore',
  defaults: [DEFAULT_CARD],
  ...overrides,
});

const from = (providerId: string, items: StarterSuggestionItem[], appId: string = 'explore') => ({
  appId,
  providerId,
  items,
});

describe('StarterSuggestionsService', () => {
  let service: StarterSuggestionsService;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new StarterSuggestionsService();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('registerProvider validation', () => {
    it.each([[undefined], [null], ['a string']])('rejects %p as a provider', (provider) => {
      expect(() => service.registerProvider(provider as never)).toThrow(
        'Provider must be an object'
      );
    });

    it.each([
      ['a missing id', { id: '', appId: 'explore' }, 'Provider must have a valid id'],
      ['a blank id', { id: '   ', appId: 'explore' }, 'Provider must have a valid id'],
      [
        'a missing getSuggestions',
        { id: 'p', appId: 'explore', getSuggestions: undefined },
        'Provider must have a getSuggestions method',
      ],
      [
        'an empty appId array',
        { id: 'p', appId: [] },
        'Provider must have a valid appId or non-empty appId array',
      ],
      [
        'a blank entry in the appId array',
        { id: 'p', appId: ['explore', ''] },
        'Provider must have a valid appId or non-empty appId array',
      ],
    ])('rejects %s', (_label, provider, message) => {
      expect(() =>
        service.registerProvider({
          getSuggestions: () => [],
          ...(provider as object),
        } as StarterSuggestionsProvider)
      ).toThrow(message);
    });
  });

  describe('appId matching', () => {
    it('serves the provider registered for a single appId', async () => {
      service.registerProvider(makeProvider());

      await expect(service.getSuggestions(makeContext())).resolves.toEqual(
        from('provider', [CARD_A])
      );
    });

    it('serves every appId in an array registration', async () => {
      service.registerProvider(
        makeProvider({ appId: ['explore', 'explore/logs', 'explore/traces'] })
      );

      expect(service.getRegisteredAppIds()).toEqual(['explore', 'explore/logs', 'explore/traces']);
      await expect(
        service.getSuggestions(makeContext({ appId: 'explore/traces' }))
      ).resolves.toEqual(from('provider', [CARD_A], 'explore/traces'));
    });

    it('returns null for an appId nobody registered', async () => {
      service.registerProvider(makeProvider({ appId: 'explore' }));

      await expect(
        service.getSuggestions(makeContext({ appId: 'dashboards' }))
      ).resolves.toBeNull();
    });

    it('lets a provider resolve the data source id from the context', async () => {
      const getDataSourceId = jest.fn().mockResolvedValue('ds-1');
      service.registerProvider(
        makeProvider({
          getSuggestions: async (context) => [
            { icon: 'search', text: `on ${await context.getDataSourceId?.()}` },
          ],
        })
      );

      await expect(service.getSuggestions(makeContext({ getDataSourceId }))).resolves.toEqual(
        from('provider', [{ icon: 'search', text: 'on ds-1' }])
      );
    });

    it('does not resolve the data source id for a provider that ignores it', async () => {
      const getDataSourceId = jest.fn().mockResolvedValue('ds-1');
      service.registerProvider(makeProvider());

      await service.getSuggestions(makeContext({ getDataSourceId }));

      expect(getDataSourceId).not.toHaveBeenCalled();
    });

    it('counts a slow data source lookup against the provider timeout', async () => {
      const impatient = new StarterSuggestionsService(5);
      impatient.registerProvider(
        makeProvider({
          getSuggestions: async (context) => {
            await context.getDataSourceId?.();
            return [CARD_A];
          },
        })
      );

      await expect(
        impatient.getSuggestions(makeContext({ getDataSourceId: () => new Promise(() => {}) }))
      ).resolves.toBeNull();
    });

    it('passes the caller context straight through to the provider', async () => {
      const getSuggestions = jest.fn().mockReturnValue([CARD_A]);
      service.registerProvider(makeProvider({ getSuggestions }));
      const context = makeContext({ contexts: [{ description: 'ctx', value: 1, label: 'Ctx' }] });

      await service.getSuggestions(context);

      expect(getSuggestions).toHaveBeenCalledWith(context);
    });
  });

  describe('overlapping registrations', () => {
    it('hands a contested appId to the later provider', async () => {
      service.registerProvider(makeProvider({ id: 'a', appId: 'explore' }));
      service.registerProvider(
        makeProvider({ id: 'b', appId: 'explore', getSuggestions: () => [CARD_B] })
      );

      await expect(service.getSuggestions(makeContext())).resolves.toEqual(from('b', [CARD_B]));
    });

    it('reports the provider that actually answered', async () => {
      service.registerProvider(makeProvider({ id: 'a', appId: 'explore' }));
      service.registerProvider(
        makeProvider({ id: 'b', appId: 'explore', getSuggestions: () => [CARD_B] })
      );

      await expect(service.getSuggestions(makeContext())).resolves.toHaveProperty(
        'providerId',
        'b'
      );
    });

    it('leaves the earlier provider serving the appIds it kept', async () => {
      service.registerProvider(makeProvider({ id: 'a', appId: ['explore', 'explore/logs'] }));
      service.registerProvider(
        makeProvider({ id: 'b', appId: 'explore', getSuggestions: () => [CARD_B] })
      );

      await expect(service.getSuggestions(makeContext({ appId: 'explore' }))).resolves.toEqual(
        from('b', [CARD_B])
      );
      await expect(service.getSuggestions(makeContext({ appId: 'explore/logs' }))).resolves.toEqual(
        from('a', [CARD_A], 'explore/logs')
      );
    });

    it('unregisters cleanly whichever order the two providers tear down in', () => {
      const first = service.registerProvider(
        makeProvider({ id: 'a', appId: ['explore', 'explore/logs'] })
      );
      const second = service.registerProvider(makeProvider({ id: 'b', appId: 'explore' }));

      second.unregister();
      expect(service.getRegisteredAppIds()).toEqual(['explore/logs']);

      first.unregister();
      expect(service.getRegisteredAppIds()).toEqual([]);
    });

    it('drops the whole previous registration when the same id registers again', () => {
      service.registerProvider(makeProvider({ id: 'same', appId: ['explore', 'explore/logs'] }));
      service.registerProvider(makeProvider({ id: 'same', appId: ['explore'] }));

      expect(service.getRegisteredAppIds()).toEqual(['explore']);
    });

    it('does not leak the replaced provider when the same id registers again', () => {
      const stale = service.registerProvider(makeProvider({ id: 'same', appId: 'explore' }));
      const live = service.registerProvider(makeProvider({ id: 'same', appId: 'explore/logs' }));

      stale.unregister();
      expect(service.getRegisteredAppIds()).toEqual(['explore/logs']);

      live.unregister();
      expect(service.getRegisteredAppIds()).toEqual([]);
    });

    it('names the appIds a re-registration under the same id drops', () => {
      service.registerProvider(makeProvider({ id: 'same', appId: ['explore', 'explore/logs'] }));
      service.registerProvider(makeProvider({ id: 'same', appId: ['explore'] }));

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("provider id 'same' is already registered")
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('leaves [explore/logs] without a provider')
      );
    });

    it('leaves the dropped-appId note out when a re-registration drops nothing', () => {
      service.registerProvider(makeProvider({ id: 'same', appId: ['explore'] }));
      service.registerProvider(makeProvider({ id: 'same', appId: ['explore', 'explore/logs'] }));

      expect(warnSpy).toHaveBeenCalledWith(expect.not.stringContaining('without a provider'));
      expect(service.getRegisteredAppIds()).toEqual(['explore', 'explore/logs']);
    });

    it('stays quiet when the very same provider object registers twice', () => {
      const provider = makeProvider({ id: 'same', appId: 'explore' });
      service.registerProvider(provider);
      service.registerProvider(provider);

      expect(warnSpy).not.toHaveBeenCalled();
      expect(service.getRegisteredAppIds()).toEqual(['explore']);
    });
  });

  describe('unregister', () => {
    it('stops serving the appIds it owned', async () => {
      const registration = service.registerProvider(makeProvider());

      registration.unregister();

      expect(service.getRegisteredAppIds()).toEqual([]);
      await expect(service.getSuggestions(makeContext())).resolves.toBeNull();
    });

    it('is safe to call twice', () => {
      const registration = service.registerProvider(makeProvider());

      registration.unregister();
      expect(() => registration.unregister()).not.toThrow();
      expect(service.getRegisteredAppIds()).toEqual([]);
    });
  });

  describe('invalidate', () => {
    it('notifies listeners once per appId the provider owns', () => {
      const listener = jest.fn();
      service.onInvalidate(listener);
      const registration = service.registerProvider(
        makeProvider({ appId: ['explore', 'explore/logs'] })
      );

      registration.invalidate();

      expect(listener.mock.calls).toEqual([['explore'], ['explore/logs']]);
    });

    it('stops notifying once the listener unsubscribes', () => {
      const listener = jest.fn();
      const unsubscribe = service.onInvalidate(listener);
      const registration = service.registerProvider(makeProvider());

      unsubscribe();
      registration.invalidate();

      expect(listener).not.toHaveBeenCalled();
    });

    it('keeps notifying the remaining listeners when one throws', () => {
      const failing = jest.fn(() => {
        throw new Error('listener blew up');
      });
      const healthy = jest.fn();
      service.onInvalidate(failing);
      service.onInvalidate(healthy);
      const registration = service.registerProvider(makeProvider());

      registration.invalidate();

      expect(healthy).toHaveBeenCalledWith('explore');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('getSuggestions failure handling', () => {
    it('returns an empty array as-is, distinct from null', async () => {
      service.registerProvider(makeProvider({ getSuggestions: () => [] }));

      await expect(service.getSuggestions(makeContext())).resolves.toEqual(from('provider', []));
    });

    it('returns null when the provider throws', async () => {
      service.registerProvider(
        makeProvider({
          getSuggestions: () => {
            throw new Error('provider blew up');
          },
        })
      );

      await expect(service.getSuggestions(makeContext())).resolves.toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });

    it('returns null when the provider rejects', async () => {
      service.registerProvider(
        makeProvider({ getSuggestions: () => Promise.reject(new Error('nope')) })
      );

      await expect(service.getSuggestions(makeContext())).resolves.toBeNull();
    });

    it('returns null when the provider resolves with a non-array', async () => {
      service.registerProvider(makeProvider({ getSuggestions: (() => 'not an array') as never }));

      await expect(service.getSuggestions(makeContext())).resolves.toBeNull();
    });

    it('resolves an async provider', async () => {
      service.registerProvider(makeProvider({ getSuggestions: async () => [CARD_B] }));

      await expect(service.getSuggestions(makeContext())).resolves.toEqual(
        from('provider', [CARD_B])
      );
    });
  });

  describe('timeout', () => {
    it('gives up on a provider that never settles', async () => {
      const impatient = new StarterSuggestionsService(5);
      impatient.registerProvider(makeProvider({ getSuggestions: () => new Promise(() => {}) }));

      await expect(impatient.getSuggestions(makeContext())).resolves.toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("error from provider 'provider'"),
        expect.objectContaining({ message: expect.stringContaining('timed out after 5ms') })
      );
    });

    it('leaves no pending timer behind once a provider settles', async () => {
      jest.useFakeTimers();
      try {
        service.registerProvider(makeProvider());

        await service.getSuggestions(makeContext());

        expect(jest.getTimerCount()).toBe(0);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('provider replaced mid-flight', () => {
    it('discards the in-flight result', async () => {
      let settleSlowProvider: (items: StarterSuggestionItem[]) => void = () => {};
      service.registerProvider(
        makeProvider({
          id: 'slow',
          getSuggestions: () =>
            new Promise<StarterSuggestionItem[]>((resolve) => {
              settleSlowProvider = resolve;
            }),
        })
      );

      const pending = service.getSuggestions(makeContext());
      service.registerProvider(makeProvider({ id: 'fast', getSuggestions: () => [CARD_B] }));
      settleSlowProvider([CARD_A]);

      await expect(pending).resolves.toBeNull();
    });

    it('discards the in-flight result after an unregister', async () => {
      let settleSlowProvider: (items: StarterSuggestionItem[]) => void = () => {};
      const registration = service.registerProvider(
        makeProvider({
          getSuggestions: () =>
            new Promise<StarterSuggestionItem[]>((resolve) => {
              settleSlowProvider = resolve;
            }),
        })
      );

      const pending = service.getSuggestions(makeContext());
      registration.unregister();
      settleSlowProvider([CARD_A]);

      await expect(pending).resolves.toBeNull();
    });
  });

  describe('hasProvider', () => {
    it('reports every appId a provider covers', () => {
      service.registerProvider(makeProvider({ appId: ['explore', 'explore/logs'] }));

      expect(service.hasProvider('explore')).toBe(true);
      expect(service.hasProvider('explore/logs')).toBe(true);
    });

    it('reports an app with no provider', () => {
      service.registerProvider(makeProvider({ appId: 'explore' }));

      expect(service.hasProvider('dashboards')).toBe(false);
    });

    it('stops reporting an appId once its provider is unregistered', () => {
      const registration = service.registerProvider(makeProvider({ appId: 'explore' }));

      registration.unregister();

      expect(service.hasProvider('explore')).toBe(false);
    });
  });

  describe('clear', () => {
    it('drops providers and listeners', async () => {
      const listener = jest.fn();
      service.onInvalidate(listener);
      const registration = service.registerProvider(makeProvider());

      service.clear();

      expect(service.getRegisteredAppIds()).toEqual([]);
      await expect(service.getSuggestions(makeContext())).resolves.toBeNull();
      registration.invalidate();
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
