/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageConfig } from './types';
import { getDQLLanguageConfig, getLuceneLanguageConfig } from './lib';
import { ISearchInterceptor } from '../../../search';

export class LanguageService {
  private languages: Map<string, LanguageConfig> = new Map();

  constructor(private readonly defaultSearchInterceptor: ISearchInterceptor) {
    this.registerDefaultLanguages();
  }

  /**
   * Registers default handlers for index patterns and indices.
   */
  private registerDefaultLanguages() {
    this.registerLanguage(getDQLLanguageConfig(this.defaultSearchInterceptor));
    this.registerLanguage(getLuceneLanguageConfig(this.defaultSearchInterceptor));
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
