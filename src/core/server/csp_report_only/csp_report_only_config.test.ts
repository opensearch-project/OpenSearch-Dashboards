/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CspReportOnlyConfig } from './csp_report_only_config';

// CSP-Report-Only rules aren't strictly additive, so any change can potentially expand or
// restrict the policy in a way we consider a breaking change. For that reason,
// we test the default rules exactly so any change to those rules gets flagged
// for manual review. In other words, this test is intentionally fragile to draw
// extra attention if defaults are modified in any way.
//
// A test failure here does not necessarily mean this change cannot be made,
// but any change here should undergo sufficient scrutiny by the OpenSearch Dashboards
// security team.
//
// The tests use inline snapshots to make it as easy as possible to identify
// the nature of a change in defaults during a PR review.

describe('CspReportOnlyConfig', () => {
  describe('when no endpoint is configured', () => {
    test('DEFAULT', () => {
      expect(CspReportOnlyConfig.DEFAULT).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "default-src 'self'; script-src 'self'; script-src-attr 'none'; style-src 'self'; child-src 'none'; worker-src 'self'; frame-src 'none'; object-src 'none'; manifest-src 'self'; media-src 'none'; font-src 'self'; connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; form-action 'self'; frame-ancestors 'self'",
          "endpoint": undefined,
          "endpointName": "csp-endpoint",
          "isEmitting": false,
          "reportingEndpointsHeader": undefined,
          "rules": Array [
            "default-src 'self'",
            "script-src 'self'",
            "script-src-attr 'none'",
            "style-src 'self'",
            "child-src 'none'",
            "worker-src 'self'",
            "frame-src 'none'",
            "object-src 'none'",
            "manifest-src 'self'",
            "media-src 'none'",
            "font-src 'self'",
            "connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org",
            "img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org",
            "form-action 'self'",
            "frame-ancestors 'self'",
          ],
          "useDeprecatedReportUriOnly": false,
        }
      `);
    });

    test('defaults from config', () => {
      expect(new CspReportOnlyConfig()).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "default-src 'self'; script-src 'self'; script-src-attr 'none'; style-src 'self'; child-src 'none'; worker-src 'self'; frame-src 'none'; object-src 'none'; manifest-src 'self'; media-src 'none'; font-src 'self'; connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; form-action 'self'; frame-ancestors 'self'",
          "endpoint": undefined,
          "endpointName": "csp-endpoint",
          "isEmitting": false,
          "reportingEndpointsHeader": undefined,
          "rules": Array [
            "default-src 'self'",
            "script-src 'self'",
            "script-src-attr 'none'",
            "style-src 'self'",
            "child-src 'none'",
            "worker-src 'self'",
            "frame-src 'none'",
            "object-src 'none'",
            "manifest-src 'self'",
            "media-src 'none'",
            "font-src 'self'",
            "connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org",
            "img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org",
            "form-action 'self'",
            "frame-ancestors 'self'",
          ],
          "useDeprecatedReportUriOnly": false,
        }
      `);
    });

    test('creates from partial config', () => {
      expect(new CspReportOnlyConfig({ isEmitting: true })).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "default-src 'self'; script-src 'self'; script-src-attr 'none'; style-src 'self'; child-src 'none'; worker-src 'self'; frame-src 'none'; object-src 'none'; manifest-src 'self'; media-src 'none'; font-src 'self'; connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; form-action 'self'; frame-ancestors 'self'",
          "endpoint": undefined,
          "endpointName": "csp-endpoint",
          "isEmitting": true,
          "reportingEndpointsHeader": undefined,
          "rules": Array [
            "default-src 'self'",
            "script-src 'self'",
            "script-src-attr 'none'",
            "style-src 'self'",
            "child-src 'none'",
            "worker-src 'self'",
            "frame-src 'none'",
            "object-src 'none'",
            "manifest-src 'self'",
            "media-src 'none'",
            "font-src 'self'",
            "connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org",
            "img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org",
            "form-action 'self'",
            "frame-ancestors 'self'",
          ],
          "useDeprecatedReportUriOnly": false,
        }
      `);
    });

    test('computes header from rules without endpoint', () => {
      const cspConfig = new CspReportOnlyConfig({ rules: ['alpha', 'beta', 'gamma'] });
      expect(cspConfig).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "alpha; beta; gamma",
          "endpoint": undefined,
          "endpointName": "csp-endpoint",
          "isEmitting": false,
          "reportingEndpointsHeader": undefined,
          "rules": Array [
            "alpha",
            "beta",
            "gamma",
          ],
          "useDeprecatedReportUriOnly": false,
        }
      `);
    });
  });

  describe('when endpoint is configured with modern reporting (default)', () => {
    const TEST_ENDPOINT = 'https://opensearch.org/csp-endpoints';

    test('includes both report-uri and report-to directives', () => {
      const config = new CspReportOnlyConfig({
        endpoint: TEST_ENDPOINT,
        isEmitting: true,
      });

      expect(config).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "default-src 'self'; script-src 'self'; script-src-attr 'none'; style-src 'self'; child-src 'none'; worker-src 'self'; frame-src 'none'; object-src 'none'; manifest-src 'self'; media-src 'none'; font-src 'self'; connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; form-action 'self'; frame-ancestors 'self'; report-uri https://opensearch.org/csp-endpoints; report-to csp-endpoint;",
          "endpoint": "https://opensearch.org/csp-endpoints",
          "endpointName": "csp-endpoint",
          "isEmitting": true,
          "reportingEndpointsHeader": "csp-endpoint=\\"https://opensearch.org/csp-endpoints\\"",
          "rules": Array [
            "default-src 'self'",
            "script-src 'self'",
            "script-src-attr 'none'",
            "style-src 'self'",
            "child-src 'none'",
            "worker-src 'self'",
            "frame-src 'none'",
            "object-src 'none'",
            "manifest-src 'self'",
            "media-src 'none'",
            "font-src 'self'",
            "connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org",
            "img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org",
            "form-action 'self'",
            "frame-ancestors 'self'",
          ],
          "useDeprecatedReportUriOnly": false,
        }
      `);
    });

    test('computes header from custom rules with modern reporting', () => {
      const config = new CspReportOnlyConfig({
        rules: ['alpha', 'beta', 'gamma'],
        endpoint: TEST_ENDPOINT,
      });

      expect(config).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "alpha; beta; gamma; report-uri https://opensearch.org/csp-endpoints; report-to csp-endpoint;",
          "endpoint": "https://opensearch.org/csp-endpoints",
          "endpointName": "csp-endpoint",
          "isEmitting": false,
          "reportingEndpointsHeader": "csp-endpoint=\\"https://opensearch.org/csp-endpoints\\"",
          "rules": Array [
            "alpha",
            "beta",
            "gamma",
          ],
          "useDeprecatedReportUriOnly": false,
        }
      `);
    });

    test('includes both reporting directives in header generation', () => {
      const config = new CspReportOnlyConfig({
        rules: ["script-src 'self'", "style-src 'self'"],
        endpoint: TEST_ENDPOINT,
        isEmitting: true,
      });

      expect(config.cspReportOnlyHeader).toContain(
        'report-uri https://opensearch.org/csp-endpoints'
      );
      expect(config.cspReportOnlyHeader).toContain('report-to csp-endpoint');
      expect(config.endpoint).toBe('https://opensearch.org/csp-endpoints');
      expect(config.reportingEndpointsHeader).toBe(
        'csp-endpoint="https://opensearch.org/csp-endpoints"'
      );
    });
  });

  describe('when endpoint is configured with deprecated report-uri only', () => {
    const TEST_ENDPOINT = 'https://opensearch.org/csp-endpoints';

    test('includes only report-uri directive when useDeprecatedReportUriOnly is true', () => {
      const config = new CspReportOnlyConfig({
        endpoint: TEST_ENDPOINT,
        useDeprecatedReportUriOnly: true,
        isEmitting: true,
      });

      expect(config).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "default-src 'self'; script-src 'self'; script-src-attr 'none'; style-src 'self'; child-src 'none'; worker-src 'self'; frame-src 'none'; object-src 'none'; manifest-src 'self'; media-src 'none'; font-src 'self'; connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; form-action 'self'; frame-ancestors 'self'; report-uri https://opensearch.org/csp-endpoints;",
          "endpoint": "https://opensearch.org/csp-endpoints",
          "endpointName": "csp-endpoint",
          "isEmitting": true,
          "reportingEndpointsHeader": undefined,
          "rules": Array [
            "default-src 'self'",
            "script-src 'self'",
            "script-src-attr 'none'",
            "style-src 'self'",
            "child-src 'none'",
            "worker-src 'self'",
            "frame-src 'none'",
            "object-src 'none'",
            "manifest-src 'self'",
            "media-src 'none'",
            "font-src 'self'",
            "connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org",
            "img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org",
            "form-action 'self'",
            "frame-ancestors 'self'",
          ],
          "useDeprecatedReportUriOnly": true,
        }
      `);
    });

    test('computes header from custom rules with deprecated report-uri only', () => {
      const config = new CspReportOnlyConfig({
        rules: ['alpha', 'beta', 'gamma'],
        endpoint: TEST_ENDPOINT,
        useDeprecatedReportUriOnly: true,
      });

      expect(config).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "alpha; beta; gamma; report-uri https://opensearch.org/csp-endpoints;",
          "endpoint": "https://opensearch.org/csp-endpoints",
          "endpointName": "csp-endpoint",
          "isEmitting": false,
          "reportingEndpointsHeader": undefined,
          "rules": Array [
            "alpha",
            "beta",
            "gamma",
          ],
          "useDeprecatedReportUriOnly": true,
        }
      `);
    });

    test('includes only report-uri directive in header generation', () => {
      const config = new CspReportOnlyConfig({
        rules: ["script-src 'self'", "style-src 'self'"],
        endpoint: TEST_ENDPOINT,
        useDeprecatedReportUriOnly: true,
        isEmitting: true,
      });

      expect(config.cspReportOnlyHeader).toContain(
        'report-uri https://opensearch.org/csp-endpoints'
      );
      expect(config.cspReportOnlyHeader).not.toContain('report-to csp-endpoint');
      expect(config.endpoint).toBe('https://opensearch.org/csp-endpoints');
      expect(config.reportingEndpointsHeader).toBeUndefined();
    });
  });
});
