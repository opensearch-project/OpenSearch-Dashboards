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

import { transform, keys, startsWith } from 'lodash';
import { parse, stringify } from '@osd/std';

type IStorageEngine = typeof window.localStorage;

export enum StorageKeys {
  WIDTH = 'widths',
}

/** Bytes a key/value pair occupies in web storage, which stores UTF-16. */
export const storedByteLength = (key: string, serializedValue: string): number =>
  (key.length + serializedValue.length) * 2;

export class Storage {
  constructor(
    private readonly engine: IStorageEngine,
    private readonly prefix: string
  ) {}

  encode(val: any) {
    return stringify(val);
  }

  decode(val: any) {
    if (typeof val === 'string') {
      return parse(val);
    }
  }

  encodeKey(key: string) {
    return `${this.prefix}${key}`;
  }

  decodeKey(key: string) {
    if (startsWith(key, this.prefix)) {
      return `${key.slice(this.prefix.length)}`;
    }
  }

  set(key: string, val: any) {
    this.engine.setItem(this.encodeKey(key), this.encode(val));
    return val;
  }

  has(key: string) {
    return this.engine.getItem(this.encodeKey(key)) != null;
  }

  get<T>(key: string, _default?: T) {
    if (this.has(key)) {
      return this.decode(this.engine.getItem(this.encodeKey(key)));
    } else {
      return _default;
    }
  }

  /**
   * Stored size of an entry without decoding it. Sizing a whole keyspace via
   * get() would cost a parse per key on every write. Absent key returns 0.
   */
  rawByteLength(key: string) {
    const encodedKey = this.encodeKey(key);
    const raw = this.engine.getItem(encodedKey);
    if (raw === null) return 0;
    return storedByteLength(encodedKey, raw);
  }

  delete(key: string) {
    return this.engine.removeItem(this.encodeKey(key));
  }

  keys(): string[] {
    return transform(keys(this.engine), (ours, key) => {
      const ourKey = this.decodeKey(key);
      if (ourKey != null) ours.push(ourKey);
    });
  }
}

export function createStorage(deps: { engine: IStorageEngine; prefix: string }) {
  return new Storage(deps.engine, deps.prefix);
}
