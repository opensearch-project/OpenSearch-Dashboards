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

import { CspConfig } from '.';

// CSP rules aren't strictly additive, so any change can potentially expand or
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

describe('CspConfig', () => {
  test('DEFAULT', () => {
    expect(CspConfig.DEFAULT).toMatchInlineSnapshot(`
      CspConfig {
        "enable": false,
        "header": "script-src 'unsafe-eval' 'self'; worker-src blob: 'self'; style-src 'unsafe-inline' 'self'",
        "loosenCspDirectives": Array [],
        "nonceDirectives": Array [
          "style-src-elem",
        ],
        "rules": Array [
          "script-src 'unsafe-eval' 'self'",
          "worker-src blob: 'self'",
          "style-src 'unsafe-inline' 'self'",
        ],
        "strict": false,
        "warnLegacyBrowsers": true,
      }
    `);
  });

  test('defaults from config', () => {
    expect(new CspConfig()).toMatchInlineSnapshot(`
      CspConfig {
        "enable": false,
        "header": "script-src 'unsafe-eval' 'self'; worker-src blob: 'self'; style-src 'unsafe-inline' 'self'",
        "loosenCspDirectives": Array [],
        "nonceDirectives": Array [
          "style-src-elem",
        ],
        "rules": Array [
          "script-src 'unsafe-eval' 'self'",
          "worker-src blob: 'self'",
          "style-src 'unsafe-inline' 'self'",
        ],
        "strict": false,
        "warnLegacyBrowsers": true,
      }
    `);
  });

  test('enable true gives strict csp rules', () => {
    expect(new CspConfig({ enable: true, warnLegacyBrowsers: false })).toMatchInlineSnapshot(`
      CspConfig {
        "enable": true,
        "header": "default-src 'self'; script-src 'self'; script-src-attr 'none'; style-src 'self'; style-src-elem 'self'; style-src-attr 'self' 'unsafe-inline'; child-src 'none'; worker-src 'self'; frame-src 'none'; object-src 'none'; manifest-src 'self'; media-src 'none'; font-src 'self'; connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; form-action 'self'; frame-ancestors 'self'",
        "loosenCspDirectives": Array [],
        "nonceDirectives": Array [
          "style-src-elem",
        ],
        "rules": Array [
          "default-src 'self'",
          "script-src 'self'",
          "script-src-attr 'none'",
          "style-src 'self'",
          "style-src-elem 'self'",
          "style-src-attr 'self' 'unsafe-inline'",
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
        "strict": true,
        "warnLegacyBrowsers": false,
      }
    `);
  });

  test('computes header from rules', () => {
    const cspConfig = new CspConfig({ rules: ['alpha', 'beta', 'gamma'] });

    expect(cspConfig).toMatchInlineSnapshot(`
      CspConfig {
        "enable": false,
        "header": "alpha; beta; gamma",
        "loosenCspDirectives": Array [],
        "nonceDirectives": Array [
          "style-src-elem",
        ],
        "rules": Array [
          "alpha",
          "beta",
          "gamma",
        ],
        "strict": false,
        "warnLegacyBrowsers": true,
      }
    `);
  });

  describe('buildHeaderWithNonce', () => {
    test('inserts nonce into directives specified in nonceDirectives', () => {
      const config = new CspConfig({
        rules: ["script-src 'self'", "style-src-elem 'self'", "style-src 'self'"],
        nonceDirectives: ['style-src-elem'],
        strict: true,
      });

      const header = config.buildHeaderWithNonce('test-nonce-123');

      expect(header).toBe(
        "default-src 'self'; script-src 'self'; script-src-attr 'none'; style-src 'self'; style-src-elem 'self' 'nonce-test-nonce-123'; style-src-attr 'self' 'unsafe-inline'; child-src 'none'; worker-src 'self'; frame-src 'none'; object-src 'none'; manifest-src 'self'; media-src 'none'; font-src 'self'; connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; form-action 'self'; frame-ancestors 'self'"
      );
    });

    test('inserts nonce into multiple directives', () => {
      const config = new CspConfig({
        rules: ["script-src 'self'", "style-src-elem 'self'"],
        nonceDirectives: ['script-src', 'style-src-elem'],
        strict: true,
      });

      const header = config.buildHeaderWithNonce('abc123');

      expect(header).toBe(
        "default-src 'self'; script-src 'self' 'nonce-abc123'; script-src-attr 'none'; style-src 'self'; style-src-elem 'self' 'nonce-abc123'; style-src-attr 'self' 'unsafe-inline'; child-src 'none'; worker-src 'self'; frame-src 'none'; object-src 'none'; manifest-src 'self'; media-src 'none'; font-src 'self'; connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; form-action 'self'; frame-ancestors 'self'"
      );
    });

    test('does not modify directives not in nonceDirectives', () => {
      const config = new CspConfig({
        rules: ["script-src 'self'", "style-src 'self'"],
        nonceDirectives: [],
        strict: true,
      });

      const header = config.buildHeaderWithNonce('test-nonce');

      expect(header).toBe(
        "default-src 'self'; script-src 'self'; script-src-attr 'none'; style-src 'self'; style-src-elem 'self'; style-src-attr 'self' 'unsafe-inline'; child-src 'none'; worker-src 'self'; frame-src 'none'; object-src 'none'; manifest-src 'self'; media-src 'none'; font-src 'self'; connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; form-action 'self'; frame-ancestors 'self'"
      );
      expect(header).not.toContain('nonce');
    });

    test('works with default config with strict true', () => {
      const config = new CspConfig({
        strict: true,
      });
      const header = config.buildHeaderWithNonce('default-nonce');

      expect(header).toContain("style-src-elem 'self' 'nonce-default-nonce'");
      expect(header).not.toContain('<NONCE>');
    });

    test('includes allowed sources in header with nonce', () => {
      const config = new CspConfig({
        rules: ["style-src-elem 'self'", "connect-src 'self'", "frame-ancestors 'self'"],
        nonceDirectives: ['style-src-elem'],
        allowedConnectSources: ['https://api.example.com'],
        allowedFrameAncestorSources: ['https://parent.example.com'],
        strict: true,
      });

      const header = config.buildHeaderWithNonce('test-nonce');

      expect(header).toBe(
        "default-src 'self'; script-src 'self'; script-src-attr 'none'; style-src 'self'; style-src-elem 'self' 'nonce-test-nonce'; style-src-attr 'self' 'unsafe-inline'; child-src 'none'; worker-src 'self'; frame-src 'none'; object-src 'none'; manifest-src 'self'; media-src 'none'; font-src 'self'; connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org https://api.example.com; img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; form-action 'self'; frame-ancestors 'self' https://parent.example.com"
      );
    });
  });

  describe('loosenCspDirectives', () => {
    test('loosens specified directives to default values in strict mode', () => {
      const config = new CspConfig({
        strict: true,
        loosenCspDirectives: ['script-src', 'worker-src'],
      });

      expect(config).toMatchInlineSnapshot(`
        CspConfig {
          "enable": false,
          "header": "default-src 'self'; script-src 'unsafe-eval' 'self'; script-src-attr 'none'; style-src 'self'; style-src-elem 'self'; style-src-attr 'self' 'unsafe-inline'; child-src 'none'; worker-src blob: 'self'; frame-src 'none'; object-src 'none'; manifest-src 'self'; media-src 'none'; font-src 'self'; connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; form-action 'self'; frame-ancestors 'self'",
          "loosenCspDirectives": Array [
            "script-src",
            "worker-src",
          ],
          "nonceDirectives": Array [
            "style-src-elem",
          ],
          "rules": Array [
            "default-src 'self'",
            "script-src 'unsafe-eval' 'self'",
            "script-src-attr 'none'",
            "style-src 'self'",
            "style-src-elem 'self'",
            "style-src-attr 'self' 'unsafe-inline'",
            "child-src 'none'",
            "worker-src blob: 'self'",
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
          "strict": false,
          "warnLegacyBrowsers": true,
        }
      `);
    });

    test('has no effect in non-strict mode', () => {
      const config = new CspConfig({
        strict: false,
        loosenCspDirectives: ['script-src', 'worker-src'],
        rules: ["script-src 'self'", "worker-src 'self'"],
      });

      expect(config.rules).toEqual(["script-src 'self'", "worker-src 'self'"]);
      expect(config.loosenCspDirectives).toEqual(['script-src', 'worker-src']);
    });

    test('handles empty array', () => {
      const config = new CspConfig({
        strict: true,
        loosenCspDirectives: [],
      });

      expect(config.loosenCspDirectives).toEqual([]);
      expect(config.header).toBe(
        "default-src 'self'; script-src 'self'; script-src-attr 'none'; style-src 'self'; style-src-elem 'self'; style-src-attr 'self' 'unsafe-inline'; child-src 'none'; worker-src 'self'; frame-src 'none'; object-src 'none'; manifest-src 'self'; media-src 'none'; font-src 'self'; connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org; form-action 'self'; frame-ancestors 'self'"
      );
    });
  });

  describe('allowedImgSources', () => {
    test('adds custom sources to img-src directive in strict mode', () => {
      const config = new CspConfig({
        strict: true,
        allowedImgSources: ['https://images.example.com', 'https://cdn.example.org'],
      });

      expect(config.header).toContain(
        "img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org https://images.example.com https://cdn.example.org"
      );
    });

    test('works with buildHeaderWithNonce', () => {
      const config = new CspConfig({
        strict: true,
        allowedImgSources: ['https://images.example.com'],
        nonceDirectives: ['style-src-elem'],
      });

      const header = config.buildHeaderWithNonce('test-nonce');

      expect(header).toContain(
        "img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org https://images.example.com"
      );
    });

    test('has no effect in non-strict mode without custom rules', () => {
      const config = new CspConfig({
        strict: false,
        allowedImgSources: ['https://images.example.com'],
      });

      expect(config.header).not.toContain('https://images.example.com');
    });
  });

  describe('allowedConnectSources', () => {
    test('adds custom sources to connect-src directive in strict mode', () => {
      const config = new CspConfig({
        strict: true,
        allowedConnectSources: ['https://api.example.com', 'wss://websocket.example.org'],
      });

      expect(config.header).toContain(
        "connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org https://api.example.com wss://websocket.example.org"
      );
    });

    test('preserves trusted endpoints when adding custom sources', () => {
      const config = new CspConfig({
        strict: true,
        allowedConnectSources: ['https://custom.example.com'],
      });

      const connectRule = config.rules.find((rule) => rule.startsWith('connect-src'));
      expect(connectRule).toContain('https://opensearch.org');
      expect(connectRule).toContain('https://docs.opensearch.org');
      expect(connectRule).toContain('https://custom.example.com');
    });

    test('handles empty array', () => {
      const config = new CspConfig({
        strict: true,
        allowedConnectSources: [],
      });

      expect(config.header).toContain(
        "connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org"
      );
    });
  });

  describe('allowedFrameAncestorSources', () => {
    test('adds custom sources to frame-ancestors directive in strict mode', () => {
      const config = new CspConfig({
        strict: true,
        allowedFrameAncestorSources: ['https://parent.example.com', 'https://embed.example.org'],
      });

      expect(config.header).toContain(
        "frame-ancestors 'self' https://parent.example.com https://embed.example.org"
      );
    });

    test('works with buildHeaderWithNonce', () => {
      const config = new CspConfig({
        strict: true,
        allowedFrameAncestorSources: ['https://parent.example.com'],
        nonceDirectives: ['style-src-elem'],
      });

      const header = config.buildHeaderWithNonce('test-nonce');

      expect(header).toContain("frame-ancestors 'self' https://parent.example.com");
    });

    test('handles empty array', () => {
      const config = new CspConfig({
        strict: true,
        allowedFrameAncestorSources: [],
      });

      expect(config.header).toContain("frame-ancestors 'self'");
    });
  });

  describe('combined allowed sources', () => {
    test('applies all allowed sources together', () => {
      const config = new CspConfig({
        strict: true,
        allowedConnectSources: ['https://api.example.com'],
        allowedFrameAncestorSources: ['https://parent.example.com'],
        allowedImgSources: ['https://images.example.com'],
      });

      expect(config.header).toContain(
        "connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org https://api.example.com"
      );
      expect(config.header).toContain("frame-ancestors 'self' https://parent.example.com");
      expect(config.header).toContain(
        "img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org https://images.example.com"
      );
    });

    test('works with loosenCspDirectives and allowed sources', () => {
      const config = new CspConfig({
        strict: true,
        loosenCspDirectives: ['script-src'],
        allowedConnectSources: ['https://api.example.com'],
        allowedImgSources: ['https://images.example.com'],
      });

      expect(config.header).toContain("script-src 'unsafe-eval' 'self'");
      expect(config.header).toContain(
        "connect-src 'self' https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org https://api.example.com"
      );
      expect(config.header).toContain(
        "img-src 'self' data: https://opensearch.org https://docs.opensearch.org https://maps.opensearch.org https://vectors.maps.opensearch.org https://tiles.maps.opensearch.org https://images.example.com"
      );
    });
  });
});
