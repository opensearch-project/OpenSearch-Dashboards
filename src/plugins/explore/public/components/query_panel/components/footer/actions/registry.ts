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

// export const queryBarActionsRegistry = new QueryBarActionsRegistry();
export const queryBarActionsRegistry = {
  getAll: () => [
    {
      label: 'Set up an alert from query',
      iconType: 'bell', // Icon for alert
      onClick: () => {
        console.log('Set up an alert from query clicked');
      },
    },
    {
      label: 'Suggest anomaly detection',
      iconType: 'anomalyDetection', // Icon for anomaly detection
      onClick: () => {
        console.log('Suggest anomaly detection clicked');
      },
    },
  ],
};
