/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as helper from './graphite_helper';

describe('graphite_helper', function () {
  it('valid Url should not be blocked and isBlockedURL should return false', function () {
    expect(helper.isBlockedURL('https://opensearch.org', ['127.0.0.0/8'])).toEqual(false);
  });

  it('blocked Url should be blocked and isBlockedURL should return true', function () {
    expect(helper.isBlockedURL('https://127.0.0.1', ['127.0.0.0/8'])).toEqual(true);
  });

  it('invalid Url should be blocked and isBlockedURL should return true', function () {
    expect(helper.isBlockedURL('www.opensearch.org', ['127.0.0.0/8'])).toEqual(true);
  });

  it('blocklist should be checked if blocklist is enabled', function () {
    jest.spyOn(helper, 'isBlockedURL').mockReturnValueOnce(false);
    helper.isValidConfig(['127.0.0.0/8'], [], 'https://opensearch.org');
    expect(helper.isBlockedURL).toBeCalled();
  });

  it('blocklist should be checked it both allowlist and blocklist are enabled', function () {
    jest.spyOn(helper, 'isBlockedURL').mockReturnValueOnce(false);
    helper.isValidConfig(
      ['127.0.0.0/8'],
      ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
      'https://opensearch.org'
    );
    expect(helper.isBlockedURL).toBeCalled();
  });

  it('with only allowlist, isValidConfig should return false for Url not in the allowlist', function () {
    expect(
      helper.isValidConfig(
        [],
        ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
        'https://opensearch.org'
      )
    ).toEqual(false);
  });

  it('with only allowlist, isValidConfig should return true for Url in the allowlist', function () {
    expect(
      helper.isValidConfig(
        [],
        ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
        'https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'
      )
    ).toEqual(true);
  });

  it('with only blocklist, isValidConfig should return false for Url in the blocklist', function () {
    expect(helper.isValidConfig(['127.0.0.0/8'], [], 'https://127.0.0.1')).toEqual(false);
  });

  it('with only blocklist, isValidConfig should return true for Url not in the blocklist', function () {
    expect(helper.isValidConfig(['127.0.0.0/8'], [], 'https://opensearch.org')).toEqual(true);
  });

  it('with both blocklist and allowlist, isValidConfig should return false if allowlist check fails', function () {
    expect(
      helper.isValidConfig(
        ['127.0.0.0/8'],
        ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
        'https://opensearch.org'
      )
    ).toEqual(false);
  });

  it('with both blocklist and allowlist, isValidConfig should return false if blocklist check fails', function () {
    expect(
      helper.isValidConfig(
        ['127.0.0.0/8'],
        ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
        'https://127.0.0.1'
      )
    ).toEqual(false);
  });

  it('with conflict blocklist and allowlist, isValidConfig should return false if blocklist check fails', function () {
    expect(
      helper.isValidConfig(['127.0.0.0/8'], ['https://127.0.0.1'], 'https://127.0.0.1')
    ).toEqual(false);
  });
});
