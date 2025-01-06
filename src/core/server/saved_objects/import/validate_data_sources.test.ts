/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsImportError } from '../types';
import { validateDataSources } from './validate_data_sources';
import { savedObjectsClientMock } from '../service/saved_objects_client.mock';
import * as utilsImports from './utils';
import * as utilsExport from '../export/inject_nested_depdendencies';

describe('validateDataSources', () => {
  const savedObjectsClient = savedObjectsClientMock.create();
  const workspaces = ['workspace-1'];
  const response = {
    total: 1,
    saved_objects: [
      {
        id: 'data-source-1',
        type: 'data-source',
        attributes: {},
        score: 1,
        references: [],
      },
    ],
    per_page: 1,
    page: 0,
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns empty array if no valid objects', async () => {
    const errorAccumulator: SavedObjectsImportError[] = [
      {
        id: '1',
        type: 'dashboards',
        meta: {},
        error: { type: 'missing_references', references: [] },
      },
    ];
    const savedObjects = [{ id: '1', type: 'dashboards', attributes: {}, references: [] }];
    const result = await validateDataSources(
      savedObjects,
      savedObjectsClient,
      errorAccumulator,
      workspaces
    );
    expect(result).toEqual([]);
  });

  it('validates data sources within the target workspace', async () => {
    savedObjectsClient.find.mockResolvedValueOnce(response);

    jest.spyOn(utilsImports, 'findReferenceDataSourceForObject').mockReturnValueOnce(
      new Set<string>(['data-source-1'])
    );

    const savedObjects = [{ id: '1', type: 'dashboards', attributes: {}, references: [] }];

    const result = await validateDataSources(savedObjects, savedObjectsClient, [], workspaces);
    expect(result).toEqual([]);
    expect(savedObjectsClient.find).toHaveBeenCalled();
  });

  it('accumulates missing data source errors', async () => {
    savedObjectsClient.find.mockResolvedValueOnce(response);

    jest.spyOn(utilsImports, 'findReferenceDataSourceForObject').mockReturnValueOnce(
      new Set<string>(['data-source-2'])
    );

    const savedObjects = [
      { id: '1', type: 'dashboards', attributes: { title: 'dashboards' }, references: [] },
    ];
    const result = await validateDataSources(savedObjects, savedObjectsClient, [], workspaces);

    expect(result).toEqual([
      {
        error: {
          dataSource: 'data-source-2',
          type: 'missing_data_source',
        },
        id: '1',
        meta: {
          title: 'dashboards',
        },
        title: 'dashboards',
        type: 'dashboards',
      },
    ]);
  });

  it('accumulates missing data source errors with data source title', async () => {
    // Get target workspace data source
    savedObjectsClient.find.mockResolvedValueOnce(response);

    // Mock source workspace data source
    jest.spyOn(utilsImports, 'findReferenceDataSourceForObject').mockReturnValueOnce(
      new Set<string>(['data-source-2'])
    );

    const savedObject = {
      id: '1',
      type: 'dashboards',
      attributes: { title: 'dashboards' },
      references: [],
    };

    jest.spyOn(utilsExport, 'fetchNestedDependencies').mockResolvedValueOnce({
      missingRefs: [],
      objects: [
        {
          id: 'data-source-2',
          type: 'data-source',
          attributes: { title: 'dataSource2' },
          references: [],
        },
        savedObject,
      ],
    });

    const savedObjects = [savedObject];
    const result = await validateDataSources(savedObjects, savedObjectsClient, [], workspaces);

    expect(result).toEqual([
      {
        error: {
          dataSource: 'dataSource2',
          type: 'missing_data_source',
        },
        id: '1',
        meta: {
          title: 'dashboards',
        },
        title: 'dashboards',
        type: 'dashboards',
      },
    ]);
  });
});
