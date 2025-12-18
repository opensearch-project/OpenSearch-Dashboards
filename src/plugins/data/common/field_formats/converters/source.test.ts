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

import { SourceFormat } from './source';
import { HtmlContextTypeConvert } from '../types';
import { HTML_CONTEXT_TYPE } from '../content_types';

describe('Source Format', () => {
  let convertHtml: Function;

  beforeEach(() => {
    const source = new SourceFormat({}, jest.fn());

    convertHtml = source.getConverterFor(HTML_CONTEXT_TYPE) as HtmlContextTypeConvert;
  });

  test('should use the text content type if a field is not passed', () => {
    const hit = {
      foo: 'bar',
      number: 42,
      hello: '<h1>World</h1>',
      also: 'with "quotes" or \'single quotes\'',
    };

    expect(convertHtml(hit)).toBe(
      '<span>{&quot;foo&quot;:&quot;bar&quot;,&quot;number&quot;:42,&quot;hello&quot;:&quot;&lt;h1&gt;World&lt;/h1&gt;&quot;,&quot;also&quot;:&quot;with \\&quot;quotes\\&quot; or &#39;single quotes&#39;&quot;}</span>'
    );
  });

  describe('templateHtml rendering', () => {
    test('should render a definition list with field name and value', () => {
      const mockIndexPattern = {
        formatHit: jest.fn().mockReturnValue({
          fieldName: 'field value',
        }),
      };

      const hit = {
        _source: { fieldName: 'field value' },
      };

      const field = { name: 'fieldName' };

      const result = convertHtml(hit, { field, hit, indexPattern: mockIndexPattern });

      expect(result).toContain('<dl class="source truncate-by-height">');
      expect(result).toContain('<dt>fieldName:</dt>');
      expect(result).toContain('<dd>field value</dd>');
      expect(mockIndexPattern.formatHit).toHaveBeenCalledWith(hit);
    });

    test('should render multiple fields in the definition list', () => {
      const mockIndexPattern = {
        formatHit: jest.fn().mockReturnValue({
          firstName: 'John',
          lastName: 'Doe',
          age: '30',
        }),
      };

      const hit = {
        _source: { firstName: 'John', lastName: 'Doe', age: 30 },
      };

      const field = { name: 'firstName' };

      const result = convertHtml(hit, { field, hit, indexPattern: mockIndexPattern });

      expect(result).toContain('<dt>firstName:</dt>');
      expect(result).toContain('<dd>John</dd>');
      expect(result).toContain('<dt>lastName:</dt>');
      expect(result).toContain('<dd>Doe</dd>');
      expect(result).toContain('<dt>age:</dt>');
      expect(result).toContain('<dd>30</dd>');
    });

    test('should escape HTML in field names to prevent XSS', () => {
      const mockIndexPattern = {
        formatHit: jest.fn().mockReturnValue({
          '<script>alert("xss")</script>': 'malicious field name',
        }),
      };

      const hit = {
        _source: { '<script>alert("xss")</script>': 'malicious field name' },
      };

      const field = { name: 'test' };

      const result = convertHtml(hit, { field, hit, indexPattern: mockIndexPattern });

      // Field name should be escaped
      expect(result).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      // Should NOT contain executable script tag
      expect(result).not.toContain('<script>alert("xss")</script>');
    });

    test('should preserve HTML markup in pre-formatted field values', () => {
      const mockIndexPattern = {
        formatHit: jest.fn().mockReturnValue({
          colorField: '<span style="color: red">red text</span>',
          urlField: '<a href="http://example.com">link</a>',
          highlightField: 'text with <mark>highlighted</mark> term',
        }),
      };

      const hit = {
        _source: {
          colorField: 'red text',
          urlField: 'http://example.com',
          highlightField: 'text with highlighted term',
        },
      };

      const field = { name: 'test' };

      const result = convertHtml(hit, { field, hit, indexPattern: mockIndexPattern });

      // HTML markup from formatters should be preserved (not escaped)
      expect(result).toContain('<span style="color: red">red text</span>');
      expect(result).toContain('<a href="http://example.com">link</a>');
      expect(result).toContain('text with <mark>highlighted</mark> term');
    });

    test('should use indexPattern.formatHit to format field values', () => {
      const mockFormatHit = jest.fn().mockReturnValue({
        formattedField: 'formatted value',
      });

      const mockIndexPattern = {
        formatHit: mockFormatHit,
      };

      const hit = {
        _source: { formattedField: 'raw value' },
      };

      const field = { name: 'formattedField' };

      convertHtml(hit, { field, hit, indexPattern: mockIndexPattern });

      // Verify that indexPattern.formatHit was called with the hit
      expect(mockFormatHit).toHaveBeenCalledWith(hit);
      expect(mockFormatHit).toHaveBeenCalledTimes(1);
    });

    test('should include highlighted fields from hit.highlight', () => {
      const mockIndexPattern = {
        formatHit: jest.fn().mockReturnValue({
          highlightedField: 'text with <mark>match</mark>',
          regularField: 'regular value',
        }),
      };

      const hit = {
        _source: {
          highlightedField: 'text with match',
          regularField: 'regular value',
        },
        highlight: {
          highlightedField: ['text with <mark>match</mark>'],
        },
      };

      const field = { name: 'test' };

      const result = convertHtml(hit, { field, hit, indexPattern: mockIndexPattern });

      // Both highlighted and regular fields should be present
      expect(result).toContain('<dt>highlightedField:</dt>');
      expect(result).toContain('<dd>text with <mark>match</mark></dd>');
      expect(result).toContain('<dt>regularField:</dt>');
      expect(result).toContain('<dd>regular value</dd>');

      // Highlighted field should appear before regular field
      const highlightedIndex = result.indexOf('highlightedField');
      const regularIndex = result.indexOf('regularField');
      expect(highlightedIndex).toBeLessThan(regularIndex);
    });
  });
});
