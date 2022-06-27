/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as helper from './graphite_helper';

describe('graphite_helper', function () {
  it('valid Url should not be blocked and isDeniedURL should return false', function () {
    expect(helper.isDeniedURL('https://opensearch.org', ['127.0.0.0/8'])).toEqual(false);
  });

  it('blocked Url should be blocked and isDeniedURL should return true', function () {
    expect(helper.isDeniedURL('https://127.0.0.1', ['127.0.0.0/8'])).toEqual(true);
  });

  it('invalid Url should be blocked and isDeniedURL should return true', function () {
    expect(helper.isDeniedURL('www.opensearch.org', ['127.0.0.0/8'])).toEqual(true);
  });

  it('denylist should be checked if denylist is enabled', function () {
    jest.spyOn(helper, 'isDeniedURL').mockReturnValueOnce(false);
    helper.isValidConfig(['127.0.0.0/8'], [], 'https://opensearch.org');
    expect(helper.isDeniedURL).toBeCalled();
  });

  it('denylist should be checked it both allowlist and denylist are enabled', function () {
    jest.spyOn(helper, 'isDeniedURL').mockReturnValueOnce(false);
    helper.isValidConfig(
      ['127.0.0.0/8'],
      ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
      'https://opensearch.org'
    );
    expect(helper.isDeniedURL).toBeCalled();
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

  it('with only denylist, isValidConfig should return false for Url in the denylist', function () {
    expect(helper.isValidConfig(['127.0.0.0/8'], [], 'https://127.0.0.1')).toEqual(false);
  });

  it('with only denylist, isValidConfig should return true for Url not in the denylist', function () {
    expect(helper.isValidConfig(['127.0.0.0/8'], [], 'https://opensearch.org')).toEqual(true);
  });

  it('with both denylist and allowlist, isValidConfig should return false if allowlist check fails', function () {
    expect(
      helper.isValidConfig(
        ['127.0.0.0/8'],
        ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
        'https://opensearch.org'
      )
    ).toEqual(false);
  });

  it('with both denylist and allowlist, isValidConfig should return false if denylist check fails', function () {
    expect(
      helper.isValidConfig(
        ['127.0.0.0/8'],
        ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
        'https://127.0.0.1'
      )
    ).toEqual(false);
  });

  it('with conflict denylist and allowlist, isValidConfig should return false if denylist check fails', function () {
    expect(
      helper.isValidConfig(['127.0.0.0/8'], ['https://127.0.0.1'], 'https://127.0.0.1')
    ).toEqual(false);
  });
});
