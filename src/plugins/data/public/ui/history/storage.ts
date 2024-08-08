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

import { transform, startsWith, keys } from 'lodash';
import { parse, stringify } from '@osd/std';

export enum StorageKeys {
  WIDTH = 'widths',
}

type IStorageEngine = typeof window.localStorage;
export class QueryStorage {
  constructor(private readonly engine: IStorageEngine, private readonly prefix: string) {}

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

  remove(key: string) {
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
  return new QueryStorage(deps.engine, deps.prefix);
}
