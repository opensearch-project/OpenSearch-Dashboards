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
}

/**
 * CSP-Report-Only configuration for use in OpenSearch Dashboards.
 * @public
 */
export class CspReportOnlyConfig implements ICspReportOnlyConfig {
  static readonly DEFAULT = new CspReportOnlyConfig();

  public readonly isEmitting: boolean;
  public readonly rules: string[];
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
    this.rules = source.rules;
    this.useDeprecatedReportUriOnly = source.useDeprecatedReportUriOnly;

    const finalRules = source.rules.map((rule) => {
      if (source.allowedFrameAncestorSources && rule.startsWith('frame-ancestors')) {
        return `${rule} ${source.allowedFrameAncestorSources.join(' ')}`;
      }
      if (source.allowedConnectSources && rule.startsWith('connect-src')) {
        return `${rule} ${source.allowedConnectSources.join(' ')}`;
      }
      if (source.allowedImgSources && rule.startsWith('img-src')) {
        return `${rule} ${source.allowedImgSources.join(' ')}`;
      }
      return rule;
    });

    let cspReportOnlyHeader = finalRules.join('; ');

    if (source.endpoint) {
      this.endpoint = source.endpoint;

      if (source.useDeprecatedReportUriOnly) {
        cspReportOnlyHeader += `; report-uri ${this.endpoint};`;
      } else {
        this.reportingEndpointsHeader = `${this.endpointName}="${this.endpoint}"`;
        cspReportOnlyHeader += `; report-uri ${this.endpoint}; report-to ${this.endpointName};`;
      }
    }

    this.cspReportOnlyHeader = cspReportOnlyHeader;
  }
}
