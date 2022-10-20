/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggingSystemMock } from '../../../core/server/mocks';
import { DataSourcePluginConfigType } from '../config';
import { DataSourceService } from './data_source_service';

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
});
