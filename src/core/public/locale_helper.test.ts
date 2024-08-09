/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractLocaleInfo, getAndUpdateLocaleInUrl } from './locale_helper';

describe('extractLocaleInfo', () => {
  const testCases = [
    {
      description: 'After hash and slash',
      input: 'http://localhost:5603/app/home#/&i18n-locale=fr-FR',
      expected: {
        localeValue: 'fr-FR',
        localeParam: 'i18n-locale=fr-FR',
        updatedUrl: 'http://localhost:5603/app/home#/',
      },
    },
    {
      description: 'After path and slash',
      input: 'http://localhost:5603/app/home/&i18n-locale=de-DE',
      expected: {
        localeValue: 'de-DE',
        localeParam: 'i18n-locale=de-DE',
        updatedUrl: 'http://localhost:5603/app/home/',
      },
    },
    {
      description: 'No locale parameter',
      input: 'http://localhost:5603/app/home',
      expected: {
        localeValue: 'en',
        localeParam: null,
        updatedUrl: 'http://localhost:5603/app/home',
      },
    },
    {
      description: 'Complex URL with locale',
      input: 'http://localhost:5603/app/dashboards#/view/id?_g=(...)&_a=(...)&i18n-locale=es-ES',
      expected: {
        localeValue: 'es-ES',
        localeParam: 'i18n-locale=es-ES',
        updatedUrl: 'http://localhost:5603/app/dashboards#/view/id?_g=(...)&_a=(...)',
      },
    },
  ];

  testCases.forEach(({ description, input, expected }) => {
    it(description, () => {
      const result = extractLocaleInfo(input);
      expect(result).toEqual(expected);
    });
  });
});

describe('getAndUpdateLocaleInUrl', () => {
  let originalHistoryReplaceState: typeof window.history.replaceState;

  beforeEach(() => {
    // Mock window.history.replaceState
    originalHistoryReplaceState = window.history.replaceState;
    window.history.replaceState = jest.fn();
  });

  afterEach(() => {
    // Restore original window.history.replaceState
    window.history.replaceState = originalHistoryReplaceState;
  });

  const testCases = [
    {
      description: 'Category 1: basePath + #/',
      input: 'http://localhost:5603/app/home#/&i18n-locale=zh-CN',
      expected: 'http://localhost:5603/app/home#/?i18n-locale=zh-CN',
      locale: 'zh-CN',
    },
    {
      description: 'Category 1: basePath + # (empty hashPath)',
      input: 'http://localhost:5603/app/home#&i18n-locale=zh-CN',
      expected: 'http://localhost:5603/app/home#?i18n-locale=zh-CN',
      locale: 'zh-CN',
    },
    {
      description: 'Category 2: basePath + # + hashPath + ? + hashQuery',
      input: 'http://localhost:5603/app/dashboards#/view/id?_g=(...)&_a=(...)&i18n-locale=zh-CN',
      expected: 'http://localhost:5603/app/dashboards#/view/id?_g=(...)&_a=(...)&i18n-locale=zh-CN',
      locale: 'zh-CN',
    },
    {
      description: 'Category 3: basePath only',
      input: 'http://localhost:5603/app/management&i18n-locale=zh-CN',
      expected: 'http://localhost:5603/app/management?i18n-locale=zh-CN',
      locale: 'zh-CN',
    },
    {
      description: 'Category 1: basePath + # + hashPath',
      input: 'http://localhost:5603/app/dev_tools#/console&i18n-locale=zh-CN',
      expected: 'http://localhost:5603/app/dev_tools#/console?i18n-locale=zh-CN',
      locale: 'zh-CN',
    },
    {
      description: 'URL without locale parameter',
      input: 'http://localhost:5603/app/home#/',
      expected: 'http://localhost:5603/app/home#/',
      locale: 'en',
    },
    {
      description: 'Complex URL with multiple parameters',
      input:
        "http://localhost:5603/app/dashboards#/view/7adfa750-4c81-11e8-b3d7-01146121b73d?_g=(filters:!(),refreshInterval:(pause:!f,value:900000),time:(from:now-24h,to:now))&_a=(description:'Analyze%20mock%20flight%20data',filters:!())&i18n-locale=zh-CN",
      expected:
        "http://localhost:5603/app/dashboards#/view/7adfa750-4c81-11e8-b3d7-01146121b73d?_g=(filters:!(),refreshInterval:(pause:!f,value:900000),time:(from:now-24h,to:now))&_a=(description:'Analyze%20mock%20flight%20data',filters:!())&i18n-locale=zh-CN",
      locale: 'zh-CN',
    },
  ];

  testCases.forEach(({ description, input, expected, locale }) => {
    it(description, () => {
      const result = getAndUpdateLocaleInUrl(input);
      expect(result).toBe(locale);
      if (locale !== 'en') {
        expect(window.history.replaceState).toHaveBeenCalledWith(null, '', expected);
      } else {
        expect(window.history.replaceState).not.toHaveBeenCalled();
      }
    });
  });
});
