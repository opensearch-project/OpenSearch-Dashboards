/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const { isHttpUrl } = require('./archive');

describe('isHttpUrl', () => {
  // Expected values are what the `url.parse()`-based check returned on Node 22.23.4
  it.each([
    [
      'https://artifacts.opensearch.org/snapshots/core/opensearch/3.9.0-SNAPSHOT/opensearch-min-3.9.0-SNAPSHOT-linux-x64-latest.tar.gz',
      true,
    ],
    ['http://localhost:8080/a.tar.gz', true],
    ['HTTPS://H/a.tar.gz', true],
    ['  https://h/x', true],
    ['https:/h/x', true],
    ['http:x.tar.gz', true],
    ['/home/u/opensearch.tar.gz', false],
    ['opensearch.tar.gz', false],
    ['./x.tar.gz', false],
    ['C:\\Users\\u\\opensearch.zip', false],
    ['c:/x.zip', false],
    ['file:///tmp/x.tar.gz', false],
    ['ftp://h/x.tar.gz', false],
    ['s3://bucket/x', false],
    ['', false],
  ])('%j -> %s', (archive, expected) => {
    expect(isHttpUrl(archive)).toBe(expected);
  });
});
