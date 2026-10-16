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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { PersistedLog } from './persisted_log';

const createMockStorage = () => ({
  clear: jest.fn(),
  getItem: jest.fn(),
  key: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
  length: 0,
});

const historyName = 'testHistory';
const historyLimit = 10;
const payload = [
  { first: 'clark', last: 'kent' },
  { first: 'peter', last: 'parker' },
  { first: 'bruce', last: 'wayne' },
];

describe('PersistedLog', () => {
  let storage = createMockStorage();
  beforeEach(() => {
    storage = createMockStorage();
  });

  describe('expected API', () => {
    test('has expected methods', () => {
      const log = new PersistedLog(historyName, { maxLength: 10 }, storage);

      expect(typeof log.add).toBe('function');
      expect(typeof log.get).toBe('function');
    });
  });

  describe('internal functionality', () => {
    test('reads from storage', () => {
      // @ts-expect-error
      const log = new PersistedLog(historyName, { maxLength: 10 }, storage);

      expect(storage.getItem).toHaveBeenCalledTimes(1);
      expect(storage.getItem).toHaveBeenCalledWith(historyName);
    });

    test('writes to storage', () => {
      const log = new PersistedLog(historyName, { maxLength: 10 }, storage);
      const newItem = { first: 'diana', last: 'prince' };

      const data = log.add(newItem);

      expect(storage.setItem).toHaveBeenCalledTimes(1);
      expect(data).toEqual([newItem]);
    });
  });

  describe('persisting data', () => {
    test('fetches records from storage', () => {
      storage.getItem.mockReturnValue(JSON.stringify(payload));
      const log = new PersistedLog(historyName, { maxLength: 10 }, storage);

      const items = log.get();
      expect(items.length).toBe(3);
      expect(items).toEqual(payload);
    });

    test('prepends new records', () => {
      storage.getItem.mockReturnValue(JSON.stringify(payload.slice(0)));
      const log = new PersistedLog(historyName, { maxLength: 10 }, storage);
      const newItem = { first: 'selina', last: 'kyle' };

      const items = log.add(newItem);
      expect(items.length).toBe(payload.length + 1);
      expect(items[0]).toEqual(newItem);
    });
  });

  describe('stack options', () => {
    test('should observe the maxLength option', () => {
      const bulkData = [];

      for (let i = 0; i < historyLimit; i++) {
        bulkData.push(['record ' + i]);
      }
      storage.getItem.mockReturnValue(JSON.stringify(bulkData));

      const log = new PersistedLog(historyName, { maxLength: historyLimit }, storage);
      log.add(['new array 1']);
      const items = log.add(['new array 2']);

      expect(items.length).toBe(historyLimit);
    });

    test('should observe the filterDuplicates option', () => {
      storage.getItem.mockReturnValue(JSON.stringify(payload.slice(0)));
      const log = new PersistedLog(historyName, { maxLength: 10 }, storage);
      const newItem = payload[1];

      const items = log.add(newItem);
      expect(items.length).toBe(payload.length);
    });

    test('should truncate the list upon initialization if too long', () => {
      storage.getItem.mockReturnValue(JSON.stringify(payload.slice(0)));
      const log = new PersistedLog(historyName, { maxLength: 1 }, storage);
      const items = log.get();
      expect(items.length).toBe(1);
    });

    test('should allow a maxLength of 0', () => {
      storage.getItem.mockReturnValue(JSON.stringify(payload.slice(0)));
      const log = new PersistedLog(historyName, { maxLength: 0 }, storage);
      const items = log.get();
      expect(items.length).toBe(0);
    });
  });

  describe('quota handling', () => {
    const makeQuotaError = () => {
      // Mirror the browser DOMException for a full localStorage quota.
      const err: any = new Error(
        "Failed to execute 'setItem' on 'Storage': Setting the value of " +
          "'opensearchDashboards.history.recentlyAccessed' exceeded the quota."
      );
      err.name = 'QuotaExceededError';
      err.code = 22;
      return err;
    };

    test('does not throw when setItem hits a QuotaExceededError', () => {
      storage.setItem.mockImplementation(() => {
        throw makeQuotaError();
      });
      const log = new PersistedLog(historyName, { maxLength: 10 }, storage);

      // The whole point of the fix: add() must never surface the raw DOMException.
      expect(() => log.add({ first: 'diana', last: 'prince' })).not.toThrow();
    });

    test('sheds oldest entries and retries until the write succeeds', () => {
      storage.getItem.mockReturnValue(JSON.stringify(payload.slice(0))); // 3 existing
      // Fail while there is more than 1 item; succeed once shed to a single item.
      storage.setItem.mockImplementation((_key: string, value: string) => {
        if (JSON.parse(value).length > 1) {
          throw makeQuotaError();
        }
      });
      const log = new PersistedLog(historyName, { maxLength: 10 }, storage);

      const items = log.add({ first: 'selina', last: 'kyle' });

      // Only the newest entry survived the shed-down.
      expect(items.length).toBe(1);
      expect(items[0]).toEqual({ first: 'selina', last: 'kyle' });
      // add() builds [new, ...3 existing] = 4 items. The mock throws while the
      // serialized length > 1, so the attempt sequence is:
      //   len 4 (fail) -> 3 (fail) -> 2 (fail) -> 1 (success) = exactly 4 writes.
      expect(storage.setItem).toHaveBeenCalledTimes(4);
    });

    test('degrades gracefully when even an empty write fails (quota taken by other keys)', () => {
      storage.setItem.mockImplementation(() => {
        throw makeQuotaError();
      });
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const log = new PersistedLog(historyName, { maxLength: 10 }, storage);
      const newItem = { first: 'diana', last: 'prince' };

      const items = log.add(newItem);

      // In-memory list stays consistent for the session even though nothing persisted.
      expect(items).toEqual([newItem]);
      expect(log.get()).toEqual([newItem]);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    test('invokes a custom onQuotaExceeded handler instead of the default console.warn', () => {
      storage.setItem.mockImplementation(() => {
        throw makeQuotaError();
      });
      const onQuotaExceeded = jest.fn();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const log = new PersistedLog(historyName, { maxLength: 10, onQuotaExceeded }, storage);

      log.add({ first: 'diana', last: 'prince' });

      // The injected handler receives the failing storage key; the default
      // console.warn is NOT used when a handler is supplied.
      expect(onQuotaExceeded).toHaveBeenCalledWith(historyName);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    test('notifies onQuotaExceeded only once while the quota stays full', () => {
      storage.setItem.mockImplementation(() => {
        throw makeQuotaError();
      });
      const onQuotaExceeded = jest.fn();
      const log = new PersistedLog(historyName, { maxLength: 10, onQuotaExceeded }, storage);

      // Three routine add() calls while storage is persistently full.
      log.add({ first: 'a', last: 'a' });
      log.add({ first: 'b', last: 'b' });
      log.add({ first: 'c', last: 'c' });

      // Only warned once -- routine writes don't flood the handler/console.
      expect(onQuotaExceeded).toHaveBeenCalledTimes(1);
    });

    test('re-notifies after a successful write clears the guard', () => {
      let full = true;
      storage.setItem.mockImplementation(() => {
        if (full) {
          throw makeQuotaError();
        }
      });
      const onQuotaExceeded = jest.fn();
      const log = new PersistedLog(historyName, { maxLength: 10, onQuotaExceeded }, storage);

      log.add({ first: 'a', last: 'a' }); // full -> warns (1)
      log.add({ first: 'b', last: 'b' }); // still full -> suppressed
      full = false;
      log.add({ first: 'c', last: 'c' }); // succeeds -> clears guard
      full = true;
      log.add({ first: 'd', last: 'd' }); // full again -> warns (2)

      expect(onQuotaExceeded).toHaveBeenCalledTimes(2);
    });

    test('re-throws storage errors that are not quota errors', () => {
      const boom = new Error('disk on fire');
      storage.setItem.mockImplementation(() => {
        throw boom;
      });
      const log = new PersistedLog(historyName, { maxLength: 10 }, storage);

      expect(() => log.add({ first: 'bruce', last: 'wayne' })).toThrow('disk on fire');
    });

    test('does not treat InvalidStateError (code 22) as a quota error', () => {
      // DOMException code 22 is historically shared with InvalidStateError, so a
      // bare code check would misclassify it. It must re-throw, not be swallowed.
      const invalidState: any = new Error('storage is in an invalid state');
      invalidState.name = 'InvalidStateError';
      invalidState.code = 22;
      storage.setItem.mockImplementation(() => {
        throw invalidState;
      });
      const log = new PersistedLog(historyName, { maxLength: 10 }, storage);

      expect(() => log.add({ first: 'barry', last: 'allen' })).toThrow(
        'storage is in an invalid state'
      );
    });

    test('treats the Firefox quota code (1014) as a quota error via the numeric branch', () => {
      // Force reliance on the numeric code: give it a name the name-check does
      // NOT recognize, so detection must fall through to the `code === 1014`
      // branch (otherwise this would pass via the name path and not cover it).
      const ffQuota: any = new Error('quota reached');
      ffQuota.name = 'SomeUnrecognizedError';
      ffQuota.code = 1014;
      storage.setItem.mockImplementation(() => {
        throw ffQuota;
      });
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const log = new PersistedLog(historyName, { maxLength: 10 }, storage);

      expect(() => log.add({ first: 'hal', last: 'jordan' })).not.toThrow();
      warnSpy.mockRestore();
    });

    test('accepts legacy code 22 as a quota error when the name is not a known non-quota error', () => {
      // Exercises the positive `code === 22` branch: an unrecognized name means
      // detection cannot match on name and must accept via the numeric code
      // (and must NOT be excluded as InvalidStateError / SecurityError).
      const legacyQuota: any = new Error('quota exceeded');
      legacyQuota.name = 'SomeUnrecognizedError';
      legacyQuota.code = 22;
      storage.setItem.mockImplementation(() => {
        throw legacyQuota;
      });
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const log = new PersistedLog(historyName, { maxLength: 10 }, storage);

      expect(() => log.add({ first: 'arthur', last: 'curry' })).not.toThrow();
      warnSpy.mockRestore();
    });
  });
});
