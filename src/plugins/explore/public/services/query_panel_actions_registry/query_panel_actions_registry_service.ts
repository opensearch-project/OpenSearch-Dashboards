/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IconType } from '@elastic/eui';
import { QueryWithQueryAsString } from '../../application/utils/languages';
import { QueryResultStatus } from '../../application/utils/state_management/types';

// Please update the doc when updating this
export interface QueryPanelActionDependencies {
  /**
   * Currently set Query
   */
  query: QueryWithQueryAsString;
  /**
   * Fetch status for the current query
   */
  resultStatus: QueryResultStatus;
}

// Please update the doc when updating this
export interface QueryPanelActionConfig {
  /**
   * The id for the action
   */
  id: string;
  /**
   * Lower order indicates higher position in the dropdown UI.
   */
  order: number;
  /**
   * A function that determines if the action button is enabled or disabled
   */
  getIsEnabled?(deps: QueryPanelActionDependencies): boolean;
  /**
   * A function that returns the Label of the action item in the dropdown
   */
  getLabel(deps: QueryPanelActionDependencies): string;

  /**
   * A function that returns the icon of the action item in the dropdown
   */
  getIcon?(deps: QueryPanelActionDependencies): IconType;
  /**
   * Callback that gets called when the action is clicked
   */
  onClick(deps: QueryPanelActionDependencies): void;
}

export interface QueryPanelActionsRegistryServiceSetup {
  /**
   * Register an action or a list of actions
   * @param actionConfig
   */
  register: (actionConfig: QueryPanelActionConfig | QueryPanelActionConfig[]) => void;
}

/**
 * Service interface for the query panel actions registry
 * This service allows plugins to register items under the "actions" dropdown in the panel
 * @experimental
 */
export class QueryPanelActionsRegistryService {
  private readonly registry: Map<string, QueryPanelActionConfig> = new Map();

  public setup(): QueryPanelActionsRegistryServiceSetup {
    return {
      register: (actionConfig) => {
        if (Array.isArray(actionConfig)) {
          for (const config of actionConfig) {
            this.registry.set(config.id, config);
          }
        } else {
          this.registry.set(actionConfig.id, actionConfig);
        }
      },
    };
  }

  /**
   * Get the list of registered actions in sorted order
   */
  public getSortedActions(): QueryPanelActionConfig[] {
    return [...this.registry.values()].sort((actionA, actionB) => actionA.order - actionB.order);
  }

  /**
   * Whether the registry is empty or not
   */
  public isEmpty(): boolean {
    return this.registry.size === 0;
  }
}
