/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Basic setup for actions registry, this is not scope for P0.
// Make changes if required after P0 and test with external plugins.

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

// export const queryBarActionsRegistry = new QueryBarActionsRegistry();

// TODO: This is mock data for storybook demo, replace this above line commented.
export const queryBarActionsRegistry = {
  getAll: () => [
    {
      label: 'Set up an alert from query',
      iconType: 'bell', // Icon for alert
      onClick: () => {},
    },
    {
      label: 'Suggest anomaly detection',
      iconType: 'anomalyDetection', // Icon for anomaly detection
      onClick: () => {},
    },
  ],
};
