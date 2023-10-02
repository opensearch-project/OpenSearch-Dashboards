/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as validator from './endpoint_validator';

describe('endpoint_validator', function () {
  it('Url1 that should be blocked should return false', function () {
    expect(validator.isValidURL('http://127.0.0.1', ['127.0.0.0/8'])).toEqual(false);
  });

  it('Url2 that is invalid should return false', function () {
    expect(validator.isValidURL('www.test.com', [])).toEqual(false);
  });

  it('Url3 that is invalid should return false', function () {
    expect(validator.isValidURL('ftp://www.test.com', [])).toEqual(false);
  });

  it('Url4 that should be blocked should return false', function () {
    expect(
      validator.isValidURL('http://169.254.169.254/latest/meta-data/', ['169.254.0.0/16'])
    ).toEqual(false);
  });

  it('Url5 that should not be blocked should return true', function () {
    expect(validator.isValidURL('https://www.opensearch.org', ['127.0.0.0/8'])).toEqual(true);
  });

  it('Url6 that should not be blocked should return true when null IPs', function () {
    expect(validator.isValidURL('https://www.opensearch.org')).toEqual(true);
  });
});
