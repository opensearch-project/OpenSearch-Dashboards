/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { searchAssets } from './search_assets_command';
import { HttpStart } from '../../../../../core/public';
import { coreMock } from '../../../../../core/public/mocks';
import { SavedObjectWithMetadata } from '../../../../saved_objects_management/common';
// @ts-expect-error TS6133 TODO(ts-error): fixme
import { AssetType, SUPPORTED_ASSET_TYPES } from './constants';

describe('searchAssets', () => {
  let httpMock: jest.Mocked<HttpStart>;
  const mockBasePath = '/test-base-path';

  beforeEach(() => {
    const coreStart = coreMock.createStart();
    httpMock = coreStart.http as jest.Mocked<HttpStart>;
    httpMock.basePath.get = jest.fn(() => mockBasePath);
    httpMock.basePath.prepend = jest.fn((path: string) => `${mockBasePath}${path}`);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockAsset = (
    id: string,
    type: string,
    title: string,
    path: string,
    workspaces?: string[]
  ): SavedObjectWithMetadata => ({
    id,
    type,
    attributes: {},
    references: [],
    meta: {
      title,
      inAppUrl: {
        path,
        uiCapabilitiesPath: '',
      },
    },
    workspaces,
  });

  it('should return empty array when API call fails', async () => {
    httpMock.get.mockRejectedValue(new Error('API Error'));

    const result = await searchAssets({
      http: httpMock,
      query: 'test',
      visibleWorkspaceIds: [],
    });

    expect(result).toEqual([]);
  });

  it('should call API with correct parameters and filter invalid assets', async () => {
    const mockAssets = [
      createMockAsset('1', 'dashboard', 'Test Dashboard', '/app/dashboards/1'),
      {
        ...createMockAsset('2', 'visualization', '', '/app/visualize/2'),
        meta: {
          title: '',
          inAppUrl: {
            path: '/app/visualize/2',
            uiCapabilitiesPath: '',
          },
        },
      },
    ];

    httpMock.get.mockResolvedValue({
      saved_objects: mockAssets,
    });

    const result = await searchAssets({
      http: httpMock,
      query: 'dashboard',
      visibleWorkspaceIds: [],
    });

    expect(httpMock.get).toHaveBeenCalledWith(
      '/api/opensearch-dashboards/management/saved_objects/_find',
      {
        query: {
          type: SUPPORTED_ASSET_TYPES,
          search: '*dashboard*',
          perPage: 10,
          workspaces: [],
        },
        signal: undefined,
      }
    );
    expect(result).toHaveLength(1);
  });

  it('should include currentWorkspaceId in API call when provided', async () => {
    httpMock.get.mockResolvedValue({
      saved_objects: [],
    });

    const currentWorkspaceId = 'workspace-1';

    await searchAssets({
      http: httpMock,
      query: 'test',
      currentWorkspaceId,
      visibleWorkspaceIds: [],
    });

    expect(httpMock.get).toHaveBeenCalledWith(
      '/api/opensearch-dashboards/management/saved_objects/_find',
      {
        query: {
          type: SUPPORTED_ASSET_TYPES,
          search: '*test*',
          perPage: 10,
          workspaces: [currentWorkspaceId],
        },
        signal: undefined,
      }
    );
  });

  it('should format URL with workspace ID when asset has workspaces', async () => {
    const currentWorkspaceId = 'workspace-1';
    const mockAssets = [
      createMockAsset('1', 'dashboard', 'Test Dashboard', '/app/dashboards/1', [
        currentWorkspaceId,
      ]),
    ];

    httpMock.get.mockResolvedValue({
      saved_objects: mockAssets,
    });

    const result = await searchAssets({
      http: httpMock,
      query: 'test',
      currentWorkspaceId,
      visibleWorkspaceIds: [currentWorkspaceId],
    });

    expect(result).toHaveLength(1);
    const breadcrumbProps = (result[0] as any).props;
    expect(breadcrumbProps.breadcrumbs[1].href).toContain(currentWorkspaceId);
  });

  it('should use first visible workspace when no currentWorkspaceId provided', async () => {
    const visibleWorkspaceIds = ['workspace-1', 'workspace-2'];
    const mockAssets = [
      createMockAsset('1', 'dashboard', 'Test Dashboard', '/app/dashboards/1', [
        'workspace-2',
        'workspace-3',
      ]),
    ];

    httpMock.get.mockResolvedValue({
      saved_objects: mockAssets,
    });

    const result = await searchAssets({
      http: httpMock,
      query: 'test',
      visibleWorkspaceIds,
    });

    expect(result).toHaveLength(1);
    const breadcrumbProps = (result[0] as any).props;
    expect(breadcrumbProps.breadcrumbs[1].href).toContain('workspace-2');
  });

  it('should call onAssetClick callback and replace management path', async () => {
    const onAssetClick = jest.fn();
    const mockAssets = [
      createMockAsset(
        '1',
        'dashboard',
        'Test Dashboard',
        '/app/management/opensearch-dashboards/objects/dashboard/1'
      ),
    ];

    httpMock.get.mockResolvedValue({
      saved_objects: mockAssets,
    });

    const result = await searchAssets({
      http: httpMock,
      query: 'test',
      visibleWorkspaceIds: [],
      onAssetClick,
    });

    expect(result).toHaveLength(1);
    const breadcrumbProps = (result[0] as any).props;
    expect(breadcrumbProps.breadcrumbs[1].onClick).toBe(onAssetClick);
    expect(breadcrumbProps.breadcrumbs[1].href).toBe(`${mockBasePath}/app/objects/dashboard/1`);
  });
});
