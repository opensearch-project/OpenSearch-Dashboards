/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { DataSourcePluginConfigType } from '../../config';
import { parseClientOptions } from './client_config';

const TEST_DATA_SOURCE_ENDPOINT = 'http://test.com/';

const config = {
  enabled: true,
  clientPool: {
    size: 5,
  },
} as DataSourcePluginConfigType;

describe('parseClientOptions', () => {
  test('include the ssl client configs as defaults', () => {
    expect(parseClientOptions(config, TEST_DATA_SOURCE_ENDPOINT)).toEqual(
      expect.objectContaining({
        host: TEST_DATA_SOURCE_ENDPOINT,
        ssl: {
          rejectUnauthorized: true,
        },
      })
    );
  });
});
