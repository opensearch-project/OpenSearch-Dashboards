/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QueryLanguageSelector } from './language_selector';
import { OpenSearchDashboardsContextProvider } from 'src/plugins/opensearch_dashboards_react/public';
import { coreMock } from '../../../../../core/public/mocks';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { Query } from '../..';

const startMock = coreMock.createStart();

// Mock the query updates subject
// Create a more complete mock that matches the service structure
jest.mock('../../services', () => {
  const getQueryMock = jest.fn().mockReturnValue({
    query: '',
    language: 'kuery',
    dataset: undefined,
  } as Query);

  const languageService = {
    getDefaultLanguage: () => ({ id: 'kuery', title: 'DQL' }),
    getLanguages: () => [
      { id: 'lucene', title: 'Lucene' },
      { id: 'kuery', title: 'DQL' },
    ],
    getUserQueryLanguageBlocklist: () => [],
    setUserQueryLanguage: jest.fn(),
  };

  const datasetService = {
    getTypes: () => [{ supportedLanguages: () => ['kuery', 'lucene'] }],
    getType: () => ({ supportedLanguages: () => ['kuery', 'lucene'] }),
    addRecentDataset: jest.fn(),
  };

  return {
    getQueryService: () => ({
      queryString: {
        getQuery: getQueryMock,
        getLanguageService: () => languageService,
        getDatasetService: () => datasetService,
        getUpdates$: jest.fn().mockReturnValue({
          subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
        }),
      },
    }),
  };
});

describe('LanguageSelector', () => {
  function wrapInContext(testProps: any) {
    const services = {
      uiSettings: startMock.uiSettings,
      docLinks: startMock.docLinks,
      http: startMock.http,
      data: {
        query: {
          queryString: jest.requireMock('../../services').getQueryService().queryString,
        },
      },
    };

    return (
      <OpenSearchDashboardsContextProvider services={services}>
        <QueryLanguageSelector {...testProps} />
      </OpenSearchDashboardsContextProvider>
    );
  }

  it('should select lucene if language is lucene', () => {
    // Update the mock query value before mounting
    const getQueryService = jest.requireMock('../../services').getQueryService;
    getQueryService().queryString.getQuery.mockReturnValue({
      query: '',
      language: 'lucene',
      dataset: undefined,
    });

    const component = mountWithIntl(
      wrapInContext({
        onSelectLanguage: jest.fn(),
      })
    );
    expect(component).toMatchSnapshot();
  });

  it('should select DQL if language is kuery', () => {
    const getQueryService = jest.requireMock('../../services').getQueryService;
    getQueryService().queryString.getQuery.mockReturnValue({
      query: '',
      language: 'kuery',
      dataset: undefined,
    });

    const component = mountWithIntl(
      wrapInContext({
        onSelectLanguage: jest.fn(),
      })
    );
    expect(component).toMatchSnapshot();
  });
});
