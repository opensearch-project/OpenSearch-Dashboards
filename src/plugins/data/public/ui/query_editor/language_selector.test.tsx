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

jest.mock('../../services', () => ({
  getQueryService: () => ({
    queryString: {
      getLanguageService: () => ({
        getLanguages: () => [
          { id: 'lucene', title: 'Lucene' },
          { id: 'kuery', title: 'DQL' },
        ],
        getUserQueryLanguageBlocklist: () => [],
        setUserQueryLanguage: jest.fn(),
      }),
      getUpdates$: () => ({
        subscribe: () => ({
          unsubscribe: jest.fn(),
        }),
      }),
    },
  }),
}));

describe('LanguageSelector', () => {
  function wrapInContext(testProps: any) {
    const services = {
      uiSettings: startMock.uiSettings,
      docLinks: startMock.docLinks,
    };

    return (
      <OpenSearchDashboardsContextProvider services={services}>
        <QueryLanguageSelector {...testProps} />
      </OpenSearchDashboardsContextProvider>
    );
  }

  it('should select lucene if language is lucene', () => {
    const query: Query = { query: '', language: 'lucene' };
    const component = mountWithIntl(
      wrapInContext({
        query,
        onSelectLanguage: jest.fn(),
      })
    );
    expect(component).toMatchSnapshot();
  });

  it('should select DQL if language is kuery', () => {
    const query: Query = { query: '', language: 'kuery' };
    const component = mountWithIntl(
      wrapInContext({
        query,
        onSelectLanguage: jest.fn(),
      })
    );
    expect(component).toMatchSnapshot();
  });
});
