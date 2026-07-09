/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageService } from './language_service';
import { ISearchInterceptor } from '../../../search';
import { DataStorage } from '../../../../common';
import { LanguageConfig } from './types';

describe('LanguageService', () => {
  let service: LanguageService;
  let mockSearchInterceptor: jest.Mocked<ISearchInterceptor>;
  let mockStorage: jest.Mocked<DataStorage>;

  beforeEach(() => {
    mockSearchInterceptor = {} as jest.Mocked<ISearchInterceptor>;
    mockStorage = ({
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    } as unknown) as jest.Mocked<DataStorage>;

    service = new LanguageService(mockSearchInterceptor, mockStorage);
  });

  test('registerLanguage and getLanguage', () => {
    const mockLanguage: LanguageConfig = {
      id: 'test-language',
      title: 'Test Language',
      search: {} as any,
      getQueryString: jest.fn(),
      editor: {} as any,
      fields: {},
      showDocLinks: true,
      editorSupportedAppNames: ['test-app'],
    };

    service.registerLanguage(mockLanguage);
    expect(service.getLanguage('test-language')).toBe(mockLanguage);
  });

  test('getLanguages returns all registered languages', () => {
    const languages = service.getLanguages();
    expect(languages).toHaveLength(2); // DQL and Lucene are registered by default
    expect(languages[0].id).toBe('kuery');
    expect(languages[1].id).toBe('lucene');
  });

  test('getDefaultLanguage returns DQL by default', () => {
    const defaultLanguage = service.getDefaultLanguage();
    // @ts-expect-error TS2532 TODO(ts-error): fixme
    expect(defaultLanguage.id).toBe('kuery');
  });

  test('getUserQueryLanguageBlocklist', () => {
    mockStorage.get.mockReturnValue(['sql', 'ppl']);
    expect(service.getUserQueryLanguageBlocklist()).toEqual(['sql', 'ppl']);
  });

  test('setUserQueryLanguageBlocklist', () => {
    service.setUserQueryLanguageBlocklist(['sql', 'ppl']);
    expect(mockStorage.set).toHaveBeenCalledWith('userQueryLanguageBlocklist', ['sql', 'ppl']);
  });

  test('getUserQueryLanguage', () => {
    mockStorage.get.mockReturnValue('sql');
    expect(service.getUserQueryLanguage()).toBe('sql');
  });

  test('setUserQueryLanguage', () => {
    service.setUserQueryLanguage('sql');
    expect(mockStorage.set).toHaveBeenCalledWith('userQueryLanguage', 'sql');
  });

  test('getUserQueryString', () => {
    mockStorage.get.mockReturnValue('SELECT * FROM table');
    expect(service.getUserQueryString()).toBe('SELECT * FROM table');
  });

  test('setUserQueryString', () => {
    service.setUserQueryString('SELECT * FROM table');
    expect(mockStorage.set).toHaveBeenCalledWith('userQueryString', 'SELECT * FROM table');
  });

  test('getUiOverrides', () => {
    const mockOverrides = { fields: { filterable: true } };
    mockStorage.get.mockReturnValue(mockOverrides);
    expect(service.getUiOverrides()).toEqual(mockOverrides);
  });

  test('setUiOverrides', () => {
    const mockOverrides = { fields: { filterable: true } };
    service.setUiOverrides(mockOverrides);
    expect(mockStorage.set).toHaveBeenCalledWith('uiOverrides', mockOverrides);
  });

  test('setUiOverrides with undefined clears overrides', () => {
    service.setUiOverrides(undefined);
    expect(mockStorage.remove).toHaveBeenCalledWith('uiOverrides');
  });

  test('setUiOverridesByUserQueryLanguage', () => {
    const mockLanguage: LanguageConfig = {
      id: 'test-language',
      title: 'Test Language',
      search: {} as any,
      getQueryString: jest.fn(),
      editor: {} as any,
      fields: { filterable: true },
      showDocLinks: true,
      editorSupportedAppNames: ['test-app'],
    };
    service.registerLanguage(mockLanguage);

    service.setUiOverridesByUserQueryLanguage('test-language');
    expect(mockStorage.set).toHaveBeenCalledWith('uiOverrides', { fields: { filterable: true } });
  });

  test('setUserQuerySessionId', () => {
    const mockSetItem = jest.spyOn(Storage.prototype, 'setItem');
    service.setUserQuerySessionId('test-source', 'test-session-id');
    expect(mockSetItem).toHaveBeenCalledWith(
      'async-query-session-id_test-source',
      'test-session-id'
    );
  });

  test('getUserQuerySessionId', () => {
    const mockGetItem = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-session-id');
    expect(service.getUserQuerySessionId('test-source')).toBe('test-session-id');
    expect(mockGetItem).toHaveBeenCalledWith('async-query-session-id_test-source');
  });

  test('setUserQuerySessionIdByObj', () => {
    const mockSetItem = jest.spyOn(Storage.prototype, 'setItem');
    service.setUserQuerySessionIdByObj('test-source', { sessionId: 'test-session-id' });
    expect(mockSetItem).toHaveBeenCalledWith(
      'async-query-session-id_test-source',
      'test-session-id'
    );
  });

  test('resetUserQuery', () => {
    service.resetUserQuery();
    expect(mockStorage.set).toHaveBeenCalledWith('userQueryLanguage', 'kuery');
    expect(mockStorage.set).toHaveBeenCalledWith('userQueryString', '');
  });

  test('__enhance adds query editor extensions', () => {
    const mockExtension = { id: 'test-extension' };
    // @ts-expect-error TS2739 TODO(ts-error): fixme
    service.__enhance({ queryEditorExtension: mockExtension });
    expect(service.getQueryEditorExtensionMap()).toEqual({ 'test-extension': mockExtension });
  });

  describe('isLanguageSupportedForDataset', () => {
    const makeLanguage = (
      supportedDataSources?: LanguageConfig['supportedDataSources']
    ): LanguageConfig =>
      (({
        id: 'TEST',
        title: 'Test',
        search: {} as any,
        getQueryString: jest.fn(),
        editor: {} as any,
        supportedDataSources,
      } as unknown) as LanguageConfig);

    // Mirrors the declared minimums: SQL >= 6.5, PPL >= 7.9 on Elasticsearch.
    const sqlLanguage = makeLanguage({ minVersionByEngine: { Elasticsearch: '6.5.0' } });
    const pplLanguage = makeLanguage({ minVersionByEngine: { Elasticsearch: '7.9.0' } });

    const datasetWith = (dataSource?: Record<string, any>) =>
      ({ id: 'd', title: 'd', type: 'INDEX_PATTERN', dataSource } as any);

    it('returns true when the language declares no supportedDataSources', () => {
      const lang = makeLanguage(undefined);
      expect(
        service.isLanguageSupportedForDataset(
          lang,
          datasetWith({ type: 'Elasticsearch', engineType: 'Elasticsearch', version: '6.0.0' })
        )
      ).toBe(true);
    });

    it('hides SQL and PPL for Elasticsearch 6.4 (below both minimums)', () => {
      const ds = datasetWith({
        type: 'Elasticsearch',
        engineType: 'Elasticsearch',
        version: '6.4.0',
      });
      expect(service.isLanguageSupportedForDataset(sqlLanguage, ds)).toBe(false);
      expect(service.isLanguageSupportedForDataset(pplLanguage, ds)).toBe(false);
    });

    it('shows SQL but hides PPL for Elasticsearch 6.5', () => {
      const ds = datasetWith({
        type: 'Elasticsearch',
        engineType: 'Elasticsearch',
        version: '6.5.0',
      });
      expect(service.isLanguageSupportedForDataset(sqlLanguage, ds)).toBe(true);
      expect(service.isLanguageSupportedForDataset(pplLanguage, ds)).toBe(false);
    });

    it('shows both SQL and PPL for Elasticsearch 7.9', () => {
      const ds = datasetWith({
        type: 'Elasticsearch',
        engineType: 'Elasticsearch',
        version: '7.9.0',
      });
      expect(service.isLanguageSupportedForDataset(sqlLanguage, ds)).toBe(true);
      expect(service.isLanguageSupportedForDataset(pplLanguage, ds)).toBe(true);
    });

    it.each([
      ['OpenSearch', '1.0.0'],
      ['OpenSearchServerless', ''],
      ['AnalyticEngine', '1.0.0'],
      ['OpenSearchCrossCluster', '2.0.0'],
    ])('fail-opens for non-Elasticsearch engine %s', (engineType, version) => {
      const ds = datasetWith({ type: engineType, engineType, version });
      expect(service.isLanguageSupportedForDataset(sqlLanguage, ds)).toBe(true);
      expect(service.isLanguageSupportedForDataset(pplLanguage, ds)).toBe(true);
    });

    it('fail-opens when dataset has no data source (local cluster)', () => {
      expect(service.isLanguageSupportedForDataset(sqlLanguage, datasetWith(undefined))).toBe(true);
      expect(service.isLanguageSupportedForDataset(pplLanguage, undefined)).toBe(true);
    });

    it('fail-opens for Elasticsearch with empty or unparseable version', () => {
      const empty = datasetWith({
        type: 'Elasticsearch',
        engineType: 'Elasticsearch',
        version: '',
      });
      const garbage = datasetWith({
        type: 'Elasticsearch',
        engineType: 'Elasticsearch',
        version: 'not-a-version',
      });
      expect(service.isLanguageSupportedForDataset(sqlLanguage, empty)).toBe(true);
      expect(service.isLanguageSupportedForDataset(pplLanguage, garbage)).toBe(true);
    });

    it('falls back to dataSource.type when engineType is absent', () => {
      const ds = datasetWith({ type: 'Elasticsearch', version: '6.0.0' });
      expect(service.isLanguageSupportedForDataset(sqlLanguage, ds)).toBe(false);
    });
  });
});
