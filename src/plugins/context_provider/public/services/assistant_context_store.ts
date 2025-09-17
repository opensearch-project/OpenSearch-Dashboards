/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-console */

import { BehaviorSubject } from 'rxjs';
import { AssistantContextOptions, ContextEntry, AssistantContextStore } from '../types';

/**
 * Store for managing assistant contexts with category-based organization
 */
export class AssistantContextStoreImpl implements AssistantContextStore {
  private contexts = new Map<string, ContextEntry>();
  private categoryIndex = new Map<string, Set<string>>();
  private contexts$ = new BehaviorSubject<ContextEntry[]>([]);
  private nextId = 1;

  /**
   * Add a new context to the store
   */
  addContext(options: AssistantContextOptions): string {
    const id = options.id || `context_${this.nextId++}`;

    const entry: ContextEntry = {
      ...options,
      id,
      timestamp: Date.now(),
    };

    // Add to main store
    this.contexts.set(id, entry);

    // Update category indexes
    const categories = options.categories || ['default'];
    categories.forEach((category) => {
      if (!this.categoryIndex.has(category)) {
        this.categoryIndex.set(category, new Set());
      }
      this.categoryIndex.get(category)!.add(id);
    });

    // Notify subscribers
    this.emitContexts();

    console.log(`📝 Added context: ${id} with categories: ${categories.join(', ')}`);
    return id;
  }

  /**
   * Remove a context from the store
   */
  removeContext(id: string): void {
    const context = this.contexts.get(id);
    if (!context) return;

    // Remove from category indexes
    const categories = context.categories || ['default'];
    categories.forEach((category) => {
      const categorySet = this.categoryIndex.get(category);
      if (categorySet) {
        categorySet.delete(id);
        if (categorySet.size === 0) {
          this.categoryIndex.delete(category);
        }
      }
    });

    // Remove from main store
    this.contexts.delete(id);

    // Notify subscribers
    this.emitContexts();

    console.log(`🗑️ Removed context: ${id}`);
  }

  /**
   * Get all contexts for a specific category
   */
  getContextsByCategory(category: string): ContextEntry[] {
    const contextIds = this.categoryIndex.get(category);
    if (!contextIds) return [];

    return Array.from(contextIds)
      .map((id) => this.contexts.get(id))
      .filter((context): context is ContextEntry => context !== undefined)
      .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  }

  /**
   * Get all contexts
   */
  getAllContexts(): ContextEntry[] {
    return Array.from(this.contexts.values()).sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  }

  /**
   * Clear all contexts in a specific category
   */
  clearCategory(category: string): void {
    const contextIds = this.categoryIndex.get(category);
    if (!contextIds) return;

    // Remove each context in the category
    contextIds.forEach((id) => {
      const context = this.contexts.get(id);
      if (context) {
        // Check if context has other categories
        const otherCategories = (context.categories || []).filter((c) => c !== category);
        if (otherCategories.length > 0) {
          // Update context to remove this category
          context.categories = otherCategories;
        } else {
          // Remove context entirely if no other categories
          this.contexts.delete(id);
        }
      }
    });

    // Clear the category index
    this.categoryIndex.delete(category);

    // Notify subscribers
    this.emitContexts();

    console.log(`🧹 Cleared category: ${category}`);
  }

  /**
   * Clear all contexts
   */
  clearAll(): void {
    this.contexts.clear();
    this.categoryIndex.clear();
    this.emitContexts();

    console.log('🧹 Cleared all contexts');
  }

  /**
   * Subscribe to context changes
   */
  subscribe(callback: (contexts: ContextEntry[]) => void): () => void {
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
