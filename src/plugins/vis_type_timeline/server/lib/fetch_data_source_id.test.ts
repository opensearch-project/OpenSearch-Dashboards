/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { savedObjectsClientMock } from '../../../../core/server/mocks';
import { fetchDataSourceIdByName } from './fetch_data_source_id';
import { OpenSearchFunctionConfig } from '../types';

jest.mock('./services', () => ({
  getDataSourceEnabled: jest
    .fn()
    .mockReturnValueOnce({ enabled: false })
    .mockReturnValue({ enabled: true }),
}));

describe('fetchDataSourceIdByName()', () => {
  const validId = 'some-valid-id';
  const config: OpenSearchFunctionConfig = {
    q: null,
    metric: null,
    split: null,
    index: null,
    timefield: null,
    kibana: null,
    opensearchDashboards: null,
    interval: null,
  };
  const client = savedObjectsClientMock.create();
  client.find = jest.fn().mockImplementation((props) => {
    if (props.search === '"No Results With Filter"') {
      return Promise.resolve({
        saved_objects: [
          {
            id: 'some-non-matching-id',
            attributes: {
              title: 'No Results With Filter Some Suffix',
            },
          },
        ],
      });
    }
    if (props.search === '"Duplicate Title"') {
      return Promise.resolve({
        saved_objects: [
          {
            id: 'duplicate-id-1',
            attributes: {
              title: 'Duplicate Title',
            },
          },
          {
            id: 'duplicate-id-2',
            attributes: {
              title: 'Duplicate Title',
            },
          },
        ],
      });
    }
    if (props.search === '"Some Data Source"') {
      return Promise.resolve({
        saved_objects: [
          {
            id: validId,
            attributes: {
              title: 'Some Data Source',
            },
          },
        ],
      });
    }
    if (props.search === '"Some Prefix"') {
      return Promise.resolve({
        saved_objects: [
          {
            id: 'some-id-2',
            attributes: {
              title: 'Some Prefix B',
            },
          },
          {
            id: validId,
            attributes: {
              title: 'Some Prefix',
            },
          },
        ],
      });
    }

    return Promise.resolve({ saved_objects: [] });
  });

  it('should return undefined if data_source_name is not present', async () => {
    expect(await fetchDataSourceIdByName(config, client)).toBe(undefined);
  });

  it('should return undefined if data_source_name is an empty string', async () => {
    expect(await fetchDataSourceIdByName({ ...config, data_source_name: '' }, client)).toBe(
      undefined
    );
  });

  it('should throw errors when MDS is disabled', async () => {
    await expect(
      fetchDataSourceIdByName({ ...config, data_source_name: 'Some Data Source' }, client)
    ).rejects.toThrowError(
      'data_source_name is not supported. Contact your administrator to start using multiple data sources'
    );
  });

  it.each([
    {
      dataSourceName: 'Non-existent Data Source',
      expectedResultCount: 0,
    },
    {
      dataSourceName: 'No Results With Filter',
      expectedResultCount: 0,
    },
    {
      dataSourceName: 'Duplicate Title',
      expectedResultCount: 2,
    },
  ])(
    'should throw errors when non-existent or duplicate data_source_name is provided',
    async ({ dataSourceName, expectedResultCount }) => {
      await expect(
        fetchDataSourceIdByName({ ...config, data_source_name: dataSourceName }, client)
      ).rejects.toThrowError(
        `Expected exactly 1 result for data_source_name "${dataSourceName}" but got ${expectedResultCount} results`
      );
    }
  );

  it.each([
    {
      dataSourceName: 'Some Data Source',
    },
    {
      dataSourceName: 'Some Prefix',
    },
  ])(
    'should return valid id when data_source_name exists and is unique',
    async ({ dataSourceName }) => {
      expect(
        await fetchDataSourceIdByName({ ...config, data_source_name: dataSourceName }, client)
      ).toBe(validId);
    }
  );
});
