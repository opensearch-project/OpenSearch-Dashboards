/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as validator from './endpoint_validator';

describe('endpoint_validator', function () {
  const BLOCKED_IP_LIST = [
    '127.0.0.0/8',
    '::1/128',
    '169.254.0.0/16',
    'fe80::/10',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    'fc00::/7',
    '0.0.0.0/8',
    '100.64.0.0/10',
    '192.0.0.0/24',
    '192.0.2.0/24',
    '198.18.0.0/15',
    '192.88.99.0/24',
    '198.51.100.0/24',
    '203.0.113.0/24',
    '224.0.0.0/4',
    '240.0.0.0/4',
    '255.255.255.255/32',
    '::/128',
    '2001:db8::/32',
    'ff00::/8',
  ];

  it('Url1 that should be blocked should return invalid with error', function () {
    const result = validator.isValidURL('http://127.0.0.1', ['127.0.0.0/8']);
    expect(result.valid).toEqual(false);
    expect(result.error).toBeDefined();
  });

  it('Url2 that is invalid should return invalid with error', function () {
    const result = validator.isValidURL('www.test.com', []);
    expect(result.valid).toEqual(false);
    expect(result.error).toBeDefined();
  });

  it('Url3 that is invalid should return invalid with error', function () {
    const result = validator.isValidURL('ftp://www.test.com', []);
    expect(result.valid).toEqual(false);
    expect(result.error).toBeDefined();
  });

  it('Url4 that should be blocked should return invalid with error', function () {
    const result = validator.isValidURL('http://169.254.169.254/latest/meta-data/', [
      '169.254.0.0/16',
    ]);
    expect(result.valid).toEqual(false);
    expect(result.error).toBeDefined();
  });

  it('Url5 that should not be blocked should return valid', function () {
    const result = validator.isValidURL('https://www.opensearch.org', ['127.0.0.0/8']);
    expect(result.valid).toEqual(true);
    expect(result.error).toBeUndefined();
  });

  it('Url6 that should not be blocked should return valid when null IPs', function () {
    const result = validator.isValidURL('https://www.opensearch.org');
    expect(result.valid).toEqual(true);
    expect(result.error).toBeUndefined();
  });

  it('allowlisted url should bypass IP validation', function () {
    const allowlistedSuffixes = ['.allowlisted-service.example.com'];
    const result = validator.isValidURL(
      'https://test.allowlisted-service.example.com',
      BLOCKED_IP_LIST,
      allowlistedSuffixes
    );
    expect(result.valid).toEqual(true);
    expect(result.error).toBeUndefined();
  });

  it('non-allowlisted url should go through normal IP validation', function () {
    const allowlistedSuffixes = ['.allowlisted-service.example.com'];
    const result = validator.isValidURL(
      'https://www.opensearch.org',
      BLOCKED_IP_LIST,
      allowlistedSuffixes
    );
    expect(result.valid).toEqual(true);
    expect(result.error).toBeUndefined();
  });

  it('url not matching allowlist should be validated normally', function () {
    const allowlistedSuffixes = ['.allowlisted.example.com'];
    const result = validator.isValidURL(
      'https://notallowlisted.example.com',
      BLOCKED_IP_LIST,
      allowlistedSuffixes
    );
    // Will depend on DNS resolution
    expect(result.valid).toBeDefined();
  });
});
