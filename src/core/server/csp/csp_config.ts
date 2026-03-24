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

import { config } from './config';
import { AllowedSourcesConfig, CSP_DIRECTIVES, STRICT_CSP_RULES_DEFAULT_VALUE } from '../constants';

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
   * This will also add the STRICT_CSP_RULES
   * @deprecated Use `enable` instead.
   */
  readonly strict: boolean;

  /**
   * Specify whether CSP hardening mode is enabled.
   */
  readonly enable: boolean;

  /**
   * Specify whether users with legacy browsers should be warned
   * about their lack of OpenSearch Dashboards security compliance.
   */
  readonly warnLegacyBrowsers: boolean;

  /**
   * Allowed sources for Frame Ancestors. Used to allow OSD to be embedded
   * in external websites. These will be added to
   * the CSP rule `frame-ancestors 'self' ...`
   */
  readonly allowedFrameAncestorSources?: string[];

  /**
   * Allowed sources for the connect-src directive. These allowlist
   * which endpoints that can be loaded using a script interface (eg fetch())
   * These will be added to the CSP rule `connect-src 'self' ${TRUSTED_ENDPOINTS} ...`
   */
  readonly allowedConnectSources?: string[];

  /**
   * Allowed sources for the img-src directive. These allowlist
   * which endpoints we can load images from
   * These will be added to the CSP rule `img-src 'self' data: ${TRUSTED_ENDPOINTS} ...`
   */
  readonly allowedImgSources?: string[];

  /**
   * Loosens the specified CSP directives back to the default_values.
   * This is only used when enable === true
   */
  readonly loosenCspDirectives?: string[];

  /**
   * The CSP rules in a formatted directives string for use
   * in a `Content-Security-Policy` header.
   */
  readonly header: string;

  /**
   * Directives that should have a nonce value appended when building the header.
   * Example: ['style-src-elem'] will add 'nonce-{value}' to the style-src-elem directive.
   */
  readonly nonceDirectives: string[];

  /**
   * Builds the CSP header with nonce values inserted into configured directives.
   * @param nonce - The nonce value to insert (without 'nonce-' prefix)
   * @returns The complete CSP header string with nonces
   */
  buildHeaderWithNonce(nonce: string): string;
}

/**
 * CSP configuration for use in OpenSearch Dashboards.
 * @public
 */
export class CspConfig implements ICspConfig {
  static readonly DEFAULT = new CspConfig();

  public readonly rules: string[];
  public readonly nonceDirectives: string[];
  /** @deprecated Use `enable` instead. */
  public readonly strict: boolean;
  public readonly enable: boolean;
  public readonly warnLegacyBrowsers: boolean;
  public readonly header: string;
  public readonly loosenCspDirectives: string[];

  /**
   * Returns the default CSP configuration when passed with no config
   * @internal
   */
  constructor(rawCspConfig: Partial<Omit<ICspConfig, 'header'>> = {}) {
    const source = { ...DEFAULT_CONFIG, ...rawCspConfig };

    this.rules = source.rules;
    this.enable = source.enable;
    this.strict = source.enable;
    this.warnLegacyBrowsers = source.warnLegacyBrowsers;
    this.nonceDirectives = source.nonceDirectives;
    this.loosenCspDirectives = source.loosenCspDirectives || [];

    if (source.enable) {
      this.rules = this.applyLoosenCspRules(
        this.applyAllowedSources(STRICT_CSP_RULES_DEFAULT_VALUE, source)
      );
      this.header = this.buildHeaderInternal();
    } else {
      this.rules = source.rules;
      this.header = source.rules.join('; ');
    }
  }

  /**
   * Apply nonces to rules that are in nonceDirectives.
   * @internal
   */
  private applyNonces(rules: string[], nonce: string): string[] {
    return rules.map((rule) => {
      const directive = rule.split(' ')[0];
      if (this.nonceDirectives.includes(directive)) {
        return `${rule} 'nonce-${nonce}'`;
      }
      return rule;
    });
  }

  /**
   * Builds the CSP header with nonce values inserted into configured directives.
   * @param nonce - The nonce value to insert (without 'nonce-' prefix)
   * @returns The complete CSP header string with nonces
   */
  public buildHeaderWithNonce(nonce: string): string {
    return this.buildHeaderInternal(nonce);
  }

  /**
   * Apply loosen CSP rules.
   * @internal
   */
  private applyLoosenCspRules(rules: string[]): string[] {
    return rules
      .map((rule) => {
        const ruleDirective = rule.split(' ')[0];
        if (this.loosenCspDirectives.includes(ruleDirective)) {
          return this.rules.find((originalRule) => originalRule.startsWith(ruleDirective)) || '';
        }
        return rule;
      })
      .filter((rule) => !!rule);
  }

  /**
   * Apply allowed sources to rules that support them.
   * @internal
   */
  private applyAllowedSources(rules: string[], sources: AllowedSourcesConfig): string[] {
    return rules.map((rule) => {
      if (sources.allowedFrameAncestorSources && rule.startsWith(CSP_DIRECTIVES.frameAncestors)) {
        return `${rule} ${sources.allowedFrameAncestorSources.join(' ')}`;
      }
      if (sources.allowedConnectSources && rule.startsWith(CSP_DIRECTIVES.connect)) {
        return `${rule} ${sources.allowedConnectSources.join(' ')}`;
      }
      if (sources.allowedImgSources && rule.startsWith(CSP_DIRECTIVES.img)) {
        return `${rule} ${sources.allowedImgSources.join(' ')}`;
      }
      return rule;
    });
  }

  /**
   * Core header building logic, optionally with nonce.
   * @internal
   */
  private buildHeaderInternal(nonce?: string): string {
    const rules = nonce ? this.applyNonces(this.rules, nonce) : this.rules;

    return rules.join('; ');
  }
}
