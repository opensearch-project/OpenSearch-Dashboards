/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { duration } from 'moment';
import { Transport } from '@opensearch-project/opensearch';
import { loggingSystemMock } from '../../../core/server/mocks';
import { DataSourcePluginConfigType } from '../config';
import { DataSourceService } from './data_source_service';
import { configureClient } from './client/configure_client';
import { DataSourceClientParams } from './types';

jest.mock('./client/configure_client');

const configureClientMock = configureClient as jest.Mock;

const logger = loggingSystemMock.create();

describe('Data Source Service', () => {
  let service: DataSourceService;
  let config: DataSourcePluginConfigType;

  beforeEach(() => {
    const mockLogger = logger.get('dataSource');
    service = new DataSourceService(mockLogger);
    config = {
      enabled: true,
      clientPool: {
        size: 5,
      },
      globalOpenSearchConfig: {
        requestTimeout: duration(100, 'seconds'),
        pingTimeout: duration(10, 'seconds'),
      },
    } as DataSourcePluginConfigType;
  });

  afterEach(() => {
    service.stop();
    jest.clearAllMocks();
  });

  describe('setup()', () => {
    test('exposes proper contract', async () => {
      const setup = await service.setup(config);
      expect(setup).toHaveProperty('getDataSourceClient');
      expect(setup).toHaveProperty('getDataSourceLegacyClient');
    });
  });

  describe('setCustomTransport()', () => {
    const clientParams = ({
      dataSourceId: 'test-data-source-id',
    } as unknown) as DataSourceClientParams;

    test('forwards the registered custom Transport to configureClient', async () => {
      class FakeTransport {}
      const fakeTransport = (FakeTransport as unknown) as typeof Transport;

      const { getDataSourceClient } = await service.setup(config);
      service.setCustomTransport(fakeTransport);

      await getDataSourceClient(clientParams);

      expect(configureClientMock).toHaveBeenCalledWith(
        expect.objectContaining({ customTransport: fakeTransport }),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    test('forwards undefined customTransport when no Transport is registered', async () => {
      const { getDataSourceClient } = await service.setup(config);

      await getDataSourceClient(clientParams);

      expect(configureClientMock).toHaveBeenCalledWith(
        expect.objectContaining({ customTransport: undefined }),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });
  });
});
