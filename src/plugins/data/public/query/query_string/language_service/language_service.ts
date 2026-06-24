/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import semver from 'semver';
import { EditorEnhancements, LanguageConfig } from './types';
import { getDQLLanguageConfig, getLuceneLanguageConfig } from './lib';
import { ISearchInterceptor } from '../../../search';
import { createEditor, DQLBody, QueryEditorExtensionConfig, SingleLineInput } from '../../../ui';
import { DataStorage, Dataset, setOverrides as setFieldOverrides } from '../../../../common';
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

  public __enhance = (enhancements: EditorEnhancements) => {
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

  /**
   * Determines whether a language is supported for the currently selected dataset, based on the
   * dataset's data-source engine type and version against the language's declared
   * {@link LanguageConfig.supportedDataSources}.
   *
   * Fail-open by design: returns `true` whenever applicability cannot be conclusively determined,
   * so unknown/missing engine types, blank or unparseable versions, datasets without a data source,
   * and languages that declare no `supportedDataSources` are all treated as supported. Only an
   * engine with a declared minimum version AND a parseable dataset version below that minimum
   * yields `false`.
   */
  public isLanguageSupportedForDataset(language: LanguageConfig, dataset?: Dataset): boolean {
    const minVersionByEngine = language.supportedDataSources?.minVersionByEngine;
    if (!minVersionByEngine) return true;

    const engine = dataset?.dataSource?.engineType ?? dataset?.dataSource?.type;
    if (!engine) return true;

    const minVersion = minVersionByEngine[engine];
    if (!minVersion) return true;

    const coerced = semver.coerce(dataset?.dataSource?.version);
    if (!coerced) return true;

    return semver.satisfies(coerced.version, `>=${minVersion}`);
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
