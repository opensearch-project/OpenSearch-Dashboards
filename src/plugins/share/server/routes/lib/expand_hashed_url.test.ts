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

import { hasHashedState, expandHashedUrl, processUrlForShortUrlResolution } from './expand_hashed_url';

describe('expand_hashed_url', () => {
  describe('hasHashedState', () => {
    it('should return true for URLs with hashed state parameters', () => {
      const urlWithHashedState = 'http://localhost:5601/app/dashboards#/view/dashboard1?_g=h@abc123&_a=h@def456';
      expect(hasHashedState(urlWithHashedState)).toBe(true);
    });

    it('should return false for URLs without hashed state parameters', () => {
      const urlWithoutHashedState = 'http://localhost:5601/app/dashboards#/view/dashboard1?_g=(time:(from:now-7d))&_a=(query:(match_all:()))';
      expect(hasHashedState(urlWithoutHashedState)).toBe(false);
    });

    it('should return false for URLs without hash fragment', () => {
      const urlWithoutHash = 'http://localhost:5601/app/dashboards';
      expect(hasHashedState(urlWithoutHash)).toBe(false);
    });

    it('should handle malformed URLs gracefully', () => {
      const malformedUrl = 'not-a-url';
      expect(hasHashedState(malformedUrl)).toBe(false);
    });

    it('should detect mixed hashed and regular state parameters', () => {
      const mixedUrl = 'http://localhost:5601/app/dashboards#/view/dashboard1?_g=(time:(from:now-7d))&_a=h@def456';
      expect(hasHashedState(mixedUrl)).toBe(true);
    });
  });

  describe('expandHashedUrl', () => {
    it('should remove hashed state parameters from URLs', () => {
      const urlWithHashedState = 'http://localhost:5601/app/dashboards#/view/dashboard1?_g=h@abc123&_a=h@def456&other=value';
      const result = expandHashedUrl(urlWithHashedState);

      expect(result).toContain('other=value');
      expect(result).not.toContain('h@abc123');
      expect(result).not.toContain('h@def456');
    });

    it('should preserve non-hashed state parameters', () => {
      const urlWithMixedState = 'http://localhost:5601/app/dashboards#/view/dashboard1?_g=(time:(from:now-7d))&_a=h@def456&_s=(tab:data)';
      const result = expandHashedUrl(urlWithMixedState);

      expect(result).toContain('_g=(time:(from:now-7d))');
      expect(result).toContain('_s=(tab:data)');
      expect(result).not.toContain('h@def456');
    });

    it('should return original URL if no hashed state parameters are present', () => {
      const normalUrl = 'http://localhost:5601/app/dashboards#/view/dashboard1?_g=(time:(from:now-7d))&_a=(query:(match_all:()))';
      const result = expandHashedUrl(normalUrl);

      expect(result).toBe(normalUrl);
    });

    it('should handle URLs without hash fragment', () => {
      const urlWithoutHash = 'http://localhost:5601/app/dashboards';
      const result = expandHashedUrl(urlWithoutHash);

      expect(result).toBe(urlWithoutHash);
    });

    it('should handle malformed URLs gracefully', () => {
      const malformedUrl = 'not-a-url';
      const result = expandHashedUrl(malformedUrl);

      expect(result).toBe(malformedUrl);
    });

    it('should preserve the base URL structure', () => {
      const baseUrl = 'http://localhost:5601/app/dashboards#/view/dashboard1';
      const urlWithHashedState = `${baseUrl}?_g=h@abc123&_a=h@def456`;
      const result = expandHashedUrl(urlWithHashedState);

      expect(result).toContain('http://localhost:5601/app/dashboards');
      expect(result).toContain('/view/dashboard1');
    });
  });

  describe('processUrlForShortUrlResolution', () => {
    it('should process URLs with hashed state', () => {
      const urlWithHashedState = 'http://localhost:5601/app/dashboards#/view/dashboard1?_g=h@abc123&_a=h@def456';
      const result = processUrlForShortUrlResolution(urlWithHashedState);

      expect(result).not.toContain('h@abc123');
      expect(result).not.toContain('h@def456');
      expect(result).toContain('/view/dashboard1');
    });

    it('should return URLs without hashed state unchanged', () => {
      const normalUrl = 'http://localhost:5601/app/dashboards#/view/dashboard1?_g=(time:(from:now-7d))';
      const result = processUrlForShortUrlResolution(normalUrl);

      expect(result).toBe(normalUrl);
    });

    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        '',
        'http://localhost:5601',
        'http://localhost:5601/app/dashboards#',
        'http://localhost:5601/app/dashboards#/',
        'not-a-url'
      ];

      edgeCases.forEach(url => {
        expect(() => processUrlForShortUrlResolution(url)).not.toThrow();
      });
    });
  });
});