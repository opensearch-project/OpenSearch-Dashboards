/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configSchema } from '../../common/config';
import { QUERY_ENHANCEMENTS_FEATURES } from '../../common/feature_flags';
import {
  defaultFeatureFlags,
  isFeatureEnabled,
  readFeatureFlags,
  resolveFeatureFlags,
} from './feature_flags';

const clientReturning = (config: unknown) => ({ getConfig: jest.fn().mockResolvedValue(config) });

describe('defaultFeatureFlags', () => {
  it('turns every registered feature off', () => {
    const flags = defaultFeatureFlags();
    expect(Object.keys(flags).sort()).toEqual([...QUERY_ENHANCEMENTS_FEATURES].sort());
    expect(Object.values(flags).every((value) => value === false)).toBe(true);
  });
});

describe('the yml schema', () => {
  it('defaults every feature off, so streaming is opt-in', () => {
    const config = configSchema.validate({});
    expect(config.ppl.streaming.enabled).toBe(false);
    expect(config.ppl.lint.enabled).toBe(false);
  });

  it('rejects a non-boolean in yml, which is schema-validated', () => {
    expect(() => configSchema.validate({ ppl: { streaming: { enabled: 'yes' } } })).toThrow();
  });

  it('resolves the schema defaults to every flag off', () => {
    expect(resolveFeatureFlags(configSchema.validate({}))).toEqual(defaultFeatureFlags());
  });
});

describe('resolveFeatureFlags', () => {
  it('reads each feature from its own config path', () => {
    expect(
      resolveFeatureFlags({ ppl: { lint: { enabled: false }, streaming: { enabled: true } } })
    ).toEqual({ pplLint: false, pplStreaming: true });
  });

  // Dynamic config writes are not schema-validated, so a stored value can be any shape. The string
  // 'false' is truthy, which would otherwise turn the feature on.
  it.each([['false'], [1], [undefined]])('treats the non-boolean %p as off', (stored) => {
    expect(resolveFeatureFlags({ ppl: { streaming: { enabled: stored } } }).pplStreaming).toBe(
      false
    );
  });

  it.each([
    [{}],
    [{ ppl: {} }],
    [{ ppl: { streaming: {} } }],
    [undefined],
    [null],
    ['not an object'],
  ])('treats the missing or malformed config %p as off', (config) => {
    expect(resolveFeatureFlags(config).pplStreaming).toBe(false);
  });
});

describe('readFeatureFlags', () => {
  it('asks for the config by pluginConfigPath, which is not snake-cased', async () => {
    const client = clientReturning({ ppl: { streaming: { enabled: true } } });

    await readFeatureFlags(client);

    expect(client.getConfig).toHaveBeenCalledWith(
      { pluginConfigPath: ['queryEnhancements'] },
      undefined
    );
  });

  it('passes the async local store through when there is one', async () => {
    const client = clientReturning({});
    const store = new Map<string, any>([['request', 'x']]);

    await readFeatureFlags(client, store);

    expect(client.getConfig).toHaveBeenCalledWith(expect.anything(), {
      asyncLocalStorageContext: store,
    });
  });

  it('reports the dynamic override', async () => {
    const flags = await readFeatureFlags(
      clientReturning({ ppl: { streaming: { enabled: true } } })
    );
    expect(flags.pplStreaming).toBe(true);
  });

  it('propagates a resolution failure so the caller decides how to fail', async () => {
    const client = { getConfig: jest.fn().mockRejectedValue(new Error('config store down')) };
    await expect(readFeatureFlags(client)).rejects.toThrow('config store down');
  });
});

describe('isFeatureEnabled', () => {
  it('reports a single feature', async () => {
    const client = clientReturning({ ppl: { lint: { enabled: true }, streaming: {} } });
    await expect(isFeatureEnabled(client, 'pplLint')).resolves.toBe(true);
    await expect(isFeatureEnabled(client, 'pplStreaming')).resolves.toBe(false);
  });
});
