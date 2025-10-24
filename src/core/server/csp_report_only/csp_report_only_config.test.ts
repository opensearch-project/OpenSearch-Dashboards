/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// This will be overridden in each test
const setupMock = (endpoint: string) => {
  jest.doMock('./constants', () => ({ CSP_REPORT_ONLY_ENDPOINT: endpoint }));
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('.').CspReportOnlyConfig;
};

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
  describe('when CSP_REPORT_ONLY_ENDPOINT is empty', () => {
    let CspReportOnlyConfig: any;

    beforeEach(() => {
      CspReportOnlyConfig = setupMock('');
    });

    test('DEFAULT', () => {
      expect(CspReportOnlyConfig.DEFAULT).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "script-src 'self'; worker-src 'self'; style-src 'self'",
          "endpointName": "csp-report",
          "isEmitting": false,
          "reportUri": undefined,
          "reportingEndpointsHeader": undefined,
          "rules": Array [
            "script-src 'self'",
            "worker-src 'self'",
            "style-src 'self'",
          ],
        }
      `);
    });

    test('defaults from config', () => {
      expect(new CspReportOnlyConfig()).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "script-src 'self'; worker-src 'self'; style-src 'self'",
          "endpointName": "csp-report",
          "isEmitting": false,
          "reportUri": undefined,
          "reportingEndpointsHeader": undefined,
          "rules": Array [
            "script-src 'self'",
            "worker-src 'self'",
            "style-src 'self'",
          ],
        }
      `);
    });

    test('creates from partial config', () => {
      expect(new CspReportOnlyConfig({ isEmitting: true })).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "script-src 'self'; worker-src 'self'; style-src 'self'",
          "endpointName": "csp-report",
          "isEmitting": true,
          "reportUri": undefined,
          "reportingEndpointsHeader": undefined,
          "rules": Array [
            "script-src 'self'",
            "worker-src 'self'",
            "style-src 'self'",
          ],
        }
      `);
    });

    test('computes header from rules without report endpoints', () => {
      const cspConfig = new CspReportOnlyConfig({ rules: ['alpha', 'beta', 'gamma'] });
      expect(cspConfig).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "alpha; beta; gamma",
          "endpointName": "csp-report",
          "isEmitting": false,
          "reportUri": undefined,
          "reportingEndpointsHeader": undefined,
          "rules": Array [
            "alpha",
            "beta",
            "gamma",
          ],
        }
      `);
    });
  });

  describe('when CSP_REPORT_ONLY_ENDPOINT is set to URL', () => {
    const TEST_ENDPOINT = 'https://opensearch.org/csp-reports';
    let CspReportOnlyConfig: any;

    beforeEach(() => {
      CspReportOnlyConfig = setupMock(TEST_ENDPOINT);
    });

    test('DEFAULT with reporting endpoint', () => {
      expect(CspReportOnlyConfig.DEFAULT).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "script-src 'self'; worker-src 'self'; style-src 'self'report-uri https://opensearch.org/csp-reports; report-to csp-report",
          "endpointName": "csp-report",
          "isEmitting": false,
          "reportUri": "https://opensearch.org/csp-reports",
          "reportingEndpointsHeader": "csp-report=\\"https://opensearch.org/csp-reports\\"",
          "rules": Array [
            "script-src 'self'",
            "worker-src 'self'",
            "style-src 'self'",
          ],
        }
      `);
    });

    test('defaults from config with reporting endpoint', () => {
      expect(new CspReportOnlyConfig()).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "script-src 'self'; worker-src 'self'; style-src 'self'report-uri https://opensearch.org/csp-reports; report-to csp-report",
          "endpointName": "csp-report",
          "isEmitting": false,
          "reportUri": "https://opensearch.org/csp-reports",
          "reportingEndpointsHeader": "csp-report=\\"https://opensearch.org/csp-reports\\"",
          "rules": Array [
            "script-src 'self'",
            "worker-src 'self'",
            "style-src 'self'",
          ],
        }
      `);
    });

    test('creates from partial config with reporting endpoint', () => {
      expect(new CspReportOnlyConfig({ isEmitting: true })).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "script-src 'self'; worker-src 'self'; style-src 'self'report-uri https://opensearch.org/csp-reports; report-to csp-report",
          "endpointName": "csp-report",
          "isEmitting": true,
          "reportUri": "https://opensearch.org/csp-reports",
          "reportingEndpointsHeader": "csp-report=\\"https://opensearch.org/csp-reports\\"",
          "rules": Array [
            "script-src 'self'",
            "worker-src 'self'",
            "style-src 'self'",
          ],
        }
      `);
    });

    test('computes header from rules with report endpoints', () => {
      const cspConfig = new CspReportOnlyConfig({ rules: ['alpha', 'beta', 'gamma'] });
      expect(cspConfig).toMatchInlineSnapshot(`
        CspReportOnlyConfig {
          "cspReportOnlyHeader": "alpha; beta; gammareport-uri https://opensearch.org/csp-reports; report-to csp-report",
          "endpointName": "csp-report",
          "isEmitting": false,
          "reportUri": "https://opensearch.org/csp-reports",
          "reportingEndpointsHeader": "csp-report=\\"https://opensearch.org/csp-reports\\"",
          "rules": Array [
            "alpha",
            "beta",
            "gamma",
          ],
        }
      `);
    });

    test('includes reporting endpoint in header generation', () => {
      const config = new CspReportOnlyConfig({
        rules: ["script-src 'self'", "style-src 'self'"],
        isEmitting: true,
      });

      expect(config.cspReportOnlyHeader).toContain('report-uri https://opensearch.org/csp-reports');
      expect(config.cspReportOnlyHeader).toContain('report-to csp-report');
      expect(config.reportUri).toBe('https://opensearch.org/csp-reports');
      expect(config.reportingEndpointsHeader).toBe(
        'csp-report="https://opensearch.org/csp-reports"'
      );
    });
  });
});
