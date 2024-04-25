/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { opensearchClientMock } from '../../../../src/core/server/opensearch/client/mocks';
import { DataSourceServiceSetup } from './data_source_service';

const dataSourceClient = opensearchClientMock.createInternalClient();
const create = () =>
  (({
    getDataSourceClient: jest.fn(() => Promise.resolve(dataSourceClient)),
    getDataSourceLegacyClient: jest.fn(),
  } as unknown) as jest.Mocked<DataSourceServiceSetup>);

export const dataSourceServiceSetupMock = { create };
