/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { DataStorage, setOverrides as setFieldOverrides } from '../../../common';
import { ConfigSchema } from '../../../config';
import { ISearchStart } from '../../search';
import { QueryEditorExtensionConfig } from '../query_editor/query_editor_extensions';
import { IQueryStart } from '../../query';

export interface DataSettings {
  userQueryLanguage: string;
  userQueryString: string;
  uiOverrides?: {
    fields?: {
      filterable?: boolean;
      visualizable?: boolean;
    };
    showDocLinks?: boolean;
  };
}

export class Settings {
  private isEnabled = false;
  private enabledQueryEnhancementsUpdated$ = new BehaviorSubject<boolean>(this.isEnabled);
  private enhancedAppNames: string[] = [];

  constructor(
    private readonly config: ConfigSchema['enhancements'],
    private readonly search: ISearchStart,
    private readonly query: IQueryStart,
    private readonly storage: DataStorage,
    private readonly queryEditorExtensionMap: Record<string, QueryEditorExtensionConfig>
  ) {
    this.isEnabled = true;
    this.setUserQueryEnhancementsEnabled(this.isEnabled);
    this.enhancedAppNames = this.isEnabled ? this.config.supportedAppNames : [];
  }

  supportsEnhancementsEnabled(appName: string) {
    return this.enhancedAppNames.includes(appName);
  }

  getEnabledQueryEnhancementsUpdated$ = () => {
    return this.enabledQueryEnhancementsUpdated$.asObservable();
  };

  setUserQueryEnhancementsEnabled(enabled: boolean) {
    // If previously enabled and now disabled, reset query to kuery
    if (this.isEnabled && !enabled) {
      this.setUserQueryLanguage('kuery');
      this.setUserQueryString('');
    }
    this.isEnabled = enabled;
    this.enabledQueryEnhancementsUpdated$.next(this.isEnabled);
    return true;
  }

  getQueryEditorExtensionMap() {
    return this.queryEditorExtensionMap;
  }

  getUserQueryLanguageBlocklist() {
    return this.storage.get('userQueryLanguageBlocklist') || [];
  }

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

  setUserQueryLanguage(languageId: string) {
    if (languageId !== this.getUserQueryLanguage()) {
      this.search.df.clear();
    }
    this.storage.set('userQueryLanguage', languageId);
    this.setUiOverridesByUserQueryLanguage(languageId);

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

  setUiOverridesByUserQueryLanguage(languageId: string) {
    const language = this.query.queryString.getLanguageService().getLanguage(languageId);
    if (language) {
      const { fields = {}, showDocLinks } = language;
      this.setUiOverrides({ fields, showDocLinks });
    } else {
      this.setUiOverrides({ fields: undefined, showDocLinks: undefined });
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

  toJSON(): DataSettings {
    return {
      userQueryLanguage: this.getUserQueryLanguage(),
      userQueryString: this.getUserQueryString(),
      uiOverrides: this.getUiOverrides(),
    };
  }

  updateSettings({ userQueryLanguage, userQueryString, uiOverrides }: DataSettings) {
    this.setUserQueryLanguage(userQueryLanguage);
    this.setUserQueryString(userQueryString);
    this.setUiOverrides(uiOverrides);
  }
}

interface Deps {
  config: ConfigSchema['enhancements'];
  search: ISearchStart;
  query: IQueryStart;
  storage: DataStorage;
  queryEditorExtensionMap: Record<string, QueryEditorExtensionConfig>;
}

export function createSettings({ config, search, query, storage, queryEditorExtensionMap }: Deps) {
  return new Settings(config, search, query, storage, queryEditorExtensionMap);
}
