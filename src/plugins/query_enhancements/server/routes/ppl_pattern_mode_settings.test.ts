/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggingSystemMock } from '../../../../core/server/mocks';
import { DATASOURCE_UNAVAILABLE_MESSAGE } from '.';
import { definePPLPatternModeSettingsRoute } from './ppl_pattern_mode_settings';

// The escaped dots are required: flat_settings keeps the key as a literal dotted string, and
// filter_path would otherwise read '.' as nesting and return an empty body.
const EXPECTED_PATH =
  '/_cluster/settings?flat_settings=true&include_defaults=true' +
  '&filter_path=*.plugins\\.ppl\\.pattern\\.mode';

describe('definePPLPatternModeSettingsRoute', () => {
  const createResponse = () => ({
    ok: jest.fn((v) => v),
    custom: jest.fn((v) => v),
  });

  const captureHandler = () => {
    let handler: any;
    const router = {
      get: jest.fn((_, h) => {
        handler = h;
      }),
    } as any;
    const logger = loggingSystemMock.create().get();
    definePPLPatternModeSettingsRoute(logger, router);
    return { handler: () => handler, router, logger };
  };

  const coreContext = (request: jest.Mock) =>
    ({
      core: { opensearch: { client: { asCurrentUser: { transport: { request } } } } },
    }) as any;

  it('registers a GET route that requires authentication (no authRequired override)', () => {
    const { router } = captureHandler();
    const [config] = router.get.mock.calls[0];
    expect(config.path).toBe('/api/enhancements/ppl/pattern_mode_settings');
    expect(config.options?.authRequired).toBeUndefined();
  });

  it('reads the setting as the current user when no dataSourceId is provided', async () => {
    const { handler } = captureHandler();
    const request = jest
      .fn()
      .mockResolvedValue({ body: { defaults: { 'plugins.ppl.pattern.mode': 'LABEL' } } });
    const res = createResponse();

    await handler()(coreContext(request), { query: {} } as any, res);

    expect(request).toHaveBeenCalledWith({ method: 'GET', path: EXPECTED_PATH });
    expect(res.ok).toHaveBeenCalledWith({
      body: { patternMode: 'label', patternModeMeasured: true },
    });
  });

  it('uses the data source client when a dataSourceId is provided', async () => {
    const { handler } = captureHandler();
    const dsRequest = jest
      .fn()
      .mockResolvedValue({ body: { defaults: { 'plugins.ppl.pattern.mode': 'AGGREGATION' } } });
    const coreRequest = jest.fn();
    const getClient = jest.fn().mockResolvedValue({ transport: { request: dsRequest } });
    const context = {
      ...coreContext(coreRequest),
      dataSource: { opensearch: { getClient } },
    } as any;
    const res = createResponse();

    await handler()(context, { query: { dataSourceId: 'ds-1' } } as any, res);

    expect(getClient).toHaveBeenCalledWith('ds-1');
    expect(dsRequest).toHaveBeenCalledWith({ method: 'GET', path: EXPECTED_PATH });
    expect(coreRequest).not.toHaveBeenCalled();
    expect(res.ok).toHaveBeenCalledWith({
      body: { patternMode: 'aggregation', patternModeMeasured: true },
    });
  });

  it('honors transient over persistent over defaults precedence', async () => {
    const { handler } = captureHandler();
    const res = createResponse();
    const request = jest.fn().mockResolvedValue({
      body: {
        transient: { 'plugins.ppl.pattern.mode': 'AGGREGATION' },
        persistent: { 'plugins.ppl.pattern.mode': 'LABEL' },
        defaults: { 'plugins.ppl.pattern.mode': 'LABEL' },
      },
    });

    await handler()(coreContext(request), { query: {} } as any, res);
    expect(res.ok).toHaveBeenLastCalledWith({
      body: { patternMode: 'aggregation', patternModeMeasured: true },
    });

    request.mockResolvedValue({
      body: {
        persistent: { 'plugins.ppl.pattern.mode': 'AGGREGATION' },
        defaults: { 'plugins.ppl.pattern.mode': 'LABEL' },
      },
    });
    await handler()(coreContext(request), { query: {} } as any, res);
    expect(res.ok).toHaveBeenLastCalledWith({
      body: { patternMode: 'aggregation', patternModeMeasured: true },
    });
  });

  it.each([
    ['the setting is absent (no SQL plugin)', {}],
    ['the value is unrecognized', { defaults: { 'plugins.ppl.pattern.mode': 'SOMETHING' } }],
  ])('reports the engine default as unmeasured when %s', async (_, body) => {
    const { handler } = captureHandler();
    const res = createResponse();

    await handler()(coreContext(jest.fn().mockResolvedValue({ body })), { query: {} } as any, res);

    expect(res.ok).toHaveBeenCalledWith({
      body: { patternMode: 'label', patternModeMeasured: false },
    });
  });

  it('returns 400 when a dataSourceId is provided but the data source plugin is unavailable', async () => {
    const { handler } = captureHandler();
    const res = createResponse();

    await handler()(coreContext(jest.fn()), { query: { dataSourceId: 'ds-1' } } as any, res);

    expect(res.custom).toHaveBeenCalledWith({
      statusCode: 400,
      body: DATASOURCE_UNAVAILABLE_MESSAGE,
    });
  });

  it('fails open as unmeasured and warns when the read is forbidden', async () => {
    const { handler, logger } = captureHandler();
    const res = createResponse();
    const error = Object.assign(new Error('no permissions'), { meta: { statusCode: 403 } });

    await handler()(coreContext(jest.fn().mockRejectedValue(error)), { query: {} } as any, res);

    expect(res.ok).toHaveBeenCalledWith({
      body: { patternMode: 'label', patternModeMeasured: false },
    });
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('403'));
  });

  it('fails open as unmeasured and logs at debug for other errors', async () => {
    const { handler, logger } = captureHandler();
    const res = createResponse();

    await handler()(
      coreContext(jest.fn().mockRejectedValue(new Error('connection refused'))),
      { query: {} } as any,
      res
    );

    expect(res.ok).toHaveBeenCalledWith({
      body: { patternMode: 'label', patternModeMeasured: false },
    });
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('connection refused'));
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
