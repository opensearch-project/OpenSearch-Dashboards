/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-console */

import { BehaviorSubject } from 'rxjs';
import { AssistantContextOptions, AssistantContextStore } from '../types';

/**
 * Store for managing assistant contexts with category-based organization
 */
export class AssistantContextStoreImpl implements AssistantContextStore {
  private contextsByCategory = new Map<string, AssistantContextOptions[]>();
  private contexts$ = new BehaviorSubject<AssistantContextOptions[]>([]);

  /**
   * Add a new context to the store
   * - If context has an ID: remove existing context with same ID, then add (allows accumulation)
   * - If context has no ID: clear the category first, then add (replaces previous contexts)
   */
  addContext(options: AssistantContextOptions): void {
    const categories = options.categories || ['default'];

    if (options.id) {
      // Context with ID: Remove any existing context with the same ID first
      // This allows multiple contexts with different IDs to coexist
      this.removeContextById(options.id);
    } else {
      // Context without ID: Clear existing contexts in these categories first
      // This ensures only one context without ID exists per category (e.g., page context)
      categories.forEach((category) => {
        const categoryContexts = this.contextsByCategory.get(category) || [];
        const filteredContexts = categoryContexts.filter((context) => context.id);
        this.contextsByCategory.set(category, filteredContexts);
      });
    }

    // Add the new context to all specified categories
    categories.forEach((category) => {
      const categoryContexts = this.contextsByCategory.get(category) || [];
      categoryContexts.push(options);
      this.contextsByCategory.set(category, categoryContexts);
    });

    // Notify subscribers
    this.emitContexts();
  }

  /**
   * Remove a context by its ID from all categories
   */
  removeContextById(id: string): void {
    this.contextsByCategory.forEach((contexts, category) => {
      const filteredContexts = contexts.filter((context) => context.id !== id);
      this.contextsByCategory.set(category, filteredContexts);
    });

    // Notify subscribers of the change
    this.emitContexts();
  }

  /**
   * Get all contexts for a specific category
   */
  getContextsByCategory(category: string): AssistantContextOptions[] {
    return this.contextsByCategory.get(category) || [];
  }

  /**
   * Get all contexts from all categories
   */
  getAllContexts(): AssistantContextOptions[] {
    const allContexts: AssistantContextOptions[] = [];
    const seen = new Set<string>();

    // Collect unique contexts from all categories
    this.contextsByCategory.forEach((contexts) => {
      contexts.forEach((context) => {
        const key = `${context.description}-${JSON.stringify(context.value)}`;
        if (!seen.has(key)) {
          seen.add(key);
          allContexts.push(context);
        }
      });
    });

    return allContexts;
  }

  /**
   * Clear all contexts in a specific category
   */
  clearCategory(category: string): void {
    this.contextsByCategory.delete(category);
    this.emitContexts();
    console.log(`🧹 Cleared category: ${category}`);
  }

  /**
   * Clear all contexts
   */
  clearAll(): void {
    this.contextsByCategory.clear();
    this.emitContexts();
    console.log('🧹 Cleared all contexts');
  }

  /**
   * Subscribe to context changes
   */
  subscribe(callback: (contexts: AssistantContextOptions[]) => void): () => void {
    const subscription = this.contexts$.subscribe((contexts) => {
      callback(contexts);
    });

    // Return unsubscribe function
    return () => subscription.unsubscribe();
  }

  /**
   * Get contexts formatted for backend (no label)
   */
  getBackendFormattedContexts(category?: string): Array<{ description: string; value: any }> {
    const contexts = category ? this.getContextsByCategory(category) : this.getAllContexts();

    return contexts.map((context) => ({
      description: context.description,
      value: context.value,
    }));
  }

  /**
   * Emit current contexts to subscribers
   */
  private emitContexts(): void {
    this.contexts$.next(this.getAllContexts());
  }
}
