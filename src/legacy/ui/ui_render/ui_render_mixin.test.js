/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { uiRenderMixin } from './ui_render_mixin';

// Mock dependencies
jest.mock('@osd/i18n', () => {
  const getRegisteredLocales = jest.fn();
  return {
    i18n: {
      getLocale: jest.fn(),
      getTranslation: jest.fn(),
      normalizeLocale: jest.fn((locale) => locale),
      translate: jest.fn((key, { defaultMessage }) => defaultMessage),
    },
    i18nLoader: {
      getRegisteredLocales: getRegisteredLocales,
      getTranslationsByLocale: jest.fn(),
      isRegisteredLocale: jest.fn((locale) => getRegisteredLocales()?.includes?.(locale)),
    },
  };
});

// Import mocked modules
const { i18n, i18nLoader } = require('@osd/i18n');

describe('uiRenderMixin', () => {
  let server;
  let osdServer;
  let config;
  let routes;
  let decorations;

  beforeEach(() => {
    routes = [];
    decorations = {};
    server = {
      route: jest.fn((route) => routes.push(route)),
      decorate: jest.fn((type, name, value) => {
        decorations[`${type}.${name}`] = value;
      }),
      auth: { settings: { default: false } },
    };
    osdServer = {
      newPlatform: {
        setup: {
          core: {
            http: { csp: { header: 'test-csp-header' } },
          },
        },
        start: {
          core: {
            savedObjects: {
              getScopedClient: jest.fn(),
            },
            uiSettings: {
              asScopedToClient: jest.fn(),
            },
          },
        },
        __internals: {
          rendering: {
            render: jest.fn(),
          },
        },
      },
    };
    config = {
      get: jest.fn(),
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('translations route', () => {
    let handler;
    let h;

    beforeEach(() => {
      uiRenderMixin(osdServer, server, config);
      handler = routes.find((route) => route.path === '/translations/{locale}.json').handler;
      h = {
        response: jest.fn().mockReturnThis(),
        header: jest.fn().mockReturnThis(),
        etag: jest.fn().mockReturnThis(),
      };
    });

    it('should handle default locale', async () => {
      const defaultLocale = 'en';
      const defaultTranslations = { hello: 'Hello' };
      i18n.getLocale.mockReturnValue(defaultLocale);
      i18n.getTranslation.mockReturnValue(defaultTranslations);
      i18nLoader.getRegisteredLocales.mockReturnValue([defaultLocale]);

      const request = { params: { locale: defaultLocale } };
      await handler(request, h);

      expect(i18n.getTranslation).toHaveBeenCalled();
      expect(h.response).toHaveBeenCalledWith({
        translations: defaultTranslations,
        warning: null,
      });
      expect(h.header).toHaveBeenCalledWith('cache-control', 'must-revalidate');
      expect(h.header).toHaveBeenCalledWith('content-type', 'application/json');
      expect(h.etag).toHaveBeenCalled();
    });

    it('should handle non-default registered locale', async () => {
      const defaultLocale = 'en';
      const requestedLocale = 'fr';
      const frTranslations = { hello: 'Bonjour' };
      i18n.getLocale.mockReturnValue(defaultLocale);
      i18nLoader.getRegisteredLocales.mockReturnValue([defaultLocale, requestedLocale]);
      i18nLoader.getTranslationsByLocale.mockResolvedValue(frTranslations);

      const request = { params: { locale: requestedLocale } };
      await handler(request, h);

      expect(i18nLoader.getTranslationsByLocale).toHaveBeenCalledWith(requestedLocale);
      expect(h.response).toHaveBeenCalledWith({
        translations: frTranslations,
        warning: null,
      });
    });

    it('should fallback to English translations for unknown locale', async () => {
      const defaultLocale = 'en';
      const unknownLocale = 'xx';
      const englishTranslations = { hello: 'Hello' };
      i18n.getLocale.mockReturnValue(defaultLocale);
      i18nLoader.getRegisteredLocales.mockReturnValue([defaultLocale]);
      i18nLoader.getTranslationsByLocale.mockResolvedValue(englishTranslations);

      const request = { params: { locale: unknownLocale } };
      await handler(request, h);

      expect(i18nLoader.getTranslationsByLocale).toHaveBeenCalledWith('en');
      expect(h.response).toHaveBeenCalledWith({
        translations: englishTranslations,
        warning: {
          title: 'Unsupported Locale',
          text: `The requested locale "${unknownLocale}" is not supported. Falling back to English.`,
        },
      });
      expect(h.header).toHaveBeenCalledWith('cache-control', 'must-revalidate');
      expect(h.header).toHaveBeenCalledWith('content-type', 'application/json');
      expect(h.etag).toHaveBeenCalled();
    });

    it('should cache translations', async () => {
      const defaultLocale = 'en';
      const defaultTranslations = { hello: 'Hello' };
      i18n.getLocale.mockReturnValue(defaultLocale);
      i18n.getTranslation.mockReturnValue(defaultTranslations);
      i18nLoader.getRegisteredLocales.mockReturnValue([defaultLocale]);

      const request = { params: { locale: defaultLocale } };
      await handler(request, h);
      await handler(request, h);

      expect(i18n.getTranslation).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      const defaultLocale = 'en';
      i18n.getLocale.mockReturnValue(defaultLocale);
      i18n.getTranslation.mockImplementation(() => {
        throw new Error('Translation error');
      });
      i18nLoader.getRegisteredLocales.mockReturnValue([defaultLocale]);

      const request = { params: { locale: defaultLocale } };
      await expect(handler(request, h)).rejects.toThrow('Translation error');
    });
  });
});
