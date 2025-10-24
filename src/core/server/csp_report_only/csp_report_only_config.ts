/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { config } from './config';
import { CSP_REPORT_ONLY_ENDPOINT } from './constants';

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
  readonly reportUri?: string;
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
  public readonly reportUri?: string;
  private readonly endpointName = 'csp-endpoint';

  /**
   * Returns the default CSP-Report-Only configuration when passed with no config
   * @internal
   */
  constructor(
    rawCspReportOnlyConfig: Partial<
      Omit<ICspReportOnlyConfig, 'cspReportOnlyHeader' | 'reportingEndpointsHeader' | 'reportUri'>
    > = {}
  ) {
    const source = { ...DEFAULT_CONFIG, ...rawCspReportOnlyConfig };

    this.isEmitting = source.isEmitting;
    this.rules = source.rules;

    let cspReportOnlyHeader = source.rules.join('; ');

    if (CSP_REPORT_ONLY_ENDPOINT) {
      this.reportUri = CSP_REPORT_ONLY_ENDPOINT;
      this.reportingEndpointsHeader = `${this.endpointName}="${this.reportUri}"`;
      cspReportOnlyHeader += `; report-uri ${this.reportUri}; report-to ${this.endpointName};`;
    }

    this.cspReportOnlyHeader = cspReportOnlyHeader;
  }
}
