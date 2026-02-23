/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';
import { monaco } from '@osd/monaco';
import { QuerySuggestion } from '../../autocomplete';
import { SuggestionItemDetailsTags } from '../shared/constants';
import { PPLArtifacts } from './ppl_artifact_loader';

/**
 * Singleton service to manage PPL catalog data from backend artifacts
 */
class PPLCatalogProvider {
  private artifacts: PPLArtifacts | null = null;
  private loading: Promise<PPLArtifacts | null> | null = null;

  /**
   * Initialize the catalog by fetching artifacts from backend
   */
  async initialize(http: HttpSetup, dataSourceId?: string): Promise<void> {
    // If already loading, wait for that to complete
    if (this.loading) {
      await this.loading;
      return;
    }

    // If already initialized, skip
    if (this.artifacts) {
      return;
    }

    // Start loading
    // TODO: This provider is deprecated. Use pplGrammarCache instead.
    this.artifacts = null;
    this.loading = null;
  }

  /**
   * Get the loaded artifacts
   */
  getArtifacts(): PPLArtifacts | null {
    return this.artifacts;
  }

  /**
   * Check if artifacts are loaded
   */
  isInitialized(): boolean {
    return this.artifacts !== null;
  }

  /**
   * Force refresh artifacts from backend
   */
  async refresh(http: HttpSetup, dataSourceId?: string): Promise<void> {
    this.artifacts = null;
    await this.initialize(http, dataSourceId);
  }

  /**
   * Get command suggestions from catalog
   */
  getCommandSuggestions(): QuerySuggestion[] {
    if (!this.artifacts?.catalogs.commands) {
      return [];
    }

    return this.artifacts.catalogs.commands.map((cmd) => ({
      text: cmd.name,
      type: monaco.languages.CompletionItemKind.Keyword,
      insertText: cmd.snippet || `${cmd.name} `,
      detail: SuggestionItemDetailsTags.Keyword,
      documentation: cmd.description,
      ...(cmd.snippet && {
        insertTextRules: monaco.languages.CompletionItemInsertTextRule?.InsertAsSnippet,
      }),
    }));
  }

  /**
   * Get function suggestions from catalog
   */
  getFunctionSuggestions(): QuerySuggestion[] {
    if (!this.artifacts?.catalogs.functions) {
      return [];
    }

    return this.artifacts.catalogs.functions.map((func) => ({
      text: `${func.name}()`,
      type: monaco.languages.CompletionItemKind.Function,
      insertText: func.snippet || `${func.name}($0)`,
      detail: SuggestionItemDetailsTags.Function,
      documentation: func.description || func.signature,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule?.InsertAsSnippet,
    }));
  }

  /**
   * Get keyword suggestions from catalog
   */
  getKeywordSuggestions(): QuerySuggestion[] {
    if (!this.artifacts?.catalogs.keywords) {
      return [];
    }

    return this.artifacts.catalogs.keywords.map((kw) => ({
      text: kw.name,
      type: monaco.languages.CompletionItemKind.Keyword,
      insertText: `${kw.name} `,
      detail: SuggestionItemDetailsTags.Keyword,
      documentation: kw.description,
    }));
  }

  /**
   * Get operator suggestions from catalog
   */
  getOperatorSuggestions(): QuerySuggestion[] {
    if (!this.artifacts?.catalogs.operators) {
      return [];
    }

    return this.artifacts.catalogs.operators.map((op) => ({
      text: op.name,
      type: monaco.languages.CompletionItemKind.Operator,
      insertText: `${op.name} `,
      detail: op.type || SuggestionItemDetailsTags.Keyword,
      documentation: op.description,
    }));
  }

  /**
   * Get snippet suggestions from catalog
   */
  getSnippetSuggestions(): QuerySuggestion[] {
    if (!this.artifacts?.catalogs.snippets) {
      return [];
    }

    return this.artifacts.catalogs.snippets.map((snippet) => ({
      text: snippet.label,
      type: monaco.languages.CompletionItemKind.Snippet,
      insertText: snippet.insertText,
      detail: 'Snippet',
      documentation: snippet.description,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule?.InsertAsSnippet,
    }));
  }

  /**
   * Get all catalog suggestions (for empty query)
   */
  getAllCatalogSuggestions(): QuerySuggestion[] {
    return [
      ...this.getCommandSuggestions(),
      ...this.getKeywordSuggestions(),
      ...this.getFunctionSuggestions(),
      ...this.getSnippetSuggestions(),
    ];
  }

  /**
   * Clear cached artifacts
   */
  clear(): void {
    this.artifacts = null;
    this.loading = null;
  }
}

// Export singleton instance
export const pplCatalogProvider = new PPLCatalogProvider();
