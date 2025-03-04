/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace Cypress {
  interface Chainable<Subject> {
    clearQueryEditor(): Chainable<any>;

    setQueryEditor(
      value: string,
      options?: Partial<Cypress.TypeOptions> & { submit?: boolean }
    ): Chainable<any>;

    setQueryLanguage(value: 'DQL' | 'Lucene' | 'OpenSearch SQL' | 'PPL'): Chainable<any>;

    setIndexAsDataset(
      index: string,
      dataSourceName: string,
      language?: 'OpenSearch SQL' | 'PPL',
      timeFieldName?: string,
      finalAction?: string
    ): Chainable<any>;

    setIndexPatternAsDataset(indexPattern: string, dataSourceName: string): Chainable<any>;

    setDataset(
      dataset: string,
      dataSourceName: string,
      type: 'INDEXES' | 'INDEX_PATTERN'
    ): Chainable<any>;

    setIndexPatternFromAdvancedSelector(
      indexPattern: string,
      datraSourceName: string,
      language: string,
      finalAction?: string
    ): Chainable<any>;

    setQuickSelectTime(direction: string, time: number, timeUnit: string): Chainable<any>;
  }
}
