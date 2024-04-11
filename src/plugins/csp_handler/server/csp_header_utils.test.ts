/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseCspHeader, stringifyCspHeader } from './csp_header_utils';

describe('CSP header utils', () => {
  describe('parseCspHeader', () => {
    it('parses multiple directives', () => {
      const parsed = parseCspHeader(
        "script-src 'unsafe-eval' 'self'; worker-src blob: 'self'; style-src 'unsafe-inline' 'self'; frame-ancestors 'self' localsystem"
      );

      expect(parsed.size).toBe(4);
      expect(parsed.get('script-src')).toEqual(["'unsafe-eval'", "'self'"]);
      expect(parsed.get('worker-src')).toEqual(['blob:', "'self'"]);
      expect(parsed.get('style-src')).toEqual(["'unsafe-inline'", "'self'"]);
      expect(parsed.get('frame-ancestors')).toEqual(["'self'", 'localsystem']);
    });

    it('parses single directive', () => {
      const parsed = parseCspHeader("frame-ancestors 'self' localsystem");

      expect(parsed.size).toBe(1);
      expect(parsed.get('frame-ancestors')).toEqual(["'self'", 'localsystem']);
    });
  });

  describe('stringifyCspHeader', () => {
    it('stringify multiple directives', () => {
      const cspHeader = new Map([
        ['script-src', ["'unsafe-eval'", "'self'"]],
        ['worker-src', ['blob:', "'self'"]],
        ['style-src', ["'unsafe-inline'", "'self'"]],
        ['frame-ancestors', ["'self'", 'localsystem']],
      ]);

      const stringified = stringifyCspHeader(cspHeader);

      expect(stringified).toBe(
        "script-src 'unsafe-eval' 'self'; worker-src blob: 'self'; style-src 'unsafe-inline' 'self'; frame-ancestors 'self' localsystem"
      );
    });
  });
});
