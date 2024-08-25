/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from 'opensearch-dashboards/public';
import { UI_SETTINGS } from '../../../../common';
import { LanguageConfig } from './types';
import { getDQLLanguageConfig, getLuceneLanguageConfig } from './lib';
import { getSearchService } from '../../../services';

export class LanguageService {
  private languages: Map<string, LanguageConfig> = new Map();

  constructor(private readonly uiSettings: CoreStart['uiSettings']) {}

  public async init(): Promise<void> {
    if (!this.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED)) return;
    this.registerDefaultLanguages();
  }

  /**
   * Registers default handlers for index patterns and indices.
   */
  private registerDefaultLanguages() {
    this.registerLanguage(getDQLLanguageConfig(getSearchService()));
    this.registerLanguage(getLuceneLanguageConfig(getSearchService()));
  }

  public registerLanguage(config: LanguageConfig): void {
    this.languages.set(config.id, config);
  }

  public getLanguage(language: string): LanguageConfig | undefined {
    return this.languages.get(language);
  }

  public getLanguages(): LanguageConfig[] {
    return Array.from(this.languages.values());
  }

  public getDefaultLanguage(): LanguageConfig {
    return this.languages.get('kuery') || this.languages.values().next().value;
  }
}

export type LanguageServiceContract = PublicMethodsOf<LanguageService>;
