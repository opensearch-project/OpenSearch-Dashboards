/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as helper from './graphite_helper';

describe('graphite_helper', function () {
  it('valid Url should not be blocked and isDeniedURL should return false', async function () {
    expect(await helper.isDeniedURL('https://opensearch.org', ['127.0.0.0/8'])).toEqual(false);
  });

  it('blocked Url should be blocked and isDeniedURL should return true', async function () {
    expect(await helper.isDeniedURL('https://127.0.0.1', ['127.0.0.0/8'])).toEqual(true);
  });

  it('invalid Url should be blocked and isDeniedURL should return true', async function () {
    expect(await helper.isDeniedURL('www.opensearch.org', ['127.0.0.0/8'])).toEqual(true);
  });

  it('denylist should be checked if denylist is enabled', async function () {
    jest.spyOn(helper, 'isDeniedURL').mockResolvedValueOnce(false);
    await helper.isValidConfig(['127.0.0.0/8'], [], 'https://opensearch.org');
    expect(helper.isDeniedURL).toBeCalled();
  });

  it('denylist should be checked it both allowlist and denylist are enabled', async function () {
    jest.spyOn(helper, 'isDeniedURL').mockResolvedValueOnce(false);
    await helper.isValidConfig(
      ['127.0.0.0/8'],
      ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
      'https://opensearch.org'
    );
    expect(helper.isDeniedURL).toBeCalled();
  });

  it('with only allowlist, isValidConfig should return false for Url not in the allowlist', async function () {
    expect(
      await helper.isValidConfig(
        [],
        ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
        'https://opensearch.org'
      )
    ).toEqual(false);
  });

  it('with only allowlist, isValidConfig should return true for Url in the allowlist', async function () {
    expect(
      await helper.isValidConfig(
        [],
        ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
        'https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'
      )
    ).toEqual(true);
  });

  it('with only denylist, isValidConfig should return false for Url in the denylist', async function () {
    expect(await helper.isValidConfig(['127.0.0.0/8'], [], 'https://127.0.0.1')).toEqual(false);
  });

  it('with only denylist, isValidConfig should return true for Url not in the denylist', async function () {
    expect(await helper.isValidConfig(['127.0.0.0/8'], [], 'https://opensearch.org')).toEqual(true);
  });

  it('with both denylist and allowlist, isValidConfig should return false if allowlist check fails', async function () {
    expect(
      await helper.isValidConfig(
        ['127.0.0.0/8'],
        ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
        'https://opensearch.org'
      )
    ).toEqual(false);
  });

  it('with both denylist and allowlist, isValidConfig should return false if denylist check fails', async function () {
    expect(
      await helper.isValidConfig(
        ['127.0.0.0/8'],
        ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
        'https://127.0.0.1'
      )
    ).toEqual(false);
  });

  it('with conflict denylist and allowlist, isValidConfig should return false if denylist check fails', async function () {
    expect(
      await helper.isValidConfig(['127.0.0.0/8'], ['https://127.0.0.1'], 'https://127.0.0.1')
    ).toEqual(false);
  });
});
