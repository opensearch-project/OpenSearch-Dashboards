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

  it('should block IPv6 localhost addresses', async function () {
    expect(await helper.isDeniedURL('http://[::1]', ['::1/128'])).toEqual(true);
  });

  it('should block IPv6 addresses in denied CIDR range', async function () {
    expect(await helper.isDeniedURL('http://[2001:db8::1]', ['2001:db8::/32'])).toEqual(true);
  });

  it('should not block IPv6 addresses outside denied CIDR range', async function () {
    expect(await helper.isDeniedURL('http://[2001:db9::1]', ['2001:db8::/32'])).toEqual(false);
  });

  it('should block private IPv4 addresses in 10.0.0.0/8 range', async function () {
    expect(await helper.isDeniedURL('http://10.0.0.1', ['10.0.0.0/8'])).toEqual(true);
  });

  it('should block private IPv4 addresses in 172.16.0.0/12 range', async function () {
    expect(await helper.isDeniedURL('http://172.16.0.1', ['172.16.0.0/12'])).toEqual(true);
  });

  it('should block private IPv4 addresses in 192.168.0.0/16 range', async function () {
    expect(await helper.isDeniedURL('http://192.168.1.1', ['192.168.0.0/16'])).toEqual(true);
  });

  it('should handle multiple denied IP ranges and block if any match', async function () {
    expect(
      await helper.isDeniedURL('http://192.168.1.1', [
        '127.0.0.0/8',
        '10.0.0.0/8',
        '192.168.0.0/16',
      ])
    ).toEqual(true);
  });

  it('should handle multiple denied IP ranges and allow if none match', async function () {
    expect(
      await helper.isDeniedURL('https://opensearch.org', [
        '127.0.0.0/8',
        '10.0.0.0/8',
        '192.168.0.0/16',
      ])
    ).toEqual(false);
  });

  it('should block link-local IPv4 addresses (169.254.0.0/16)', async function () {
    expect(await helper.isDeniedURL('http://169.254.1.1', ['169.254.0.0/16'])).toEqual(true);
  });

  it('should block specific single IP address using /32 CIDR', async function () {
    expect(await helper.isDeniedURL('http://203.0.113.1', ['203.0.113.1/32'])).toEqual(true);
  });

  it('should not block IP address outside specific /32 CIDR', async function () {
    expect(await helper.isDeniedURL('http://203.0.113.2', ['203.0.113.1/32'])).toEqual(false);
  });

  it('should handle mixed IPv4 and IPv6 denied ranges', async function () {
    expect(
      await helper.isDeniedURL('http://[::1]', ['127.0.0.0/8', '::1/128', '10.0.0.0/8'])
    ).toEqual(true);
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
