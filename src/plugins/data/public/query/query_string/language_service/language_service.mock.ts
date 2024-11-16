/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createEditor, DQLBody, SingleLineInput } from '../../../ui';
import { LanguageServiceContract } from './language_service';
import { LanguageConfig } from './types';

const createSetupLanguageServiceMock = (): jest.Mocked<LanguageServiceContract> => {
  const languages = new Map<string, LanguageConfig>();

  const mockDQLLanguage: LanguageConfig = {
    id: 'kuery',
    title: 'DQL',
    search: {} as any,
    getQueryString: jest.fn(),
    editor: createEditor(SingleLineInput, SingleLineInput, [], DQLBody),
    fields: {
      filterable: true,
      visualizable: true,
    },
    showDocLinks: true,
    editorSupportedAppNames: ['discover'],
  };

  const mockLuceneLanguage: LanguageConfig = {
    id: 'lucene',
    title: 'Lucene',
    search: {} as any,
    getQueryString: jest.fn(),
    editor: createEditor(SingleLineInput, SingleLineInput, [], DQLBody),
    fields: {
      filterable: true,
      visualizable: true,
    },
    showDocLinks: true,
    editorSupportedAppNames: ['discover'],
  };

  languages.set(mockDQLLanguage.id, mockDQLLanguage);
  languages.set(mockLuceneLanguage.id, mockLuceneLanguage);

  return {
    __enhance: jest.fn(),
    registerLanguage: jest.fn((language: LanguageConfig) => {
      languages.set(language.id, language);
    }),
    getLanguage: jest.fn((id: string) => languages.get(id)),
    getLanguages: jest.fn(() => Array.from(languages.values())),
    getDefaultLanguage: jest.fn(() => languages.get('kuery') || languages.values().next().value),
    getQueryEditorExtensionMap: jest.fn().mockReturnValue({}),
    resetUserQuery: jest.fn(),
    getUserQueryLanguageBlocklist: jest.fn().mockReturnValue([]),
    setUserQueryLanguageBlocklist: jest.fn().mockReturnValue(true),
    getUserQueryLanguage: jest.fn().mockReturnValue('kuery'),
    setUserQueryLanguage: jest.fn().mockReturnValue(true),
    getUserQueryString: jest.fn().mockReturnValue(''),
    setUserQueryString: jest.fn().mockReturnValue(true),
    getUiOverrides: jest.fn().mockReturnValue({}),
    setUiOverrides: jest.fn().mockReturnValue(true),
    setUiOverridesByUserQueryLanguage: jest.fn(),
    setUserQuerySessionId: jest.fn(),
    setUserQuerySessionIdByObj: jest.fn(),
    getUserQuerySessionId: jest.fn().mockReturnValue(null),
    createDefaultLanguageReference: jest.fn(),
  };
};

export const languageServiceMock = {
  createSetupContract: createSetupLanguageServiceMock,
  createStartContract: createSetupLanguageServiceMock,
};
