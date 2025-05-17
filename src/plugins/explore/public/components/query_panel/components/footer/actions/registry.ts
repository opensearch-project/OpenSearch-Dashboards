/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QueryBarAction {
  label: string;
  onClick: () => void;
}

export class QueryBarActionsRegistry {
  private actions: QueryBarAction[] = [];

  register(action: QueryBarAction) {
    this.actions.push(action);
  }

  getAll(): QueryBarAction[] {
    return [...this.actions];
  }

  clear() {
    this.actions = [];
  }
}

export const queryBarActionsRegistry = new QueryBarActionsRegistry();
