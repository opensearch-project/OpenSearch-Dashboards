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

import { parseEnvFile, resolveCdnConfig } from './cdn_config';

describe('parseEnvFile', () => {
  it('parses KEY=value lines, ignoring comments and blanks', () => {
    const parsed = parseEnvFile(
      ['# a comment', '', 'CDN_BUCKET=my-bucket', 'CDN_REGION=us-west-2', '   '].join('\n')
    );
    expect(parsed).toEqual({ CDN_BUCKET: 'my-bucket', CDN_REGION: 'us-west-2' });
  });

  it('strips an optional `export ` prefix and surrounding quotes', () => {
    const parsed = parseEnvFile(['export CDN_BUCKET="quoted"', "CDN_KEY_PREFIX='mfe'"].join('\n'));
    expect(parsed).toEqual({ CDN_BUCKET: 'quoted', CDN_KEY_PREFIX: 'mfe' });
  });

  it('keeps `=` characters that appear in the value', () => {
    const parsed = parseEnvFile('CDN_BASE_URL=https://x.cloudfront.net/?a=b');
    expect(parsed.CDN_BASE_URL).toBe('https://x.cloudfront.net/?a=b');
  });
});

describe('resolveCdnConfig', () => {
  const fullEnv = {
    CDN_BUCKET: 'test-bucket-000',
    CDN_REGION: 'us-west-2',
    CDN_BASE_URL: 'https://dxxxxxxxxxxxxx.cloudfront.net',
    CDN_KEY_PREFIX: 'mfe',
    CDN_DISTRIBUTION_ID: 'EXXXXXXXXXX',
    CDN_DOMAIN: 'dxxxxxxxxxxxxx.cloudfront.net',
  };

  it('resolves all fields from the environment', () => {
    const cdn = resolveCdnConfig(fullEnv);
    expect(cdn).toEqual({
      bucket: 'test-bucket-000',
      region: 'us-west-2',
      baseUrl: 'https://dxxxxxxxxxxxxx.cloudfront.net',
      keyPrefix: 'mfe',
      distributionId: 'EXXXXXXXXXX',
      domain: 'dxxxxxxxxxxxxx.cloudfront.net',
    });
  });

  it('strips a trailing slash from baseUrl and slashes from keyPrefix', () => {
    const cdn = resolveCdnConfig({
      ...fullEnv,
      CDN_BASE_URL: 'https://cdn.example/',
      CDN_KEY_PREFIX: '/mfe/',
    });
    expect(cdn.baseUrl).toBe('https://cdn.example');
    expect(cdn.keyPrefix).toBe('mfe');
  });

  it('prefers the live environment over the parsed file', () => {
    const cdn = resolveCdnConfig(
      { CDN_BUCKET: 'env-bucket' },
      { ...fullEnv, CDN_BUCKET: 'file-bucket' }
    );
    expect(cdn.bucket).toBe('env-bucket');
    // Falls back to the file for values the env does not provide.
    expect(cdn.region).toBe('us-west-2');
  });

  it('omits optional distributionId/domain when absent', () => {
    const cdn = resolveCdnConfig({
      CDN_BUCKET: 'b',
      CDN_REGION: 'us-west-2',
      CDN_BASE_URL: 'https://c',
      CDN_KEY_PREFIX: 'mfe',
    });
    expect(cdn.distributionId).toBeUndefined();
    expect(cdn.domain).toBeUndefined();
  });

  it('throws listing every missing required field', () => {
    expect(() => resolveCdnConfig({})).toThrow(/CDN_BUCKET is required/);
    expect(() => resolveCdnConfig({})).toThrow(/CDN_BASE_URL is required/);
    expect(() => resolveCdnConfig({})).toThrow(/CDN_KEY_PREFIX is required/);
  });

  it('rejects a non-http base URL', () => {
    expect(() => resolveCdnConfig({ ...fullEnv, CDN_BASE_URL: 's3://nope' })).toThrow(
      /CDN_BASE_URL must be an http/
    );
  });
});
