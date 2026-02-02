/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreUrlGenerator } from './url_generator';
import { hashedItemStore, getStatesFromOsdUrl } from '../../opensearch_dashboards_utils/public';
import { mockStorage } from '../../opensearch_dashboards_utils/public/storage/hashed_item_store/mock';

const appBasePath: string = 'xyz/app/explore';
const indexPatternId: string = 'c367b774-a4c2-11ea-bb37-0242ac130002';
const savedObjectId: string = '571aaf70-4c88-11e8-b3d7-01146121b73d';

interface SetupParams {
  useHash?: boolean;
}

const setup = async ({ useHash = false }: SetupParams = {}) => {
  const generator = new ExploreUrlGenerator({
    appBasePath,
    useHash,
  });

  return {
    generator,
  };
};

beforeEach(() => {
  // @ts-ignore
  hashedItemStore.storage = mockStorage;
});

describe('Explore url generator', () => {
  test('can create a link to Explore with no state and no saved object', async () => {
    const { generator } = await setup();
    const url = await generator.createUrl({});
    const { _a, _g } = getStatesFromOsdUrl(url, ['_a', '_g']);

    expect(url.startsWith(appBasePath)).toBe(true);
    expect(_a).toEqual({});
    expect(_g).toEqual({});
  });

  test('can create a link to a saved object in Explore', async () => {
    const { generator } = await setup();
    const url = await generator.createUrl({ savedObjectId });
    const { _a, _g } = getStatesFromOsdUrl(url, ['_a', '_g']);

    expect(url.startsWith(`${appBasePath}#/${savedObjectId}`)).toBe(true);
    expect(_a).toEqual({});
    expect(_g).toEqual({});
  });

  test('can specify specific index pattern', async () => {
    const { generator } = await setup();
    const url = await generator.createUrl({
      indexPatternId,
    });
    const { _a, _g } = getStatesFromOsdUrl(url, ['_a', '_g']);

    expect(_a).toEqual({
      index: indexPatternId,
    });
    expect(_g).toEqual({});
  });

  test('can specify specific time range', async () => {
    const { generator } = await setup();
    const url = await generator.createUrl({
      timeRange: { to: 'now', from: 'now-15m', mode: 'relative' },
    });
    const { _a, _g } = getStatesFromOsdUrl(url, ['_a', '_g']);

    expect(_a).toEqual({});
    expect(_g).toEqual({
      time: {
        from: 'now-15m',
        mode: 'relative',
        to: 'now',
      },
    });
  });

  test('can specify query', async () => {
    const { generator } = await setup();
    const url = await generator.createUrl({
      query: {
        language: 'kuery',
        query: 'foo',
      },
    });
    const { _a, _g } = getStatesFromOsdUrl(url, ['_a', '_g']);

    expect(_a).toEqual({
      query: {
        language: 'kuery',
        query: 'foo',
      },
    });
    expect(_g).toEqual({});
  });

  test('can set refresh interval', async () => {
    const { generator } = await setup();
    const url = await generator.createUrl({
      refreshInterval: {
        pause: false,
        value: 666,
      },
    });
    const { _a, _g } = getStatesFromOsdUrl(url, ['_a', '_g']);

    expect(_a).toEqual({});
    expect(_g).toEqual({
      refreshInterval: {
        pause: false,
        value: 666,
      },
    });
  });

  test('can set time range', async () => {
    const { generator } = await setup();
    const url = await generator.createUrl({
      timeRange: {
        from: 'now-3h',
        to: 'now',
      },
    });
    const { _a, _g } = getStatesFromOsdUrl(url, ['_a', '_g']);

    expect(_a).toEqual({});
    expect(_g).toEqual({
      time: {
        from: 'now-3h',
        to: 'now',
      },
    });
  });

  describe('useHash property', () => {
    describe('when default useHash is set to false', () => {
      test('when using default, sets index pattern ID in the generated URL', async () => {
        const { generator } = await setup();
        const url = await generator.createUrl({
          indexPatternId,
        });

        expect(url.indexOf(indexPatternId) > -1).toBe(true);
      });

      test('when enabling useHash, does not set index pattern ID in the generated URL', async () => {
        const { generator } = await setup();
        const url = await generator.createUrl({
          useHash: true,
          indexPatternId,
        });

        expect(url.indexOf(indexPatternId) > -1).toBe(false);
      });
    });

    describe('when default useHash is set to true', () => {
      test('when using default, does not set index pattern ID in the generated URL', async () => {
        const { generator } = await setup({ useHash: true });
        const url = await generator.createUrl({
          indexPatternId,
        });

        expect(url.indexOf(indexPatternId) > -1).toBe(false);
      });

      test('when disabling useHash, sets index pattern ID in the generated URL', async () => {
        const { generator } = await setup();
        const url = await generator.createUrl({
          useHash: false,
          indexPatternId,
        });

        expect(url.indexOf(indexPatternId) > -1).toBe(true);
      });
    });
  });
});
