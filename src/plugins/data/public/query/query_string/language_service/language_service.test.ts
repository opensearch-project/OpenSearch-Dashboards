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
    service.__enhance({ queryEditorExtension: mockExtension });
    expect(service.getQueryEditorExtensionMap()).toEqual({ 'test-extension': mockExtension });
  });
});
