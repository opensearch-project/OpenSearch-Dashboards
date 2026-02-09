/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IconType } from '@elastic/eui';
import { QueryWithQueryAsString } from '../../application/utils/languages';
import { QueryResultStatus } from '../../application/utils/state_management/types';
// @ts-expect-error TS6133, TS2307 TODO(ts-error): fixme
import { Dataset } from '../../../../../data/common';
// @ts-expect-error TS6133, TS2307 TODO(ts-error): fixme
import { TimeRange } from '../../../../../data/public';
import { ExploreServices } from '../../types';

// Please update the doc when updating this
export interface QueryPanelActionDependencies {
  /**
   * Last executed query (includes query string, language, and dataset)
   */
  query: QueryWithQueryAsString;
  /**
   * Query execution status (loading, success, error, etc.)
   */
  resultStatus: QueryResultStatus;
  /**
   * Current query string in the editor (may differ from executed query)
   * This is what the user is currently typing/editing
   */
  queryInEditor: string;
}

/**
 * Props passed to flyout components
 */
export interface FlyoutComponentProps {
  /**
   * Function to close the flyout
   */
  closeFlyout: () => void;
  /**
   * All context data available to the flyout
   */
  dependencies: QueryPanelActionDependencies;
  /**
   * OpenSearch Dashboards services
   */
  services: ExploreServices;
}

/**
 * Base configuration shared by all action types
 */
interface BaseActionConfig {
  /**
   * Unique identifier for the action
   */
  id: string;
  /**
   * Display order in dropdown (lower = higher position)
   */
  order: number;
  /**
   * Function to determine if action is enabled
   */
  getIsEnabled?(deps: QueryPanelActionDependencies): boolean;
  /**
   * Function to get the action label
   */
  getLabel(deps: QueryPanelActionDependencies): string;
  /**
   * Function to get the action icon
   */
  getIcon?(deps: QueryPanelActionDependencies): IconType;
}

/**
 * Button action configuration (existing behavior)
 */
export interface ButtonActionConfig extends BaseActionConfig {
  /**
   * Type discriminator
   */
  actionType: 'button';
  /**
   * Callback when action is clicked
   */
  onClick(deps: QueryPanelActionDependencies): void;
}

/**
 * Flyout action configuration (new behavior)
 */
export interface FlyoutActionConfig extends BaseActionConfig {
  /**
   * Type discriminator
   */
  actionType: 'flyout';
  /**
   * React component to render in flyout
   * Component must render the complete EuiFlyout structure
   */
  component: React.ComponentType<FlyoutComponentProps>;
  /**
   * Optional callback when flyout opens
   */
  onFlyoutOpen?(deps: QueryPanelActionDependencies): void;
}

/**
 * Union type for all action configurations
 */
export type QueryPanelActionConfig = ButtonActionConfig | FlyoutActionConfig;

/**
 * Legacy action configuration for backward compatibility
 * Actions without actionType will be treated as button actions
 */
export interface LegacyActionConfig extends Omit<BaseActionConfig, 'actionType'> {
  onClick(deps: QueryPanelActionDependencies): void;
}

export interface QueryPanelActionsRegistryServiceSetup {
  /**
   * Register an action or a list of actions
   * Supports both button actions and flyout actions
   * Legacy actions without actionType are treated as button actions
   * @param actionConfig - Action configuration or array of configurations
   */
  register: (
    actionConfig:
      | QueryPanelActionConfig
      | LegacyActionConfig
      | Array<QueryPanelActionConfig | LegacyActionConfig>
  ) => void;
}

/**
 * Service interface for the query panel actions registry
 * This service allows plugins to register items under the "actions" dropdown in the panel
 * Supports both button actions (simple onClick) and flyout actions (render React component)
 * @experimental
 */
export class QueryPanelActionsRegistryService {
  private readonly registry: Map<string, QueryPanelActionConfig> = new Map();

  public setup(): QueryPanelActionsRegistryServiceSetup {
    return {
      register: (actionConfig) => {
        const configs = Array.isArray(actionConfig) ? actionConfig : [actionConfig];

        for (const config of configs) {
          // Validate and normalize config
          const normalizedConfig = this.normalizeConfig(config);
          this.validateConfig(normalizedConfig);

          // Store in registry
          this.registry.set(normalizedConfig.id, normalizedConfig);
        }
      },
    };
  }

  /**
   * Normalize config to ensure it has actionType
   * Legacy configs without actionType are converted to button actions
   */
  private normalizeConfig(
    config: QueryPanelActionConfig | LegacyActionConfig
  ): QueryPanelActionConfig {
    // Check if config has actionType
    if ('actionType' in config) {
      return config;
    }

    // Legacy config - convert to button action
    const legacyConfig = config as LegacyActionConfig;
    return {
      ...legacyConfig,
      actionType: 'button',
    } as ButtonActionConfig;
  }

  /**
   * Validate action configuration
   */
  private validateConfig(config: QueryPanelActionConfig): void {
    // Required fields
    if (!config.id) {
      throw new Error('Action must have an id');
    }
    if (typeof config.order !== 'number') {
      throw new Error('Action must have an order');
    }
    if (!config.getLabel) {
      throw new Error('Action must have getLabel function');
    }

    // Check for duplicate IDs
    if (this.registry.has(config.id)) {
      throw new Error(`Action with id "${config.id}" is already registered`);
    }

    // Type-specific validation
    if (config.actionType === 'button') {
      const buttonConfig = config as ButtonActionConfig;
      if (!buttonConfig.onClick) {
        throw new Error(`Button action "${config.id}" must have onClick function`);
      }
    } else if (config.actionType === 'flyout') {
      const flyoutConfig = config as FlyoutActionConfig;
      if (!flyoutConfig.component) {
        throw new Error(`Flyout action "${config.id}" must have component`);
      }
      if (typeof flyoutConfig.component !== 'function') {
        throw new Error(`Flyout action "${config.id}" component must be a React component`);
      }
    } else {
      throw new Error(`Unknown action type: ${(config as any).actionType}`);
    }
  }

  /**
   * Get the list of registered actions in sorted order
   */
  public getSortedActions(): QueryPanelActionConfig[] {
    return [...this.registry.values()].sort((actionA, actionB) => actionA.order - actionB.order);
  }

  /**
   * Get only button actions in sorted order
   */
  public getButtonActions(): ButtonActionConfig[] {
    return this.getSortedActions().filter(
      (action): action is ButtonActionConfig => action.actionType === 'button'
    );
  }

  /**
   * Get only flyout actions in sorted order
   */
  public getFlyoutActions(): FlyoutActionConfig[] {
    return this.getSortedActions().filter(
      (action): action is FlyoutActionConfig => action.actionType === 'flyout'
    );
  }

  /**
   * Get a specific action by ID
   */
  public getAction(id: string): QueryPanelActionConfig | undefined {
    return this.registry.get(id);
  }

  /**
   * Whether the registry is empty or not
   */
  public isEmpty(): boolean {
    return this.registry.size === 0;
  }
}
