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

import { schema } from '..';

test('is required by default', () => {
  expect(() => schema.uri().validate(undefined)).toThrowErrorMatchingInlineSnapshot(
    `"expected value of type [string] but got [undefined]."`
  );
});

test('returns value for valid URI as per RFC3986', () => {
  const uriSchema = schema.uri();

  expect(uriSchema.validate('http://tools.ietf.org/html/rfc3986')).toBe(
    'http://tools.ietf.org/html/rfc3986'
  );
  expect(uriSchema.validate('udp://3domain.local')).toBe('udp://3domain.local');
  expect(uriSchema.validate('urn:opensearch:opensearchDashboards')).toBe(
    'urn:opensearch:opensearchDashboards'
  );
  expect(uriSchema.validate('ftp://ftp.ietf.org/rfc/rfc3986.txt')).toBe(
    'ftp://ftp.ietf.org/rfc/rfc3986.txt'
  );
  expect(uriSchema.validate('mailto:Platform.OpenSearchDashboards@opensearch.org')).toBe(
    'mailto:Platform.OpenSearchDashboards@opensearch.org'
  );
  expect(uriSchema.validate('tel:+500-111-222-333')).toBe('tel:+500-111-222-333');
  expect(uriSchema.validate('file:///opensearch_dashboards.log')).toBe(
    'file:///opensearch_dashboards.log'
  );
  expect(uriSchema.validate('http://opensearch@localhost:9200')).toBe(
    'http://opensearch@localhost:9200'
  );
  expect(uriSchema.validate('http://opensearch:changeme@localhost:9200')).toBe(
    'http://opensearch:changeme@localhost:9200'
  );
  expect(uriSchema.validate('ldap://[2001:db8::7]/c=GB?objectClass?one')).toBe(
    'ldap://[2001:db8::7]/c=GB?objectClass?one'
  );

  const uriWithMaxAllowedLength = `http://${'a'.repeat(255)}`;
  expect(uriSchema.validate(uriWithMaxAllowedLength)).toBe(uriWithMaxAllowedLength);
});

test('returns error when value is not a URI', () => {
  const uriSchema = schema.uri();

  expect(() => uriSchema.validate('3domain.local')).toThrowErrorMatchingInlineSnapshot(
    `"value must be a valid URI (see RFC 3986)."`
  );
  expect(() =>
    uriSchema.validate('http://8010:0:0:0:9:500:300C:200A')
  ).toThrowErrorMatchingInlineSnapshot(`"value must be a valid URI (see RFC 3986)."`);
  expect(() => uriSchema.validate('-')).toThrowErrorMatchingInlineSnapshot(
    `"value must be a valid URI (see RFC 3986)."`
  );
  expect(() =>
    uriSchema.validate('https://example.com?baz[]=foo&baz[]=bar')
  ).toThrowErrorMatchingInlineSnapshot(`"value must be a valid URI (see RFC 3986)."`);

  const tooLongUri = `http://${'a'.repeat(256)}`;
  expect(() => uriSchema.validate(tooLongUri)).toThrowErrorMatchingInlineSnapshot(
    `"value must be a valid URI (see RFC 3986)."`
  );
});

describe('#scheme', () => {
  test('returns value when URI has required scheme', () => {
    const uriSchema = schema.uri({ scheme: ['http', 'https'] });

    expect(uriSchema.validate('http://opensearch.org')).toBe('http://opensearch.org');
    expect(uriSchema.validate('https://opensearch.org')).toBe('https://opensearch.org');
  });

  test('returns error when shorter string', () => {
    const uriSchema = schema.uri({ scheme: ['http', 'https'] });

    expect(() => uriSchema.validate('ftp://opensearch.org')).toThrowErrorMatchingInlineSnapshot(
      `"expected URI with scheme [http|https]."`
    );
    expect(() =>
      uriSchema.validate('file:///opensearch_dashboards.log')
    ).toThrowErrorMatchingInlineSnapshot(`"expected URI with scheme [http|https]."`);
  });
});

describe('#defaultValue', () => {
  test('returns default when URI is undefined', () => {
    expect(schema.uri({ defaultValue: 'http://localhost:9200' }).validate(undefined)).toBe(
      'http://localhost:9200'
    );
  });

  test('returns value when specified', () => {
    expect(
      schema
        .uri({ defaultValue: 'http://localhost:9200' })
        .validate('http://opensearch-dashboards.local')
    ).toBe('http://opensearch-dashboards.local');
  });

  test('returns value from context when context reference is specified', () => {
    expect(
      schema.uri({ defaultValue: schema.contextRef('some_uri') }).validate(undefined, {
        some_uri: 'http://opensearch-dashboards.local',
      })
    ).toBe('http://opensearch-dashboards.local');
  });
});

describe('#validate', () => {
  test('is called with input value', () => {
    let calledWith;

    const validator = (val: any) => {
      calledWith = val;
    };

    schema.uri({ validate: validator }).validate('http://opensearch-dashboards.local');

    expect(calledWith).toBe('http://opensearch-dashboards.local');
  });

  test('is not called with default value in no input', () => {
    const validate = jest.fn();

    schema
      .uri({ validate, defaultValue: 'http://opensearch-dashboards.local' })
      .validate(undefined);

    expect(validate).not.toHaveBeenCalled();
  });

  test('throws when returns string', () => {
    const validate = () => 'validator failure';

    expect(() =>
      schema.uri({ validate }).validate('http://opensearch-dashboards.local')
    ).toThrowErrorMatchingInlineSnapshot(`"validator failure"`);
  });
});

test('returns error when not string', () => {
  expect(() => schema.uri().validate(123)).toThrowErrorMatchingInlineSnapshot(
    `"expected value of type [string] but got [number]."`
  );

  expect(() => schema.uri().validate([1, 2, 3])).toThrowErrorMatchingInlineSnapshot(
    `"expected value of type [string] but got [Array]."`
  );

  expect(() => schema.uri().validate(/abc/)).toThrowErrorMatchingInlineSnapshot(
    `"expected value of type [string] but got [RegExp]."`
  );
});
