/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { QueryEnhancement, UiEnhancements } from '../../../ui/types';
import { QueryEditorExtensionConfig } from '../../../ui';
import { ConfigSchema } from '../../../../config';
import { DataStorage, setOverrides as setFieldOverrides } from '../../../../common';

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

export class LanguageManager {
  private isEnabled = false;
  private enabledQueryEnhancementsUpdated$ = new BehaviorSubject<boolean>(this.isEnabled);
  private enhancedAppNames: string[] = [];
  private queryEnhancements: Map<string, QueryEnhancement>;
  private queryEditorExtensionMap: Record<string, QueryEditorExtensionConfig>;

  constructor(
    private readonly config: ConfigSchema['enhancements'],
    private readonly storage: DataStorage
  ) {
    this.isEnabled = true;
    this.setUserQueryEnhancementsEnabled(this.isEnabled);
    this.enhancedAppNames = this.isEnabled ? this.config.supportedAppNames : [];
    this.queryEnhancements = new Map();
    this.queryEditorExtensionMap = {};
  }

  public __enhance = (enhancements: UiEnhancements) => {
    if (!enhancements) return;
    if (enhancements.query && enhancements.query.language) {
      this.queryEnhancements.set(enhancements.query.language, enhancements.query);
    }
    if (enhancements.queryEditorExtension) {
      this.queryEditorExtensionMap[enhancements.queryEditorExtension.id] =
        enhancements.queryEditorExtension;
    }
  };

  public getAllQueryEnhancements() {
    return this.queryEnhancements;
  }

  public getQueryEnhancements(language: string) {
    return this.queryEnhancements.get(language);
  }

  public getQueryEditorExtensionMap() {
    return this.queryEditorExtensionMap;
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

export type LanguageContract = PublicMethodsOf<LanguageManager>;
