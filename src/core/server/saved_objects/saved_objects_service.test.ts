/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  OpenSearchDashboardsMigratorMock,
  migratorInstanceMock,
  clientProviderInstanceMock,
  typeRegistryInstanceMock,
} from './saved_objects_service.test.mocks';
import { BehaviorSubject, of } from 'rxjs';
import { first } from 'rxjs/operators';
import { ByteSizeValue } from '@osd/config-schema';
import { errors as opensearchErrors } from '@opensearch-project/opensearch';

import { SavedObjectsService } from './saved_objects_service';
import { mockCoreContext } from '../core_context.mock';
import { Env } from '../config';
import { configServiceMock, savedObjectsRepositoryMock } from '../mocks';
import { opensearchServiceMock } from '../opensearch/opensearch_service.mock';
import { opensearchClientMock } from '../opensearch/client/mocks';
import { httpServiceMock } from '../http/http_service.mock';
import { httpServerMock } from '../http/http_server.mocks';
import { SavedObjectsClientFactoryProvider } from './service/lib';
import { NodesVersionCompatibility } from '../opensearch/version_check/ensure_opensearch_version';
import { SavedObjectsRepository } from './service/lib/repository';
import { SavedObjectRepositoryFactoryProvider } from './service/lib/scoped_client_provider';
import { ServiceStatusLevels } from '../status';

jest.mock('./service/lib/repository');

describe('SavedObjectsService', () => {
  const createCoreContext = ({
    skipMigration = true,
    env,
  }: { skipMigration?: boolean; env?: Env } = {}) => {
    const configService = configServiceMock.create({ atPath: { skip: true } });
    configService.atPath.mockImplementation((path) => {
      if (path === 'migrations') {
        return new BehaviorSubject({ skip: skipMigration });
      }
      return new BehaviorSubject({
        maxImportPayloadBytes: new ByteSizeValue(0),
        maxImportExportSize: new ByteSizeValue(0),
      });
    });
    return mockCoreContext.create({ configService, env });
  };

  const createSetupDeps = () => {
    const opensearchMock = opensearchServiceMock.createInternalSetup();
    return {
      http: httpServiceMock.createInternalSetupContract(),
      opensearch: opensearchMock,
    };
  };

  const createStartDeps = (pluginsInitialized: boolean = true) => {
    return {
      pluginsInitialized,
      opensearch: opensearchServiceMock.createInternalStart(),
    };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#setup()', () => {
    describe('#setClientFactoryProvider', () => {
      it('registers the factory to the clientProvider', async () => {
        const coreContext = createCoreContext();
        const soService = new SavedObjectsService(coreContext);
        const setup = await soService.setup(createSetupDeps());

        const factory = jest.fn();
        const factoryProvider: SavedObjectsClientFactoryProvider = () => factory;

        setup.setClientFactoryProvider(factoryProvider);

        await soService.start(createStartDeps());

        expect(clientProviderInstanceMock.setClientFactory).toHaveBeenCalledWith(factory);
      });
      it('throws if a factory is already registered', async () => {
        const coreContext = createCoreContext();
        const soService = new SavedObjectsService(coreContext);
        const setup = await soService.setup(createSetupDeps());

        const firstFactory = () => jest.fn();
        const secondFactory = () => jest.fn();

        setup.setClientFactoryProvider(firstFactory);

        expect(() => {
          setup.setClientFactoryProvider(secondFactory);
        }).toThrowErrorMatchingInlineSnapshot(
          `"custom client factory is already set, and can only be set once"`
        );
      });
    });

    describe('#addClientWrapper', () => {
      it('registers the wrapper to the clientProvider', async () => {
        const coreContext = createCoreContext();
        const soService = new SavedObjectsService(coreContext);
        const setup = await soService.setup(createSetupDeps());

        const wrapperA = jest.fn();
        const wrapperB = jest.fn();

        setup.addClientWrapper(1, 'A', wrapperA);
        setup.addClientWrapper(2, 'B', wrapperB);

        await soService.start(createStartDeps());

        expect(clientProviderInstanceMock.addClientWrapperFactory).toHaveBeenCalledTimes(2);
        expect(clientProviderInstanceMock.addClientWrapperFactory).toHaveBeenCalledWith(
          1,
          'A',
          wrapperA
        );
        expect(clientProviderInstanceMock.addClientWrapperFactory).toHaveBeenCalledWith(
          2,
          'B',
          wrapperB
        );
      });
    });

    describe('#registerType', () => {
      it('registers the type to the internal typeRegistry', async () => {
        const coreContext = createCoreContext();
        const soService = new SavedObjectsService(coreContext);
        const setup = await soService.setup(createSetupDeps());

        const type = {
          name: 'someType',
          hidden: false,
          namespaceType: 'single' as 'single',
          mappings: { properties: {} },
        };
        setup.registerType(type);

        expect(typeRegistryInstanceMock.registerType).toHaveBeenCalledTimes(1);
        expect(typeRegistryInstanceMock.registerType).toHaveBeenCalledWith(type);
      });
    });

    describe('#setRepositoryFactoryProvider', () => {
      it('throws error if a repository is already registered', async () => {
        const coreContext = createCoreContext();
        const soService = new SavedObjectsService(coreContext);
        const setup = await soService.setup(createSetupDeps());

        const firstRepository: SavedObjectRepositoryFactoryProvider = () =>
          savedObjectsRepositoryMock.create();
        const secondRepository: SavedObjectRepositoryFactoryProvider = () =>
          savedObjectsRepositoryMock.create();

        setup.setRepositoryFactoryProvider(firstRepository);

        expect(() => {
          setup.setRepositoryFactoryProvider(secondRepository);
        }).toThrowErrorMatchingInlineSnapshot(
          `"custom repository factory is already set, and can only be set once"`
        );
      });
    });

    describe('#setStatus', () => {
      it('throws error if custom status is already set', async () => {
        const coreContext = createCoreContext();
        const soService = new SavedObjectsService(coreContext);
        const setup = await soService.setup(createSetupDeps());

        const customStatus1$ = of({
          level: ServiceStatusLevels.available,
          summary: 'Saved Object Service is using external storage and it is up',
        });
        const customStatus2$ = of({
          level: ServiceStatusLevels.unavailable,
          summary: 'Saved Object Service is not connected to external storage and it is down',
        });

        setup.setStatus(customStatus1$);

        expect(() => {
          setup.setStatus(customStatus2$);
        }).toThrowErrorMatchingInlineSnapshot(
          `"custom saved object service status is already set, and can only be set once"`
        );
      });
    });
  });

  describe('#start()', () => {
    it('creates a OpenSearchDashboardsMigrator which retries NoLivingConnectionsError errors from OpenSearch client', async () => {
      const coreContext = createCoreContext();

      const soService = new SavedObjectsService(coreContext);
      const coreSetup = createSetupDeps();
      const coreStart = createStartDeps();

      coreStart.opensearch.client.asInternalUser.indices.create = jest
        .fn()
        .mockImplementationOnce(() =>
          Promise.reject(new opensearchErrors.NoLivingConnectionsError('reason', {} as any))
        )
        .mockImplementationOnce(() =>
          opensearchClientMock.createSuccessTransportRequestPromise('success')
        );

      await soService.setup(coreSetup);
      await soService.start(coreStart, 1);

      const response = await OpenSearchDashboardsMigratorMock.mock.calls[0][0].client.indices.create();
      return expect(response.body).toBe('success');
    });

    it('skips OpenSearchDashboardsMigrator migrations when pluginsInitialized=false', async () => {
      const coreContext = createCoreContext({ skipMigration: false });
      const soService = new SavedObjectsService(coreContext);

      await soService.setup(createSetupDeps());
      await soService.start(createStartDeps(false));
      expect(migratorInstanceMock.runMigrations).not.toHaveBeenCalled();
    });

    it('skips OpenSearchDashboardsMigrator migrations when migrations.skip=true', async () => {
      const coreContext = createCoreContext({ skipMigration: true });
      const soService = new SavedObjectsService(coreContext);
      await soService.setup(createSetupDeps());
      await soService.start(createStartDeps());
      expect(migratorInstanceMock.runMigrations).not.toHaveBeenCalled();
    });

    it('waits for all opensearch nodes to be compatible before running migrations', (done) => {
      expect.assertions(2);
      const coreContext = createCoreContext({ skipMigration: false });
      const soService = new SavedObjectsService(coreContext);
      const setupDeps = createSetupDeps();
      // Create an new subject so that we can control when isCompatible=true
      // is emitted.
      setupDeps.opensearch.opensearchNodesCompatibility$ = new BehaviorSubject({
        isCompatible: false,
        incompatibleNodes: [],
        warningNodes: [],
        opensearchDashboardsVersion: '8.0.0',
      });
      soService.setup(setupDeps).then(() => {
        soService.start(createStartDeps());
        expect(migratorInstanceMock.runMigrations).toHaveBeenCalledTimes(0);
        ((setupDeps.opensearch.opensearchNodesCompatibility$ as any) as BehaviorSubject<
          NodesVersionCompatibility
        >).next({
          isCompatible: true,
          incompatibleNodes: [],
          warningNodes: [],
          opensearchDashboardsVersion: '8.0.0',
        });
        setImmediate(() => {
          expect(migratorInstanceMock.runMigrations).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('resolves with OpenSearchDashboardsMigrator after waiting for migrations to complete', async () => {
      const coreContext = createCoreContext({ skipMigration: false });
      const soService = new SavedObjectsService(coreContext);
      await soService.setup(createSetupDeps());
      expect(migratorInstanceMock.runMigrations).toHaveBeenCalledTimes(0);

      await soService.start(createStartDeps());
      expect(migratorInstanceMock.runMigrations).toHaveBeenCalledTimes(1);
    });

    it('throws when calling setup APIs once started', async () => {
      const coreContext = createCoreContext({ skipMigration: false });
      const soService = new SavedObjectsService(coreContext);
      const setup = await soService.setup(createSetupDeps());
      await soService.start(createStartDeps());

      expect(() => {
        setup.setClientFactoryProvider(jest.fn());
      }).toThrowErrorMatchingInlineSnapshot(
        `"cannot call \`setClientFactoryProvider\` after service startup."`
      );

      expect(() => {
        setup.addClientWrapper(0, 'dummy', jest.fn());
      }).toThrowErrorMatchingInlineSnapshot(
        `"cannot call \`addClientWrapper\` after service startup."`
      );

      expect(() => {
        setup.registerType({
          name: 'someType',
          hidden: false,
          namespaceType: 'single' as 'single',
          mappings: { properties: {} },
        });
      }).toThrowErrorMatchingInlineSnapshot(
        `"cannot call \`registerType\` after service startup."`
      );

      const customRpository: SavedObjectRepositoryFactoryProvider = () =>
        savedObjectsRepositoryMock.create();

      expect(() => {
        setup.setRepositoryFactoryProvider(customRpository);
      }).toThrowErrorMatchingInlineSnapshot(
        '"cannot call `setRepositoryFactoryProvider` after service startup."'
      );

      const customStatus$ = of({
        level: ServiceStatusLevels.available,
        summary: 'Saved Object Service is using external storage and it is up',
      });

      expect(() => {
        setup.setStatus(customStatus$);
      }).toThrowErrorMatchingInlineSnapshot('"cannot call `setStatus` after service startup."');
    });

    describe('#getTypeRegistry', () => {
      it('returns the internal type registry of the service', async () => {
        const coreContext = createCoreContext({ skipMigration: false });
        const soService = new SavedObjectsService(coreContext);
        await soService.setup(createSetupDeps());
        const { getTypeRegistry } = await soService.start(createStartDeps());

        expect(getTypeRegistry()).toBe(typeRegistryInstanceMock);
      });
    });

    describe('#createScopedRepository', () => {
      it('creates a respository scoped to the user', async () => {
        const coreContext = createCoreContext({ skipMigration: false });
        const soService = new SavedObjectsService(coreContext);
        const coreSetup = createSetupDeps();
        await soService.setup(coreSetup);
        const coreStart = createStartDeps();
        const { createScopedRepository } = await soService.start(coreStart);

        const req = httpServerMock.createOpenSearchDashboardsRequest();
        createScopedRepository(req);

        expect(coreStart.opensearch.client.asScoped).toHaveBeenCalledWith(req);

        const [
          [, , , , includedHiddenTypes],
        ] = (SavedObjectsRepository.createRepository as jest.Mocked<any>).mock.calls;

        expect(includedHiddenTypes).toEqual([]);
      });

      it('creates a respository including hidden types when specified', async () => {
        const coreContext = createCoreContext({ skipMigration: false });
        const soService = new SavedObjectsService(coreContext);
        const coreSetup = createSetupDeps();
        await soService.setup(coreSetup);
        const coreStart = createStartDeps();
        const { createScopedRepository } = await soService.start(coreStart);

        const req = httpServerMock.createOpenSearchDashboardsRequest();
        createScopedRepository(req, ['someHiddenType']);

        const [
          [, , , , includedHiddenTypes],
        ] = (SavedObjectsRepository.createRepository as jest.Mocked<any>).mock.calls;

        expect(includedHiddenTypes).toEqual(['someHiddenType']);
      });
    });

    describe('#createInternalRepository', () => {
      it('creates a respository using the admin user', async () => {
        const coreContext = createCoreContext({ skipMigration: false });
        const soService = new SavedObjectsService(coreContext);
        const coreSetup = createSetupDeps();
        await soService.setup(coreSetup);
        const coreStart = createStartDeps();
        const { createInternalRepository } = await soService.start(coreStart);

        createInternalRepository();

        const [
          [, , , client, includedHiddenTypes],
        ] = (SavedObjectsRepository.createRepository as jest.Mocked<any>).mock.calls;

        expect(coreStart.opensearch.client.asInternalUser).toBe(client);
        expect(includedHiddenTypes).toEqual([]);
      });

      it('creates a respository including hidden types when specified', async () => {
        const coreContext = createCoreContext({ skipMigration: false });
        const soService = new SavedObjectsService(coreContext);
        const coreSetup = createSetupDeps();
        await soService.setup(coreSetup);
        const { createInternalRepository } = await soService.start(createStartDeps());

        createInternalRepository(['someHiddenType']);

        const [
          [, , , , includedHiddenTypes],
        ] = (SavedObjectsRepository.createRepository as jest.Mocked<any>).mock.calls;

        expect(includedHiddenTypes).toEqual(['someHiddenType']);
      });

      it('Should not create SavedObjectsRepository when custom repository is registered ', async () => {
        const coreContext = createCoreContext({ skipMigration: false });
        const soService = new SavedObjectsService(coreContext);
        const coreSetup = createSetupDeps();
        const setup = await soService.setup(coreSetup);

        const customRpository: SavedObjectRepositoryFactoryProvider = () =>
          savedObjectsRepositoryMock.create();
        setup.setRepositoryFactoryProvider(customRpository);

        const coreStart = createStartDeps();
        const { createInternalRepository } = await soService.start(coreStart);
        createInternalRepository();

        expect(SavedObjectsRepository.createRepository as jest.Mocked<any>).not.toHaveBeenCalled();
      });

      it('Should create SavedObjectsRepository when no custom repository is registered ', async () => {
        const coreContext = createCoreContext({ skipMigration: false });
        const soService = new SavedObjectsService(coreContext);
        const coreSetup = createSetupDeps();
        await soService.setup(coreSetup);

        const coreStart = createStartDeps();
        const { createInternalRepository } = await soService.start(coreStart);
        createInternalRepository();

        expect(SavedObjectsRepository.createRepository as jest.Mocked<any>).toHaveBeenCalled();
      });
    });

    describe('#savedObjectServiceStatus', () => {
      it('Saved objects service status should be custom when set using setStatus', async () => {
        const coreContext = createCoreContext({});
        const soService = new SavedObjectsService(coreContext);
        const coreSetup = createSetupDeps();
        const setup = await soService.setup(coreSetup);

        const customStatus$ = of({
          level: ServiceStatusLevels.available,
          summary: 'Saved Object Service is using external storage and it is up',
        });
        setup.setStatus(customStatus$);
        const coreStart = createStartDeps();
        await soService.start(coreStart);
        expect(await setup.status$.pipe(first()).toPromise()).toMatchObject({
          level: ServiceStatusLevels.available,
          summary: 'Saved Object Service is using external storage and it is up',
        });
      });

      it('Saved objects service should be default when custom status is not set', async () => {
        const coreContext = createCoreContext({});
        const soService = new SavedObjectsService(coreContext);
        const coreSetup = createSetupDeps();
        const setup = await soService.setup(coreSetup);
        const coreStart = createStartDeps();
        await soService.start(coreStart);
        expect(await setup.status$.pipe(first()).toPromise()).toMatchObject({
          level: ServiceStatusLevels.available,
          summary: 'SavedObjects service has completed migrations and is available',
        });
      });
    });
  });
});
