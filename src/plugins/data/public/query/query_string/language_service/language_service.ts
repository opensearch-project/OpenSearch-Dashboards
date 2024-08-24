/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from 'opensearch-dashboards/public';
import { UI_SETTINGS } from 'src/plugins/data/common';
import { LanguageConfig } from './types';
import { dqlLanguageConfig, luceneLanguageConfig } from './lib';

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
    this.registerLanguage(dqlLanguageConfig);
    this.registerLanguage(luceneLanguageConfig);
  }

  public registerLanguage(config: LanguageConfig): void {
    this.languages.set(config.id, config);
  }

  public getLanguage(language: string): LanguageConfig | undefined {
    return this.languages.get(language);
  }

  public getLanguages(): string[] {
    return Array.from(this.languages.keys());
  }

  public getDefaultLanguage(): LanguageConfig {
    return this.languages.get('kuery') || this.languages.values().next().value;
  }
}

export type LanguageServiceContract = PublicMethodsOf<LanguageService>;
