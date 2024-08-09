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

import { config, CspConfigType } from './config';

const DEFAULT_CONFIG = Object.freeze(config.schema.validate({}));

/**
 * CSP configuration for use in OpenSearch Dashboards.
 * @public
 */
export interface ICspConfig {
  /**
   * The CSP rules used for OpenSearch Dashboards.
   */
  readonly rules: string[];

  /**
   * Specify whether browsers that do not support CSP should be
   * able to use OpenSearch Dashboards. Use `true` to block and `false` to allow.
   */
  readonly strict: boolean;

  /**
   * Specify whether users with legacy browsers should be warned
   * about their lack of OpenSearch Dashboards security compliance.
   */
  readonly warnLegacyBrowsers: boolean;

  /**
   * The CSP rules in a formatted directives string for use
   * in a `Content-Security-Policy` header.
   */
  readonly header: string;
}
export interface ICspConfigImpl {
  new (rawCspConfig?: Partial<Omit<ICspConfig, 'header'>>): ICspConfig;
  DEFAULT: Pick<CspConfigImpl, 'rules' | 'strict' | 'warnLegacyBrowsers' | 'header'>;
}

/**
 * CSP configuration implementation that exposes a method to update the configs. Only visible to core
 * @internal
 * */
export class CspConfigImpl implements ICspConfig {
  static readonly DEFAULT = new CspConfigImpl();

  #rules: string[];
  #strict: boolean;
  #warnLegacyBrowsers: boolean;
  #header: string;

  /**
   * Returns the default CSP configuration when passed with no config
   * @internal
   */
  constructor(rawCspConfig: Partial<Omit<ICspConfig, 'header'>> = {}) {
    const source = { ...DEFAULT_CONFIG, ...rawCspConfig };

    this.#rules = source.rules;
    this.#strict = source.strict;
    this.#warnLegacyBrowsers = source.warnLegacyBrowsers;
    this.#header = source.rules.join('; ');
  }

  public updateCSPConfig(newCspConfig: CspConfigType) {
    this.#rules = newCspConfig.rules;
    this.#strict = newCspConfig.strict;
    this.#warnLegacyBrowsers = newCspConfig.warnLegacyBrowsers;
    this.#header = newCspConfig.rules.join('; ');
  }

  public get rules() {
    return this.#rules;
  }

  public get strict() {
    return this.#strict;
  }

  public get warnLegacyBrowsers() {
    return this.#warnLegacyBrowsers;
  }

  public get header() {
    return this.#header;
  }
}

/**
 * CSP configuration for use in OpenSearch Dashboards.
 * @public
 */
export const CspConfig: ICspConfigImpl = CspConfigImpl;
