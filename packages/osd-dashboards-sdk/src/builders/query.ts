/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryDefinition, QueryLanguage } from '../types';

/**
 * Builder for query definitions with static factory methods for each language.
 */
export class Query {
  private readonly definition: QueryDefinition;

  private constructor(language: QueryLanguage, query: string) {
    if (!query || query.trim().length === 0) {
      throw new Error('Query string must not be empty');
    }
    this.definition = { language, query };
  }

  /**
   * Create a PPL query.
   */
  static ppl(query: string): Query {
    return new Query('PPL', query);
  }

  /**
   * Create a DQL query.
   */
  static dql(query: string): Query {
    return new Query('DQL', query);
  }

  /**
   * Create a SQL query.
   */
  static sql(query: string): Query {
    return new Query('SQL', query);
  }

  /**
   * Create a Lucene query.
   */
  static lucene(query: string): Query {
    return new Query('Lucene', query);
  }

  /**
   * Build and return the query definition.
   */
  build(): QueryDefinition {
    return { ...this.definition };
  }
}
