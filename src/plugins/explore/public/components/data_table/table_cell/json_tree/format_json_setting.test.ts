/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getStoredFormatJson, storeFormatJson } from './format_json_setting';

describe('stored "format JSON" choice', () => {
  const KEY = 'explore:formatJson';

  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('is undefined until a choice is stored', () => {
    expect(getStoredFormatJson()).toBeUndefined();
  });

  it('round-trips both choices', () => {
    storeFormatJson(false);
    expect(window.localStorage.getItem(KEY)).toBe('false');
    expect(getStoredFormatJson()).toBe(false);

    storeFormatJson(true);
    expect(window.localStorage.getItem(KEY)).toBe('true');
    expect(getStoredFormatJson()).toBe(true);
  });

  it('ignores any stored value other than "true" or "false"', () => {
    for (const stray of ['', '0', '1', 'yes', 'TRUE', 'null']) {
      window.localStorage.setItem(KEY, stray);
      expect(getStoredFormatJson()).toBeUndefined();
    }
  });

  it('does not throw when storage is unavailable', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getStoredFormatJson()).toBeUndefined();
    expect(() => storeFormatJson(true)).not.toThrow();
  });
});
