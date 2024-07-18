/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { IStorageWrapper } from '../../../../opensearch_dashboards_utils/public';
import { setOverrides as setFieldOverrides } from '../../../common';
import { ConfigSchema } from '../../../config';
import { ISearchStart } from '../../search';
import { QueryEditorExtensionConfig } from '../query_editor/query_editor_extensions';
import { QueryEnhancement } from '../types';

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
  private selectedDataSet$ = new BehaviorSubject<any>(null);

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
    this.setSelectedDataSet(this.getSelectedDataSet());
  }

  setSelectedDataSet = (dataSet: any) => {
    this.storage.set('opensearchDashboards.userQueryDataSet', dataSet);
    this.selectedDataSet$.next(dataSet);
  };

  getSelectedDataSet$ = () => {
    return this.selectedDataSet$.asObservable();
  };

  getSelectedDataSet = () => {
    return this.storage.get('opensearchDashboards.userQueryDataSet');
  };

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

  getAllQueryEnhancements() {
    return this.queryEnhancements;
  }

  getQueryEnhancements(language: string) {
    return this.queryEnhancements.get(language);
  }

  getQueryEditorExtensionMap() {
    return this.queryEditorExtensionMap;
  }

  getUserQueryLanguageBlocklist() {
    return this.storage.get('opensearchDashboards.userQueryLanguageBlocklist') || [];
  }

  setUserQueryLanguageBlocklist(languages: string[]) {
    this.storage.set(
      'opensearchDashboards.userQueryLanguageBlocklist',
      languages.map((language) => language.toLowerCase())
    );
    return true;
  }

  getUserQueryLanguage() {
    return this.storage.get('opensearchDashboards.userQueryLanguage') || 'kuery';
  }

  setUserQueryLanguage(language: string) {
    this.storage.set('opensearchDashboards.userQueryLanguage', language);
    this.search.df.clear();
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
    return this.storage.get('opensearchDashboards.userQueryString') || '';
  }

  setUserQueryString(query: string) {
    this.storage.set('opensearchDashboards.userQueryString', query);
    return true;
  }

  getUiOverrides() {
    return this.storage.get('opensearchDashboards.uiOverrides') || {};
  }

  setUiOverrides(overrides?: { [key: string]: any }) {
    if (!overrides) {
      this.storage.remove('opensearchDashboards.uiOverrides');
      setFieldOverrides(undefined);
      return true;
    }
    this.storage.set('opensearchDashboards.uiOverrides', overrides);
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
