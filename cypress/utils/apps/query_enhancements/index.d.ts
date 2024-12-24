/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace Cypress {
  interface Chainable<Subject> {
    setSingleLineQueryEditor(value: string, submit?: boolean): Chainable<any>;
    setQueryLanguage(value: 'DQL' | 'Lucene' | 'OpenSearch SQL' | 'PPL'): Chainable<any>;
    addDataSource(opts: {
      name: string;
      url: string;
      auth_type?: string;
      credentials?: { username: string; password: string };
    }): Chainable<any>;
    deleteDataSourceByName(dataSourceName: string): Chainable<any>;
  }
}
