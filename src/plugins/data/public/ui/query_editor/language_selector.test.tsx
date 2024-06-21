/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QueryLanguageSelector } from './language_selector';
import { OpenSearchDashboardsContextProvider } from 'src/plugins/opensearch_dashboards_react/public';
import { coreMock } from '../../../../../core/public/mocks';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { EuiComboBox } from '@elastic/eui';
import { QueryEnhancement } from '../types';

const startMock = coreMock.createStart();

jest.mock('../../services', () => ({
  getUiService: () => ({
    Settings: {
      getAllQueryEnhancements: () => new Map<string, QueryEnhancement>(),
      setUserQueryLanguage: jest.fn(),
      setUiOverridesByUserQueryLanguage: jest.fn(),
    },
  }),
  getSearchService: () => ({
    __enhance: jest.fn(),
    df: {
      clear: jest.fn(),
    },
    getDefaultSearchInterceptor: jest.fn(),
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
    const component = mountWithIntl(
      wrapInContext({
        language: 'lucene',
        onSelectLanguage: () => {
          return;
        },
      })
    );
    const euiComboBox = component.find(EuiComboBox);
    expect(euiComboBox.prop('selectedOptions')).toEqual(
      expect.arrayContaining([
        {
          label: 'Lucene',
        },
      ])
    );
  });

  it('should select DQL if language is kuery', () => {
    const component = mountWithIntl(
      wrapInContext({
        language: 'kuery',
        onSelectLanguage: () => {
          return;
        },
      })
    );
    const euiComboBox = component.find(EuiComboBox);
    expect(euiComboBox.prop('selectedOptions')).toEqual(
      expect.arrayContaining([
        {
          label: 'DQL',
        },
      ])
    );
  });
});
