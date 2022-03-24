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
import { take } from 'rxjs/operators';

import { opensearchClientMock } from '../../../opensearch/client/mocks';
import {
  OpenSearchDashboardsMigratorOptions,
  OpenSearchDashboardsMigrator,
} from './opensearch_dashboards_migrator';
import { loggingSystemMock } from '../../../logging/logging_system.mock';
import { SavedObjectTypeRegistry } from '../../saved_objects_type_registry';
import { SavedObjectsType } from '../../types';

const createRegistry = (types: Array<Partial<SavedObjectsType>>) => {
  const registry = new SavedObjectTypeRegistry();
  types.forEach((type) =>
    registry.registerType({
      name: 'unknown',
      hidden: false,
      namespaceType: 'single',
      mappings: { properties: {} },
      migrations: {},
      ...type,
    })
  );
  return registry;
};

describe('OpenSearchDashboardsMigrator', () => {
  describe('getActiveMappings', () => {
    it('returns full index mappings w/ core properties', () => {
      const options = mockOptions();
      options.typeRegistry = createRegistry([
        {
          name: 'amap',
          mappings: {
            properties: { field: { type: 'text' } },
          },
        },
        {
          name: 'bmap',
          indexPattern: 'other-index',
          mappings: {
            properties: { field: { type: 'text' } },
          },
        },
      ]);

      const mappings = new OpenSearchDashboardsMigrator(options).getActiveMappings();
      expect(mappings).toMatchSnapshot();
    });
  });

  describe('runMigrations', () => {
    it('only runs migrations once if called multiple times', async () => {
      const options = mockOptions();

      options.client.cat.templates.mockReturnValue(
        opensearchClientMock.createSuccessTransportRequestPromise(
          // @ts-expect-error assign the type to CatTemplatesResponse for test purpose
          { templates: [] } as CatTemplatesResponse,
          { statusCode: 404 }
        )
      );
      options.client.indices.get.mockReturnValue(
        opensearchClientMock.createSuccessTransportRequestPromise({}, { statusCode: 404 })
      );
      options.client.indices.getAlias.mockReturnValue(
        opensearchClientMock.createSuccessTransportRequestPromise({}, { statusCode: 404 })
      );

      const migrator = new OpenSearchDashboardsMigrator(options);

      await migrator.runMigrations();
      await migrator.runMigrations();

      expect(options.client.cat.templates).toHaveBeenCalledTimes(1);
    });

    it('emits results on getMigratorResult$()', async () => {
      const options = mockOptions();

      options.client.cat.templates.mockReturnValue(
        opensearchClientMock.createSuccessTransportRequestPromise(
          // @ts-expect-error assign the type to CatTemplatesResponse for test purpose
          { templates: [] } as CatTemplatesResponse,
          { statusCode: 404 }
        )
      );
      options.client.indices.get.mockReturnValue(
        opensearchClientMock.createSuccessTransportRequestPromise({}, { statusCode: 404 })
      );
      options.client.indices.getAlias.mockReturnValue(
        opensearchClientMock.createSuccessTransportRequestPromise({}, { statusCode: 404 })
      );

      const migrator = new OpenSearchDashboardsMigrator(options);
      const migratorStatus = migrator.getStatus$().pipe(take(3)).toPromise();
      await migrator.runMigrations();
      const { status, result } = await migratorStatus;
      expect(status).toEqual('completed');
      expect(result![0]).toMatchObject({
        destIndex: '.my-index_1',
        elapsedMs: expect.any(Number),
        sourceIndex: '.my-index',
        status: 'migrated',
      });
      expect(result![1]).toMatchObject({
        destIndex: 'other-index_1',
        elapsedMs: expect.any(Number),
        sourceIndex: 'other-index',
        status: 'migrated',
      });
    });
  });
});

type MockedOptions = OpenSearchDashboardsMigratorOptions & {
  client: ReturnType<typeof opensearchClientMock.createOpenSearchClient>;
};

const mockOptions = () => {
  const options: MockedOptions = {
    logger: loggingSystemMock.create().get(),
    opensearchDashboardsVersion: '8.2.3',
    typeRegistry: createRegistry([
      {
        name: 'testtype',
        hidden: false,
        namespaceType: 'single',
        mappings: {
          properties: {
            name: { type: 'keyword' },
          },
        },
        migrations: {},
      },
      {
        name: 'testtype2',
        hidden: false,
        namespaceType: 'single',
        indexPattern: 'other-index',
        mappings: {
          properties: {
            name: { type: 'keyword' },
          },
        },
        migrations: {},
      },
    ]),
    opensearchDashboardsConfig: {
      enabled: true,
      index: '.my-index',
    } as OpenSearchDashboardsMigratorOptions['opensearchDashboardsConfig'],
    savedObjectsConfig: {
      batchSize: 20,
      pollInterval: 20000,
      scrollDuration: '10m',
      skip: false,
    },
    client: opensearchClientMock.createOpenSearchClient(),
  };
  return options;
};
