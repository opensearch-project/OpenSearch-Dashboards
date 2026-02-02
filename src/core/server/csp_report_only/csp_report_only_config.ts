/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { config } from './config';

const DEFAULT_CONFIG = Object.freeze(config.schema.validate({}));

/**
 * CSP-Report-Only configuration for use in OpenSearch Dashboards.
 * @public
 */
export interface ICspReportOnlyConfig {
  /**
   * Whether CSP-Report-Only is going to be emitted or not
   */
  readonly isEmitting: boolean;

  /**
   * The CSP-Report-Only rules used for OpenSearch Dashboards.
   */
  readonly rules: string[];

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
   * The CSP rules in a formatted directives string for use
   * in a `Content-Security-Policy-Report-Only`
   */
  readonly cspReportOnlyHeader: string;

  /**
   * The CSP report endpoint header
   */
  readonly reportingEndpointsHeader?: string;

  /**
   * The endpoint of where the CSP-Report-Only data should be sent
   */
  readonly endpoint?: string;

  /**
   * If this is set to true, we will only use the `report-uri` and not use the recommended `report-to` directive.
   * If this is set to false, we will emit both directives.
   * This is useful to set to true if the app is served through non-https as well as for dev purposes
   */
  readonly useDeprecatedReportUriOnly?: boolean;

  /**
   * Directives that should have a nonce value appended when building the header.
   * Example: ['style-src-elem'] will add 'nonce-{value}' to the style-src-elem directive.
   */
  readonly nonceDirectives: string[];

  /**
   * Builds the CSP-Report-Only header with nonce values inserted into configured directives.
   * @param nonce - The nonce value to insert (without 'nonce-' prefix)
   * @returns The complete CSP-Report-Only header string with nonces
   */
  buildHeaderWithNonce(nonce: string): string;
}

/**
 * Allowed source configuration for CSP directives.
 * @internal
 */
interface AllowedSourcesConfig {
  allowedFrameAncestorSources?: string[];
  allowedConnectSources?: string[];
  allowedImgSources?: string[];
}

/**
 * CSP-Report-Only configuration for use in OpenSearch Dashboards.
 * @public
 */
export class CspReportOnlyConfig implements ICspReportOnlyConfig {
  static readonly DEFAULT = new CspReportOnlyConfig();

  public readonly isEmitting: boolean;
  public readonly rules: string[];
  public readonly nonceDirectives: string[];
  public readonly cspReportOnlyHeader: string;
  public readonly reportingEndpointsHeader?: string;
  public readonly endpoint?: string;
  public readonly useDeprecatedReportUriOnly: boolean;
  private readonly endpointName = 'csp-endpoint';

  /**
   * Returns the default CSP-Report-Only configuration when passed with no config
   * @internal
   */
  constructor(
    rawCspReportOnlyConfig: Partial<
      Omit<ICspReportOnlyConfig, 'cspReportOnlyHeader' | 'reportingEndpointsHeader'>
    > = {}
  ) {
    const source = { ...DEFAULT_CONFIG, ...rawCspReportOnlyConfig };

    this.isEmitting = source.isEmitting;
    this.useDeprecatedReportUriOnly = source.useDeprecatedReportUriOnly;
    this.nonceDirectives = source.nonceDirectives;
    this.endpoint = source.endpoint;

    // Store processed rules with allowed sources applied
    this.rules = this.applyAllowedSources(source.rules, source);

    // Set up reporting endpoint header if using modern reporting
    if (this.endpoint && !this.useDeprecatedReportUriOnly) {
      this.reportingEndpointsHeader = `${this.endpointName}="${this.endpoint}"`;
    }

    // Build the base header
    this.cspReportOnlyHeader = this.buildHeaderInternal();
  }

  /**
   * Builds the CSP-Report-Only header with nonce values inserted into configured directives.
   * @param nonce - The nonce value to insert (without 'nonce-' prefix)
   * @returns The complete CSP-Report-Only header string with nonces
   */
  public buildHeaderWithNonce(nonce: string): string {
    return this.buildHeaderInternal(nonce);
  }

  /**
   * Apply allowed sources to rules that support them.
   * @internal
   */
  private applyAllowedSources(rules: string[], sources: AllowedSourcesConfig): string[] {
    return rules.map((rule) => {
      if (sources.allowedFrameAncestorSources && rule.startsWith('frame-ancestors')) {
        return `${rule} ${sources.allowedFrameAncestorSources.join(' ')}`;
      }
      if (sources.allowedConnectSources && rule.startsWith('connect-src')) {
        return `${rule} ${sources.allowedConnectSources.join(' ')}`;
      }
      if (sources.allowedImgSources && rule.startsWith('img-src')) {
        return `${rule} ${sources.allowedImgSources.join(' ')}`;
      }
      return rule;
    });
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
   * Append reporting directives to a header string.
   * @internal
   */
  private appendReportingDirectives(header: string): string {
    if (!this.endpoint) {
      return header;
    }
    if (this.useDeprecatedReportUriOnly) {
      return `${header}; report-uri ${this.endpoint};`;
    }
    return `${header}; report-uri ${this.endpoint}; report-to ${this.endpointName};`;
  }

  /**
   * Core header building logic, optionally with nonce.
   * @internal
   */
  private buildHeaderInternal(nonce?: string): string {
    const rules = nonce ? this.applyNonces(this.rules, nonce) : this.rules;
    const header = rules.join('; ');
    return this.appendReportingDirectives(header);
  }
}
