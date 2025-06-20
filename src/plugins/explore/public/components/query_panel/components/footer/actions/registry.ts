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

// export const queryBarActionsRegistry = new QueryBarActionsRegistry();

// TODO: This is mock data for storybook demo, replace this above line commented.
export const queryBarActionsRegistry = {
  getAll: () => [
    {
      id: 'alert',
      label: 'Set up an alert from query',
      iconType: 'bell', // Icon for alert
      onClick: () => {},
      order: 1,
    },
    {
      id: 'anomalyDetection',
      label: 'Suggest anomaly detection',
      iconType: 'anomalyDetection', // Icon for anomaly detection
      onClick: () => {},
      order: 2,
    },
  ],
};
