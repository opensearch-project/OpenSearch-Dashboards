/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace Cypress {
  interface Chainable<Subject> {
    setQueryEditor(
      value: string,
      opts?: { parseSpecialCharSequences?: boolean },
      submit?: boolean
    ): Chainable<any>;
    setQueryLanguage(value: 'DQL' | 'Lucene' | 'OpenSearch SQL' | 'PPL'): Chainable<any>;
    addDataSource(opts: {
      name: string;
      url: string;
      auth_type?: string;
      credentials?: { username: string; password: string };
    }): Chainable<any>;
    deleteDataSourceByName(dataSourceName: string): Chainable<any>;
    deleteAllDataSources(): Chainable<any>;
    setIndexAsDataset(
      index: string,
      dataSourceName: string,
      language?: 'OpenSearch SQL' | 'PPL'
    ): Chainable<any>;
    setIndexPatternAsDataset(indexPattern: string, dataSourceName: string): Chainable<any>;
    setDataset(
      dataset: string,
      dataSourceName: string,
      type: 'INDEXES' | 'INDEX_PATTERN'
    ): Chainable<any>;
  }
}
