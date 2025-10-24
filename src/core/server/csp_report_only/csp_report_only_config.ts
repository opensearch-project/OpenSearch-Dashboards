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

    let cspReportOnlyHeader = source.rules.join('; ');

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
