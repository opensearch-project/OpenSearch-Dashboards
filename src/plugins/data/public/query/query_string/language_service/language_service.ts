/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageConfig } from './types';
import { getDQLLanguageConfig, getLuceneLanguageConfig } from './lib';
import { ISearchInterceptor } from '../../../search';
import {
  createEditor,
  DQLBody,
  QueryEditorExtensionConfig,
  SingleLineInput,
  UiEnhancements,
} from '../../../ui';
import { DataStorage, setOverrides as setFieldOverrides } from '../../../../common';
import { dqlLanguageReference } from './lib/dql_language_reference';
import { luceneLanguageReference } from './lib/lucene_language_reference';

export class LanguageService {
  private languages: Map<string, LanguageConfig> = new Map();
  private queryEditorExtensionMap: Record<string, QueryEditorExtensionConfig>;

  constructor(
    private readonly defaultSearchInterceptor: ISearchInterceptor,
    private readonly storage: DataStorage
  ) {
    this.registerDefaultLanguages();
    this.queryEditorExtensionMap = {};
  }

  public __enhance = (enhancements: UiEnhancements) => {
    if (enhancements.queryEditorExtension) {
      this.queryEditorExtensionMap[enhancements.queryEditorExtension.id] =
        enhancements.queryEditorExtension;
    }
  };

  /**
   * Registers default handlers for index patterns and indices.
   */
  private registerDefaultLanguages() {
    this.registerLanguage(
      getDQLLanguageConfig(
        this.defaultSearchInterceptor,
        createEditor(SingleLineInput, SingleLineInput, [dqlLanguageReference()], DQLBody)
      )
    );
    this.registerLanguage(
      getLuceneLanguageConfig(
        this.defaultSearchInterceptor,
        createEditor(SingleLineInput, SingleLineInput, [luceneLanguageReference()], DQLBody)
      )
    );
  }

  public registerLanguage(config: LanguageConfig): void {
    this.languages.set(config.id, config);
  }

  public getLanguage(languageId: string): LanguageConfig | undefined {
    return this.languages.get(languageId);
  }

  public getLanguages(): LanguageConfig[] {
    return Array.from(this.languages.values());
  }

  public getDefaultLanguage(): LanguageConfig | undefined {
    return this.languages.get('kuery') || this.languages.values().next().value;
  }

  public getQueryEditorExtensionMap() {
    return this.queryEditorExtensionMap;
  }

  resetUserQuery() {
    this.setUserQueryLanguage('kuery');
    this.setUserQueryString('');
  }

  getUserQueryLanguageBlocklist() {
    return this.storage.get('userQueryLanguageBlocklist') || [];
  }

  // TODO: MQL just filtered return languages here
  setUserQueryLanguageBlocklist(languages: string[]) {
    this.storage.set(
      'userQueryLanguageBlocklist',
      languages.map((language) => language.toLowerCase())
    );
    return true;
  }

  getUserQueryLanguage() {
    return this.storage.get('userQueryLanguage') || 'kuery';
  }

  setUserQueryLanguage(language: string) {
    this.storage.set('userQueryLanguage', language);
    this.setUiOverridesByUserQueryLanguage(language);
    return true;
  }

  getUserQueryString() {
    return this.storage.get('userQueryString') || '';
  }

  setUserQueryString(query: string) {
    this.storage.set('userQueryString', query);
    return true;
  }

  getUiOverrides() {
    return this.storage.get('uiOverrides') || {};
  }

  setUiOverrides(overrides?: { [key: string]: any }) {
    if (!overrides) {
      this.storage.remove('uiOverrides');
      setFieldOverrides(undefined);
      return true;
    }
    this.storage.set('uiOverrides', overrides);
    setFieldOverrides(overrides.fields);
    return true;
  }

  setUiOverridesByUserQueryLanguage(language: string) {
    const queryEnhancement = this.languages.get(language);
    if (queryEnhancement) {
      const { fields = {} } = queryEnhancement;
      this.setUiOverrides({ fields });
    } else {
      this.setUiOverrides({ fields: undefined });
    }
  }

  setUserQuerySessionId(dataSourceName: string, sessionId: string | null) {
    if (sessionId !== null) {
      sessionStorage.setItem(`async-query-session-id_${dataSourceName}`, sessionId);
    }
  }

  setUserQuerySessionIdByObj = (dataSourceName: string, obj: Record<string, any>) => {
    const sessionId =
      'sessionId'.split('.').reduce((acc: any, part: string) => acc && acc[part], obj) || null;
    this.setUserQuerySessionId(dataSourceName, sessionId);
  };

  getUserQuerySessionId = (dataSourceName: string) => {
    return sessionStorage.getItem(`async-query-session-id_${dataSourceName}`);
  };
}

export type LanguageServiceContract = PublicMethodsOf<LanguageService>;
