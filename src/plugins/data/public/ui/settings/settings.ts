/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { IStorageWrapper } from 'src/plugins/opensearch_dashboards_utils/public';
import { Query, setOverrides as setFieldOverrides, TimeRange } from '../../../common';
import { ConfigSchema } from '../../../config';
import { ISearchStart } from '../../search';
import { QueryEditorExtensionConfig } from '../query_editor/query_editor_extensions';
import { QueryEnhancement } from '../types';
import { Storage, History, createHistory, createStorage } from '../history';

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
  private Storage: Storage;
  private history: History;

  constructor(
    private readonly config: ConfigSchema['enhancements'],
    private readonly search: ISearchStart,
    private readonly storage: IStorageWrapper,
    private readonly queryEnhancements: Map<string, QueryEnhancement>,
    private readonly queryEditorExtensionMap: Record<string, QueryEditorExtensionConfig>
  ) {
    this.isEnabled = true;
    this.setUserQueryEnhancementsEnabled(this.isEnabled);
    this.enhancedAppNames = this.isEnabled ? this.config.supportedAppNames : [];
    this.Storage = createStorage({
      engine: storage,
      prefix: 'opensearchDashboards.',
    });
    this.history = createHistory({ storage: this.Storage });
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

  // getUserQuery() {
  //   return this.Storage.get('userQuery');
  // }

  setQuery(query: Query, timeRange?: TimeRange) {
    if (query.query) {
      this.history.addQueryToHistory(query, timeRange);
    }
  }

  getQueryHistory() {
    return this.history.getHistory();
  }

  clearQueryHistory() {
    this.history.clearHistory();
  }

  changeQueryHistory(listener: (reqs: any[]) => void) {
    return this.history.change(listener);
  }

  getAllQueryEnhancements() {
    return this.queryEnhancements;
  }

  getQueryEnhancements(language: string) {
    return this.queryEnhancements.get(language);
  }

  getQueryEditorExtensionMap() {
    return this.queryEditorExtensionMap;
  }

  //TODO: update all the prefixes to get rid of opensearchDashboards.
  getUserQueryLanguageBlocklist() {
    return this.Storage.get('userQueryLanguageBlocklist') || [];
  }

  setUserQueryLanguageBlocklist(languages: string[]) {
    this.Storage.set(
      'userQueryLanguageBlocklist',
      languages.map((language) => language.toLowerCase())
    );
    return true;
  }

  getUserQueryLanguage() {
    return this.Storage.get('userQueryLanguage') || 'kuery';
  }

  setUserQueryLanguage(language: string) {
    if (language !== this.getUserQueryLanguage()) {
      this.search.df.clear();
    }
    this.Storage.set('userQueryLanguage', language);
    const queryEnhancement = this.queryEnhancements.get(language);
    this.search.__enhance({
      searchInterceptor: queryEnhancement
        ? queryEnhancement.search
        : this.search.getDefaultSearchInterceptor(),
    });
    this.setUiOverridesByUserQueryLanguage(language);

    return true;
  }

  getUserQueryString() {
    return this.Storage.get('userQueryString') || '';
  }

  //TODO: create a helper func to set user query that passed in a query object
  setUserQueryString(query: string) {
    this.Storage.set('userQueryString', query);
    return true;
  }

  getUiOverrides() {
    return this.Storage.get('uiOverrides') || {};
  }

  setUiOverrides(overrides?: { [key: string]: any }) {
    if (!overrides) {
      this.Storage.delete('uiOverrides');
      setFieldOverrides(undefined);
      return true;
    }
    this.Storage.set('uiOverrides', overrides);
    setFieldOverrides(overrides.fields);
    return true;
  }

  setUiOverridesByUserQueryLanguage(language: string) {
    const queryEnhancement = this.queryEnhancements.get(language);
    if (queryEnhancement) {
      const { fields = {}, showDocLinks } = queryEnhancement;
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
  storage: IStorageWrapper;
  queryEnhancements: Map<string, QueryEnhancement>;
  queryEditorExtensionMap: Record<string, QueryEditorExtensionConfig>;
}

export function createSettings({
  config,
  search,
  storage,
  queryEnhancements,
  queryEditorExtensionMap,
}: Deps) {
  return new Settings(config, search, storage, queryEnhancements, queryEditorExtensionMap);
}
