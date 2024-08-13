/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getLocaleInUrl } from './locale_helper';

describe('getLocaleInUrl', () => {
  beforeEach(() => {
    // Clear any warnings before each test
    delete (window as any).__localeWarning;
  });

  it('should return the locale from a valid query string', () => {
    const url = 'http://localhost:5603/app/home?locale=en-US';
    expect(getLocaleInUrl(url)).toBe('en-US');
  });

  it('should return the locale from a valid hash query string', () => {
    const url = 'http://localhost:5603/app/home#/?locale=fr-FR';
    expect(getLocaleInUrl(url)).toBe('fr-FR');
  });

  it('should return null for a URL without locale', () => {
    const url = 'http://localhost:5603/app/home';
    expect(getLocaleInUrl(url)).toBeNull();
  });

  it('should return null and set a warning for an invalid locale format in hash', () => {
    const url = 'http://localhost:5603/app/home#/&locale=de-DE';
    expect(getLocaleInUrl(url)).toBeNull();
    expect((window as any).__localeWarning).toBeDefined();
    expect((window as any).__localeWarning.title).toBe('Invalid URL Format');
  });

  it('should return null for an empty locale value', () => {
    const url = 'http://localhost:5603/app/home?locale=';
    expect(getLocaleInUrl(url)).toBeNull();
  });

  it('should handle URLs with other query parameters', () => {
    const url = 'http://localhost:5603/app/home?param1=value1&locale=ja-JP&param2=value2';
    expect(getLocaleInUrl(url)).toBe('ja-JP');
  });

  it('should handle URLs with other hash parameters', () => {
    const url = 'http://localhost:5603/app/home#/route?param1=value1&locale=zh-CN&param2=value2';
    expect(getLocaleInUrl(url)).toBe('zh-CN');
  });
});
