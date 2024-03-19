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

import { modifyUrl } from '@osd/std';
import type { PrependOptions } from './types';

export class BasePath {
  constructor(
    private readonly basePath: string = '',
    public readonly serverBasePath: string = basePath,
    private readonly clientBasePath: string = ''
  ) {}

  public get = () => {
    return `${this.basePath}${this.clientBasePath}`;
  };

  public getBasePath = () => {
    return this.basePath;
  };

  public prepend = (path: string, prependOptions?: PrependOptions): string => {
    const { withoutClientBasePath } = prependOptions || {};
    const basePath = withoutClientBasePath ? this.basePath : this.get();
    if (!basePath) return path;
    return modifyUrl(path, (parts) => {
      if (!parts.hostname && parts.pathname && parts.pathname.startsWith('/')) {
        parts.pathname = `${basePath}${parts.pathname}`;
      }
    });
  };

  public remove = (path: string, prependOptions?: PrependOptions): string => {
    const { withoutClientBasePath } = prependOptions || {};
    const basePath = withoutClientBasePath ? this.basePath : this.get();
    if (!basePath) {
      return path;
    }

    if (path === basePath) {
      return '/';
    }

    if (path.startsWith(`${basePath}/`)) {
      return path.slice(basePath.length);
    }

    return path;
  };
}
