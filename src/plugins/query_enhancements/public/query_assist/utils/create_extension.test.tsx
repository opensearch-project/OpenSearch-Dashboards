/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { firstValueFrom } from '@osd/std';
import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { of } from 'rxjs';
import { coreMock } from '../../../../../core/public/mocks';
import { QueryEditorExtensionDependencies, QueryStringContract } from '../../../../data/public';
import { dataPluginMock } from '../../../../data/public/mocks';
import { ConfigSchema } from '../../../common/config';
import { clearCache, createQueryAssistExtension } from './create_extension';

const coreSetupMock = coreMock.createSetup({
  pluginStartDeps: {
    data: {
      ui: {},
    },
  },
});
const httpMock = coreSetupMock.http;
const dataMock = dataPluginMock.createSetupContract();
const queryStringMock = dataMock.query.queryString as jest.Mocked<QueryStringContract>;

const mockQueryWithIndexPattern = {
  query: '',
  language: 'kuery',
  dataset: {
    id: 'mock-index-pattern-id',
    title: 'mock-index',
    type: 'INDEX_PATTERN',
    dataSource: {
      id: 'mock-data-source-id',
      title: 'test-mds',
      type: 'OpenSearch',
    },
  },
};

queryStringMock.getQuery.mockReturnValue(mockQueryWithIndexPattern);
queryStringMock.getUpdates$.mockReturnValue(of(mockQueryWithIndexPattern));

jest.mock('../components', () => ({
  QueryAssistBar: jest.fn(() => <div>QueryAssistBar</div>),
  QueryAssistBanner: jest.fn(() => <div>QueryAssistBanner</div>),
}));

describe('CreateExtension', () => {
  const dependencies: QueryEditorExtensionDependencies = {
    language: 'PPL',
    onSelectLanguage: jest.fn(),
    isCollapsed: false,
    setIsCollapsed: jest.fn(),
  };
  afterEach(() => {
    jest.clearAllMocks();
    clearCache();
  });

  const config: ConfigSchema['queryAssist'] = {
    supportedLanguages: [{ language: 'PPL', agentConfig: 'os_query_assist_ppl' }],
  };

  it('should be enabled if at least one language is configured', async () => {
    httpMock.get.mockResolvedValueOnce({ configuredLanguages: ['PPL'] });
    const extension = createQueryAssistExtension(httpMock, dataMock, config);
    const isEnabled = await firstValueFrom(extension.isEnabled$(dependencies));
    expect(isEnabled).toBeTruthy();
    expect(httpMock.get).toBeCalledWith('/api/enhancements/assist/languages', {
      query: { dataSourceId: 'mock-data-source-id' },
    });
  });

  it('should be disabled when there is an error', async () => {
    httpMock.get.mockRejectedValueOnce(new Error('network failure'));
    const extension = createQueryAssistExtension(httpMock, dataMock, config);
    const isEnabled = await firstValueFrom(extension.isEnabled$(dependencies));
    expect(isEnabled).toBeFalsy();
    expect(httpMock.get).toBeCalledWith('/api/enhancements/assist/languages', {
      query: { dataSourceId: 'mock-data-source-id' },
    });
  });

  it('creates data structure meta', async () => {
    httpMock.get.mockResolvedValueOnce({ configuredLanguages: ['PPL'] });
    const extension = createQueryAssistExtension(httpMock, dataMock, config);
    const meta = await extension.getDataStructureMeta?.('mock-data-source-id2');
    expect(meta).toMatchInlineSnapshot(`
      Object {
        "icon": Object {
          "type": "test-file-stub",
        },
        "tooltip": "Query assist is available",
        "type": "FEATURE",
      }
    `);
    expect(httpMock.get).toBeCalledWith('/api/enhancements/assist/languages', {
      query: { dataSourceId: 'mock-data-source-id2' },
    });
  });

  it('does not send multiple requests for the same data source', async () => {
    httpMock.get.mockResolvedValueOnce({ configuredLanguages: ['PPL'] });
    const extension = createQueryAssistExtension(httpMock, dataMock, config);
    const metas = await Promise.all(
      Array.from({ length: 10 }, () => extension.getDataStructureMeta?.('mock-data-source-id2'))
    );
    metas.push(await extension.getDataStructureMeta?.('mock-data-source-id2'));
    metas.forEach((meta) => expect(meta?.type).toBe('FEATURE'));
    expect(httpMock.get).toBeCalledTimes(1);
  });

  it('should render the component if language is supported', async () => {
    httpMock.get.mockResolvedValueOnce({ configuredLanguages: ['PPL'] });
    const extension = createQueryAssistExtension(httpMock, dataMock, config);
    const component = extension.getComponent?.(dependencies);

    if (!component) throw new Error('QueryEditorExtensions Component is undefined');

    await act(async () => {
      render(component);
    });

    expect(screen.getByText('QueryAssistBar')).toBeInTheDocument();
  });

  it('should render the banner if language is not supported', async () => {
    httpMock.get.mockResolvedValueOnce({ configuredLanguages: ['PPL'] });
    const extension = createQueryAssistExtension(httpMock, dataMock, config);
    const banner = extension.getBanner?.({
      ...dependencies,
      language: 'DQL',
    });

    if (!banner) throw new Error('QueryEditorExtensions Banner is undefined');

    await act(async () => {
      render(banner);
    });

    expect(screen.getByText('QueryAssistBanner')).toBeInTheDocument();
  });
});
