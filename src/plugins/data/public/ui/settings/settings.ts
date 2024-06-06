/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { IStorageWrapper } from '../../../../opensearch_dashboards_utils/public';
import { setOverrides as setFieldOverrides } from '../../../common';
import { QueryEnhancement } from '../types';

export interface DataSettings {
  // TODO: MQL datasource: we should consider this
  // userQueryDataSource: string;
  userQueryEnhancementsEnabled: boolean;
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
  private enabledQueryEnhancementsUpdated$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly isQueryEnhancementsEnabled: boolean,
    private readonly storage: IStorageWrapper,
    private readonly queryEnhancements: Map<string, QueryEnhancement>
  ) {
    this.enabledQueryEnhancementsUpdated$.next(this.isQueryEnhancementsEnabled);
  }

  // getUserQueryDataSource() {
  //   return this.storage.get('opensearchDashboards.userQueryDataSource') || 'default';
  // }

  // setUserQueryDataSource(dataSource: string) {
  //   this.storage.set('opensearchDashboards.userQueryDataSource', dataSource);
  //   return true;
  // }

  getEnabledQueryEnhancementsUpdated$ = () => {
    return this.enabledQueryEnhancementsUpdated$.asObservable();
  };

  getUserQueryEnhancementsEnabled() {
    return (
      this.storage.get('opensearchDashboards.userQueryEnhancementsEnabled') ||
      this.isQueryEnhancementsEnabled
    );
  }

  setUserQueryEnhancementsEnabled(enabled: boolean) {
    if (!this.isQueryEnhancementsEnabled) return;
    this.storage.set('opensearchDashboards.userQueryEnhancementsEnabled', enabled);
    this.enabledQueryEnhancementsUpdated$.next(enabled);
    return true;
  }

  getUserQueryLanguage() {
    return this.storage.get('opensearchDashboards.userQueryLanguage') || 'kuery';
  }

  setUserQueryLanguage(language: string) {
    this.storage.set('opensearchDashboards.userQueryLanguage', language);
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
      // userQueryDataSource: this.getUserQueryDataSource(),
      userQueryEnhancementsEnabled: this.getUserQueryEnhancementsEnabled(),
      userQueryLanguage: this.getUserQueryLanguage(),
      userQueryString: this.getUserQueryString(),
      uiOverrides: this.getUiOverrides(),
    };
  }

  updateSettings({
    userQueryEnhancementsEnabled,
    userQueryLanguage,
    userQueryString,
    uiOverrides,
  }: DataSettings) {
    // this.setUserQueryDataSource(userQueryDataSource);
    this.setUserQueryEnhancementsEnabled(userQueryEnhancementsEnabled);
    this.setUserQueryLanguage(userQueryLanguage);
    this.setUserQueryString(userQueryString);
    this.setUiOverrides(uiOverrides);
  }
}

interface Deps {
  isQueryEnhancementsEnabled: boolean;
  storage: IStorageWrapper;
  queryEnhancements: Map<string, QueryEnhancement>;
}

export function createSettings({ isQueryEnhancementsEnabled, storage, queryEnhancements }: Deps) {
  return new Settings(isQueryEnhancementsEnabled, storage, queryEnhancements);
}
