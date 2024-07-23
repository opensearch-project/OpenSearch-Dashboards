/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { firstValueFrom } from '@osd/std';
import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { IIndexPattern } from '../../../../data/public';
import { ConfigSchema } from '../../../common/config';
import { ConnectionsService } from '../../data_source_connection';
import { Connection } from '../../types';
import { createQueryAssistExtension } from './create_extension';

const coreSetupMock = coreMock.createSetup({
  pluginStartDeps: {
    data: {
      ui: {},
    },
  },
});
const httpMock = coreSetupMock.http;

jest.mock('../components', () => ({
  QueryAssistBar: jest.fn(() => <div>QueryAssistBar</div>),
  QueryAssistBanner: jest.fn(() => <div>QueryAssistBanner</div>),
}));

describe('CreateExtension', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const config: ConfigSchema['queryAssist'] = {
    supportedLanguages: [{ language: 'PPL', agentConfig: 'os_query_assist_ppl' }],
  };
  const connectionsService = new ConnectionsService({
    startServices: coreSetupMock.getStartServices(),
    http: httpMock,
  });

  // for these tests we only need id field in the connection
  connectionsService.setSelectedConnection$({
    dataSource: { id: 'mock-data-source-id' },
  } as Connection);

  it('should be enabled if at least one language is configured', async () => {
    httpMock.get.mockResolvedValueOnce({ configuredLanguages: ['PPL'] });
    const extension = createQueryAssistExtension(httpMock, connectionsService, config);
    const isEnabled = await firstValueFrom(extension.isEnabled$({ language: 'PPL' }));
    expect(isEnabled).toBeTruthy();
    expect(httpMock.get).toBeCalledWith('/api/enhancements/assist/languages', {
      query: { dataSourceId: 'mock-data-source-id' },
    });
  });

  it('should be disabled for unsupported language', async () => {
    httpMock.get.mockRejectedValueOnce(new Error('network failure'));
    const extension = createQueryAssistExtension(httpMock, connectionsService, config);
    const isEnabled = await firstValueFrom(extension.isEnabled$({ language: 'PPL' }));
    expect(isEnabled).toBeFalsy();
    expect(httpMock.get).toBeCalledWith('/api/enhancements/assist/languages', {
      query: { dataSourceId: 'mock-data-source-id' },
    });
  });

  it('should render the component if language is supported', async () => {
    httpMock.get.mockResolvedValueOnce({ configuredLanguages: ['PPL'] });
    const extension = createQueryAssistExtension(httpMock, connectionsService, config);
    const component = extension.getComponent?.({
      language: 'PPL',
      indexPatterns: [{ id: 'test-pattern' }] as IIndexPattern[],
    });

    if (!component) throw new Error('QueryEditorExtensions Component is undefined');

    await act(async () => {
      render(component);
    });

    expect(screen.getByText('QueryAssistBar')).toBeInTheDocument();
  });

  it('should render the banner if language is not supported', async () => {
    httpMock.get.mockResolvedValueOnce({ configuredLanguages: ['PPL'] });
    const extension = createQueryAssistExtension(httpMock, connectionsService, config);
    const banner = extension.getBanner?.({
      language: 'DQL',
      indexPatterns: [{ id: 'test-pattern' }] as IIndexPattern[],
    });

    if (!banner) throw new Error('QueryEditorExtensions Banner is undefined');

    await act(async () => {
      render(banner);
    });

    expect(screen.getByText('QueryAssistBanner')).toBeInTheDocument();
  });
});
