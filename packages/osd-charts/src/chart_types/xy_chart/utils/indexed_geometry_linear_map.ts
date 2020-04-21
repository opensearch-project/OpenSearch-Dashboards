/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { IndexedGeometry } from '../../../utils/geometry';

/** @internal */
export class IndexedGeometryLinearMap {
  private map = new Map<string | number, IndexedGeometry[]>();

  get size() {
    return this.map.size;
  }

  set(geometry: IndexedGeometry) {
    const { x } = geometry.value;
    const existing = this.map.get(x);
    if (existing === undefined) {
      this.map.set(x, [geometry]);
    } else {
      this.map.set(x, [geometry, ...existing]);
    }
  }

  getMergeData() {
    return [...this.map.values()];
  }

  keys(): Array<number | string> {
    return [...this.map.keys()];
  }

  find(x: number | string | null): IndexedGeometry[] {
    if (x === null) {
      return [];
    }

    return this.map.get(x) ?? [];
  }
}
