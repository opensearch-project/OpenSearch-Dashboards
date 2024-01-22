/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { throwError } from 'rxjs';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { AuthType } from './types';
import { coreMock } from '../../../core/public/mocks';

/* Mock Types */

export const docLinks = {
  links: {
    noDocumentation: {
      indexPatterns: {
        introduction: '',
      },
      scriptedFields: {},
    },
  },
};

const createDataSourceManagementContext = () => {
  const {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
  } = coreMock.createStart();
  const { http } = coreMock.createSetup();

  return {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
    http,
    docLinks,
    setBreadcrumbs: () => {},
  };
};

export const mockManagementPlugin = {
  createDataSourceManagementContext,
  docLinks,
};

/* Mock data responses - JSON*/
export const getDataSourcesResponse = {
  savedObjects: [
    {
      id: 'test',
      type: 'data-source',
      description: 'test datasource',
      title: 'test',
      get(field: string) {
        const me: any = this || {};
        return me[field];
      },
    },
    {
      id: 'test2',
      type: 'data-source',
      description: 'test datasource2',
      title: 'test',
      get(field: string) {
        const me: any = this || {};
        return me[field];
      },
    },
    {
      id: 'alpha-test',
      type: 'data-source',
      description: 'alpha test datasource',
      title: 'alpha-test',
      get(field: string) {
        const me: any = this || {};
        return me[field];
      },
    },
    {
      id: 'beta-test',
      type: 'data-source',
      description: 'beta test datasource',
      title: 'beta-test',
      get(field: string) {
        const me: any = this || {};
        return me[field];
      },
    },
  ],
};

export const existingDatasourceNamesList = [
  'test123',
  'testTest20',
  'TeSt',
  'duplicateTest',
  'dup20',
];

export const getMappedDataSources = [
  {
    id: 'test',
    description: 'test datasource',
    title: 'test',
    sort: 'test',
  },
  {
    id: 'test2',
    description: 'test datasource2',
    title: 'test',
    sort: 'test',
  },
  {
    id: 'alpha-test',
    description: 'alpha test datasource',
    title: 'alpha-test',
    sort: 'alpha-test',
  },
  {
    id: 'beta-test',
    description: 'beta test datasource',
    title: 'beta-test',
    sort: 'beta-test',
  },
];

export const mockDataSourceAttributesWithAuth = {
  id: 'test',
  title: 'create-test-ds',
  description: 'jest testing',
  endpoint: 'https://test.com',
  auth: {
    type: AuthType.UsernamePasswordType,
    credentials: {
      username: 'test123',
      password: 'test123',
    },
  },
};

export const mockDataSourceAttributesWithNoAuth = {
  id: 'test123',
  title: 'create-test-ds123',
  description: 'jest testing',
  endpoint: 'https://test.com',
  auth: {
    type: AuthType.NoAuth,
    credentials: undefined,
  },
};
export const getDataSourceByIdWithCredential = {
  attributes: {
    id: 'alpha-test',
    title: 'alpha-test',
    endpoint: 'https://test.com',
    description: 'alpha test data source',
    auth: {
      type: AuthType.UsernamePasswordType,
      credentials: {
        username: 'test123',
      },
    },
  },
};

export const getDataSourceByIdWithoutCredential = {
  attributes: {
    ...getDataSourceByIdWithCredential.attributes,
    auth: {
      type: AuthType.NoAuth,
      credentials: undefined,
    },
  },
  references: [],
};

export const mockResponseForSavedObjectsCalls = (
  savedObjectsClient: SavedObjectsClientContract,
  savedObjectsMethodName: 'get' | 'find' | 'create' | 'delete' | 'update',
  response: any
) => {
  (savedObjectsClient[savedObjectsMethodName] as jest.Mock).mockResolvedValue(response);
};

export const mockErrorResponseForSavedObjectsCalls = (
  savedObjectsClient: SavedObjectsClientContract,
  savedObjectsMethodName: 'get' | 'find' | 'create' | 'delete' | 'update'
) => {
  (savedObjectsClient[savedObjectsMethodName] as jest.Mock).mockRejectedValue(
    throwError(new Error('Error while fetching data sources'))
  );
};
