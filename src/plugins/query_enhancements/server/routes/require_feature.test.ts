/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggingSystemMock } from '../../../../core/server/mocks';
import { FEATURE_DISABLED_MESSAGE, requireFeature } from './require_feature';

const createContext = (getConfig: jest.Mock, requestStore?: Map<string, any>) =>
  ({
    core: {
      dynamicConfig: {
        client: { getConfig },
        createStoreFromRequest: jest.fn(() => requestStore),
        // A different store, so a lookup through the ambient one is detectable.
        asyncLocalStore: new Map([['ambient', true]]),
      },
    },
  }) as any;

const createResponse = () => ({
  ok: jest.fn((v) => v),
  forbidden: jest.fn((v) => v),
});

describe('requireFeature', () => {
  let logger: any;

  beforeEach(() => {
    logger = loggingSystemMock.create().get();
  });

  it('runs the handler when the feature is enabled', async () => {
    const handler = jest.fn().mockResolvedValue('handled');
    const getConfig = jest.fn().mockResolvedValue({ ppl: { streaming: { enabled: true } } });
    const context = createContext(getConfig);
    const request = {} as any;
    const response = createResponse();

    await expect(
      requireFeature('pplStreaming', logger, handler)(context, request, response as any)
    ).resolves.toBe('handled');
    expect(handler).toHaveBeenCalledWith(context, request, response);
    expect(response.forbidden).not.toHaveBeenCalled();
  });

  it('rejects with a stable body when the feature is disabled', async () => {
    const handler = jest.fn();
    const getConfig = jest.fn().mockResolvedValue({ ppl: { streaming: { enabled: false } } });
    const response = createResponse();

    await requireFeature('pplStreaming', logger, handler)(
      createContext(getConfig),
      {} as any,
      response as any
    );

    expect(handler).not.toHaveBeenCalled();
    expect(response.forbidden).toHaveBeenCalledWith({ body: FEATURE_DISABLED_MESSAGE });
  });

  // The flag is resolved per request, not at registration, so a runtime change stops polls for a
  // job that is already in flight.
  it('stops serving once the flag is turned off mid-flight', async () => {
    const handler = jest.fn().mockResolvedValue('handled');
    const getConfig = jest
      .fn()
      .mockResolvedValueOnce({ ppl: { streaming: { enabled: true } } })
      .mockResolvedValueOnce({ ppl: { streaming: { enabled: false } } });
    const guarded = requireFeature('pplStreaming', logger, handler);
    const context = createContext(getConfig);

    const first = createResponse();
    await guarded(context, {} as any, first as any);
    expect(handler).toHaveBeenCalledTimes(1);

    const second = createResponse();
    await guarded(context, {} as any, second as any);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(second.forbidden).toHaveBeenCalledWith({ body: FEATURE_DISABLED_MESSAGE });
  });

  it('denies rather than allows when the flag cannot be resolved', async () => {
    const handler = jest.fn();
    const getConfig = jest.fn().mockRejectedValue(new Error('config store down'));
    const response = createResponse();

    await requireFeature('pplStreaming', logger, handler)(
      createContext(getConfig),
      {} as any,
      response as any
    );

    expect(handler).not.toHaveBeenCalled();
    expect(response.forbidden).toHaveBeenCalledWith({ body: FEATURE_DISABLED_MESSAGE });
    expect(logger.error).toHaveBeenCalled();
  });

  it('resolves the flag with a store built from the request', async () => {
    const getConfig = jest.fn().mockResolvedValue({ ppl: { streaming: { enabled: true } } });
    const store = new Map<string, any>([['request', 'x']]);
    const context = createContext(getConfig, store);
    const request = { headers: {} } as any;

    await requireFeature('pplStreaming', logger, jest.fn())(
      context,
      request,
      createResponse() as any
    );

    expect(context.core.dynamicConfig.createStoreFromRequest).toHaveBeenCalledWith(request);
    expect(getConfig).toHaveBeenCalledWith(expect.anything(), {
      asyncLocalStorageContext: store,
    });
  });

  it('omits the store when the request yields none', async () => {
    const getConfig = jest.fn().mockResolvedValue({ ppl: { streaming: { enabled: true } } });

    await requireFeature('pplStreaming', logger, jest.fn())(
      createContext(getConfig),
      {} as any,
      createResponse() as any
    );

    expect(getConfig).toHaveBeenCalledWith(expect.anything(), undefined);
  });
});
