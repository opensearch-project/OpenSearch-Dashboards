/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Basic setup for actions registry, this is not scope for P0.
// Make changes if required after P0 and test with external plugins.

export interface QueryBarAction {
  id: string; // Unique identifier for the action
  label: string;
  onClick: () => void;
  iconType?: string;
  order?: number; // Lower numbers are rendered first
}

export class QueryBarActionsRegistry {
  private actions: QueryBarAction[] = [];

  register(action: QueryBarAction) {
    this.actions.push(action);
  }

  getAll(): QueryBarAction[] {
    // Sort by order (ascending), then by id for stable ordering
    return [...this.actions].sort((a, b) => {
      if (a.order === b.order) return a.id.localeCompare(b.id);
      if (a.order == null) return 1;
      if (b.order == null) return -1;
      return a.order - b.order;
    });
  }

  clear() {
    this.actions = [];
  }
}

export const queryBarActionsRegistry = new QueryBarActionsRegistry();
