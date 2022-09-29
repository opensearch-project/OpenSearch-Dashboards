/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggingSystemMock } from '../../../../core/server/mocks';
import { DataSourcePluginConfigType } from '../../config';
import { OpenSearchClientPool } from './client_pool';

const logger = loggingSystemMock.create();

describe('Client Pool', () => {
  let service: OpenSearchClientPool;
  let config: DataSourcePluginConfigType;

  beforeEach(() => {
    const mockLogger = logger.get('dataSource');
    service = new OpenSearchClientPool(mockLogger);
    config = {
      enabled: true,
      clientPool: {
        size: 5,
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
      expect(setup).toHaveProperty('getClientFromPool');
      expect(setup).toHaveProperty('addClientToPool');
    });
  });
});
