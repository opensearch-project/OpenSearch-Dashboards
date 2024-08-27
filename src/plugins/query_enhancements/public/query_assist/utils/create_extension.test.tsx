/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { firstValueFrom } from '@osd/std';
import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { QueryEditorExtensionDependencies } from '../../../../data/public';
import { dataPluginMock } from '../../../../data/public/mocks';
import { ConfigSchema } from '../../../common/config';
import { createQueryAssistExtension } from './create_extension';

const coreSetupMock = coreMock.createSetup({
  pluginStartDeps: {
    data: {
      ui: {},
    },
  },
});
const httpMock = coreSetupMock.http;
const dataMock = dataPluginMock.createSetupContract();

jest.mock('../components', () => ({
  QueryAssistBar: jest.fn(() => <div>QueryAssistBar</div>),
  QueryAssistBanner: jest.fn(() => <div>QueryAssistBanner</div>),
}));

// TODO: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/7860
describe.skip('CreateExtension', () => {
  const dependencies: QueryEditorExtensionDependencies = {
    language: 'PPL',
    onSelectLanguage: jest.fn(),
    isCollapsed: false,
    setIsCollapsed: jest.fn(),
  };
  afterEach(() => {
    jest.clearAllMocks();
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

  it('should be disabled for unsupported language', async () => {
    httpMock.get.mockRejectedValueOnce(new Error('network failure'));
    const extension = createQueryAssistExtension(httpMock, dataMock, config);
    const isEnabled = await firstValueFrom(extension.isEnabled$(dependencies));
    expect(isEnabled).toBeFalsy();
    expect(httpMock.get).toBeCalledWith('/api/enhancements/assist/languages', {
      query: { dataSourceId: 'mock-data-source-id' },
    });
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
