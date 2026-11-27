/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react';
import {
  getFormatJson,
  resetFormatJsonForTests,
  setFormatJson,
  useFormatJson,
} from './format_json_setting';

describe('"format JSON" choice', () => {
  const KEY = 'explore:formatJson';

  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
    resetFormatJsonForTests();
  });

  it('is on by default', () => {
    expect(getFormatJson()).toBe(true);
  });

  it('reads the stored choice, and reads storage only once', () => {
    window.localStorage.setItem(KEY, 'false');
    const getItem = jest.spyOn(Storage.prototype, 'getItem');
    expect(getFormatJson()).toBe(false);
    expect(getFormatJson()).toBe(false);
    expect(getItem).toHaveBeenCalledTimes(1);
  });

  it('ignores any stored value other than "true" or "false"', () => {
    for (const stray of ['', '0', '1', 'yes', 'TRUE', 'null']) {
      window.localStorage.setItem(KEY, stray);
      resetFormatJsonForTests();
      expect(getFormatJson()).toBe(true);
    }
  });

  it('stores the choice and re-renders its users', () => {
    const { result } = renderHook(() => useFormatJson());
    expect(result.current).toBe(true);
    act(() => setFormatJson(false));
    expect(result.current).toBe(false);
    expect(window.localStorage.getItem(KEY)).toBe('false');
  });

  it('keeps the choice for the page when storage is unavailable', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getFormatJson()).toBe(true);
    expect(() => setFormatJson(false)).not.toThrow();
    expect(getFormatJson()).toBe(false);
  });
});
