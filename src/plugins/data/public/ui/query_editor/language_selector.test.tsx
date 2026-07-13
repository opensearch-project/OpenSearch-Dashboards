/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
      { id: 'SQL', title: 'SQL' },
      { id: 'PPL', title: 'PPL' },
    ],
    getUserQueryLanguageBlocklist: () => [],
    setUserQueryLanguage: jest.fn(),
    isLanguageSupportedForDataset: jest.fn(() => true),
  };

  const datasetService = {
    getTypes: () => [{ supportedLanguages: () => ['kuery', 'lucene', 'SQL', 'PPL'] }],
    getType: () => ({ supportedLanguages: () => ['kuery', 'lucene', 'SQL', 'PPL'] }),
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

  beforeEach(() => {
    // Reset the per-dataset support evaluator to its fail-open default before each test
    const languageService = jest
      .requireMock('../../services')
      .getQueryService()
      .queryString.getLanguageService();
    languageService.isLanguageSupportedForDataset.mockReset();
    languageService.isLanguageSupportedForDataset.mockImplementation(() => true);
  });

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

  const getRenderedLanguageLabels = (component: ReturnType<typeof mountWithIntl>) => {
    // The menu items live inside the EuiPopover, which only renders its children
    // once it is open, so click the trigger button first.
    component
      .find('[data-test-subj="queryEditorLanguageSelector"]')
      .hostNodes()
      .first()
      .simulate('click');
    component.update();

    return component
      .find('[data-test-subj="languageSelectorMenuItem"]')
      .hostNodes()
      .map((node) => node.text());
  };

  it('should exclude languages that are not supported for the selected dataset', () => {
    const services = jest.requireMock('../../services');
    const getQueryService = services.getQueryService;
    const languageService = getQueryService().queryString.getLanguageService();

    // Dataset backed by an Elasticsearch source below a language's min version.
    const dataset = {
      id: 'es-below-min',
      title: 'es-below-min',
      type: 'INDEX_PATTERN',
      dataSource: {
        id: 'es-source',
        title: 'es-source',
        type: 'OpenSearch',
        engineType: 'Elasticsearch',
        version: '6.8.0',
      },
    };

    getQueryService().queryString.getQuery.mockReturnValue({
      query: '',
      language: 'kuery',
      dataset,
    });

    // SQL and PPL are gated out for this Elasticsearch-below-min dataset.
    languageService.isLanguageSupportedForDataset.mockImplementation(
      (lang: { id: string }) => lang.id !== 'SQL' && lang.id !== 'PPL'
    );

    const component = mountWithIntl(
      wrapInContext({
        onSelectLanguage: jest.fn(),
      })
    );

    const labels = getRenderedLanguageLabels(component);
    expect(labels).toEqual(expect.arrayContaining(['DQL', 'Lucene']));
    expect(labels).not.toContain('SQL');
    expect(labels).not.toContain('PPL');
    expect(languageService.isLanguageSupportedForDataset).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'SQL' }),
      dataset
    );
  });

  it('should keep all supported languages when the dataset supports them (evaluator returns true)', () => {
    const services = jest.requireMock('../../services');
    const getQueryService = services.getQueryService;
    const languageService = getQueryService().queryString.getLanguageService();

    // OpenSearch dataset at/above any min version — evaluator returns true for all.
    const dataset = {
      id: 'os-source-dataset',
      title: 'os-source-dataset',
      type: 'INDEX_PATTERN',
      dataSource: {
        id: 'os-source',
        title: 'os-source',
        type: 'OpenSearch',
        engineType: 'OpenSearch',
        version: '2.11.0',
      },
    };

    getQueryService().queryString.getQuery.mockReturnValue({
      query: '',
      language: 'kuery',
      dataset,
    });

    languageService.isLanguageSupportedForDataset.mockImplementation(() => true);

    const component = mountWithIntl(
      wrapInContext({
        onSelectLanguage: jest.fn(),
      })
    );

    const labels = getRenderedLanguageLabels(component);
    expect(labels).toEqual(expect.arrayContaining(['DQL', 'Lucene', 'SQL', 'PPL']));
  });
});
