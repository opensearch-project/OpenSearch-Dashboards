/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock, httpServerMock, savedObjectsRepositoryMock } from '../../../core/server/mocks';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../common';
import { DataSourcePlugin } from './plugin';

describe('DataSourcePlugin', () => {
  const createRouteContext = async () => {
    const initializerContext = coreMock.createPluginInitializerContext();
    const plugin = new DataSourcePlugin(initializerContext);
    const coreStart = coreMock.createStart();
    const request = httpServerMock.createOpenSearchDashboardsRequest();
    const scopedRepository = savedObjectsRepositoryMock.create();
    const dataSourceService = {
      getDataSourceClient: jest.fn().mockResolvedValue({}),
      getDataSourceLegacyClient: jest.fn().mockReturnValue({ callAPI: jest.fn() }),
    };
    const auditor = { add: jest.fn() };

    coreStart.savedObjects.createScopedRepository.mockReturnValue(scopedRepository);
    plugin.start(coreStart);

    const contextProvider = (plugin as any).createDataSourceRouteHandlerContext(
      dataSourceService,
      {},
      initializerContext.logger.get(),
      Promise.resolve({ asScoped: jest.fn().mockReturnValue(auditor) }),
      Promise.resolve({}),
      Promise.resolve({})
    );
    const routeContext = await contextProvider(coreMock.createRequestHandlerContext(), request);

    return { coreStart, dataSourceService, request, routeContext, scopedRepository };
  };

  it('uses a request-scoped raw repository for modern data source clients', async () => {
    const { coreStart, dataSourceService, request, routeContext, scopedRepository } =
      await createRouteContext();

    await routeContext.opensearch.getClient('data-source-id');

    expect(coreStart.savedObjects.createScopedRepository).toHaveBeenCalledWith(request, [
      DATA_SOURCE_SAVED_OBJECT_TYPE,
    ]);
    expect(dataSourceService.getDataSourceClient).toHaveBeenCalledWith(
      expect.objectContaining({ internalSavedObjects: scopedRepository, request })
    );
  });

  it('uses a request-scoped raw repository for legacy data source clients', async () => {
    const { coreStart, dataSourceService, request, routeContext, scopedRepository } =
      await createRouteContext();

    routeContext.opensearch.legacy.getClient('data-source-id');

    expect(coreStart.savedObjects.createScopedRepository).toHaveBeenCalledWith(request, [
      DATA_SOURCE_SAVED_OBJECT_TYPE,
    ]);
    expect(dataSourceService.getDataSourceLegacyClient).toHaveBeenCalledWith(
      expect.objectContaining({ internalSavedObjects: scopedRepository, request })
    );
  });
});
