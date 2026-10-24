/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { isQuotaExceededError, safeSetItem } from './web_storage';

const quota = (over: Partial<{ name: string; code: number }>) =>
  Object.assign(new Error('q'), over);

describe('isQuotaExceededError', () => {
  it.each([
    ['QuotaExceededError', { name: 'QuotaExceededError' }],
    ['NS_ERROR_DOM_QUOTA_REACHED', { name: 'NS_ERROR_DOM_QUOTA_REACHED' }],
    ['QUOTA_EXCEEDED_ERR', { name: 'QUOTA_EXCEEDED_ERR' }],
    ['Firefox legacy code 1014', { code: 1014, name: 'Whatever' }],
    ['legacy code 22 with an unrecognized name', { code: 22, name: 'Whatever' }],
  ])('recognizes %s', (_label, shape) => {
    expect(isQuotaExceededError(quota(shape))).toBe(true);
  });

  it.each([
    ['InvalidStateError', { code: 22, name: 'InvalidStateError' }],
    ['SecurityError', { code: 22, name: 'SecurityError' }],
    ['an unrelated error', { name: 'TypeError' }],
  ])('does not mistake %s for a full store', (_label, shape) => {
    expect(isQuotaExceededError(quota(shape))).toBe(false);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'boom'],
  ])('handles %s', (_label, value) => {
    expect(isQuotaExceededError(value)).toBe(false);
  });
});

describe('safeSetItem', () => {
  it('writes and reports success', () => {
    const storage = { setItem: jest.fn() };

    expect(safeSetItem(storage, 'k', 'v')).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith('k', 'v');
  });

  it('reports failure instead of throwing when the store is full', () => {
    const storage = {
      setItem: jest.fn(() => {
        throw quota({ name: 'QuotaExceededError' });
      }),
    };

    expect(safeSetItem(storage, 'k', 'v')).toBe(false);
  });

  it('rethrows a non-quota failure so real faults are not masked', () => {
    const storage = {
      setItem: jest.fn(() => {
        throw new Error('disk on fire');
      }),
    };

    expect(() => safeSetItem(storage, 'k', 'v')).toThrow('disk on fire');
  });
});
