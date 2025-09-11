/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContextService } from './context_service';
import { AIAgentContext } from '../utils/context_transformer';

/**
 * Result of an action execution
 */
export interface ActionResult {
  success: boolean;
  actionType: string;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Parameters for different action types
 */
export interface AddFilterParams {
  field: string;
  value: any;
  operator?: 'is' | 'is not' | 'contains' | 'does not contain';
  negate?: boolean;
}

export interface RemoveFilterParams {
  filterId?: string;
  field?: string;
  value?: any;
}

export interface TimeRangeParams {
  from: string;
  to: string;
  mode?: 'absolute' | 'relative';
}

export interface NavigateParams {
  app: 'dashboard' | 'discover' | 'visualize';
  id?: string;
  query?: any;
  filters?: any[];
}

/**
 * Service for executing actions through the context provider
 * Handles action responses and UI updates
 */
export class ActionExecutor {
  private contextService: ContextService;

  constructor(contextService: ContextService) {
    this.contextService = contextService;
  }

  /**
   * Execute any action with proper error handling
   */
  async executeAction(
    actionType: string,
    params: any,
    context?: AIAgentContext[]
  ): Promise<ActionResult> {
    try {
      // eslint-disable-next-line no-console
      console.log(`[ActionExecutor] Executing action: ${actionType}`, params);

      // Get available actions to validate
      const availableActions = this.contextService.getAvailableActions();
      if (!availableActions.includes(actionType)) {
        throw new Error(
          `Action ${actionType} is not available. Available actions: ${availableActions.join(', ')}`
        );
      }

      // Execute the action through context provider
      const result = await this.contextService.executeAction(actionType, params);

      // Process the result and provide user feedback
      const actionResult: ActionResult = {
        success: true,
        actionType,
        message: this.getSuccessMessage(actionType, params, result),
        data: result,
      };

      // eslint-disable-next-line no-console
      console.log(`[ActionExecutor] Action executed successfully:`, actionResult);
      return actionResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      // eslint-disable-next-line no-console
      console.error(`[ActionExecutor] Action failed: ${actionType}`, error);

      return {
        success: false,
        actionType,
        message: `Failed to ${actionType.toLowerCase().replace('_', ' ')}: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  /**
   * Add a filter to the current view
   */
  async addFilter(params: AddFilterParams, context?: AIAgentContext[]): Promise<ActionResult> {
    const actionParams = {
      field: params.field,
      value: params.value,
      operator: params.operator || 'is',
      negate: params.negate || false,
      ...this.getContextualParams(context),
    };

    return this.executeAction('ADD_FILTER', actionParams, context);
  }

  /**
   * Remove a filter from the current view
   */
  async removeFilter(
    params: RemoveFilterParams,
    context?: AIAgentContext[]
  ): Promise<ActionResult> {
    const actionParams = {
      ...params,
      ...this.getContextualParams(context),
    };

    return this.executeAction('REMOVE_FILTER', actionParams, context);
  }

  /**
   * Change the time range
   */
  async changeTimeRange(
    params: TimeRangeParams,
    context?: AIAgentContext[]
  ): Promise<ActionResult> {
    const actionParams = {
      timeRange: {
        from: params.from,
        to: params.to,
        mode: params.mode || 'absolute',
      },
      ...this.getContextualParams(context),
    };

    return this.executeAction('CHANGE_TIME_RANGE', actionParams, context);
  }

  /**
   * Refresh the current data view
   */
  async refreshData(context?: AIAgentContext[]): Promise<ActionResult> {
    const actionParams = {
      ...this.getContextualParams(context),
    };

    return this.executeAction('REFRESH_DATA', actionParams, context);
  }

  /**
   * Navigate to a specific app/view
   */
  async navigateTo(params: NavigateParams, context?: AIAgentContext[]): Promise<ActionResult> {
    let actionType: string;

    switch (params.app) {
      case 'dashboard':
        actionType = 'NAVIGATE_TO_DASHBOARD';
        break;
      case 'discover':
        actionType = 'NAVIGATE_TO_DISCOVER';
        break;
      default:
        throw new Error(`Navigation to ${params.app} is not supported`);
    }

    const actionParams = {
      id: params.id,
      query: params.query,
      filters: params.filters,
      ...this.getContextualParams(context),
    };

    return this.executeAction(actionType, actionParams, context);
  }

  /**
   * Get available actions from the context provider
   */
  getAvailableActions(): string[] {
    return this.contextService.getAvailableActions();
  }

  /**
   * Extract contextual parameters for actions
   */
  private getContextualParams(context?: AIAgentContext[]): Record<string, any> {
    if (!context || context.length === 0) {
      return {};
    }

    // Use the most recent context
    const currentContext = context[context.length - 1];

    return {
      appId: currentContext.appId,
      contextType: currentContext.type,
      dashboardId: currentContext.data.dashboardId,
      indexPattern: currentContext.data.indexPattern,
    };
  }

  /**
   * Generate success messages for different action types
   */
  private getSuccessMessage(actionType: string, params: any, result?: any): string {
    switch (actionType) {
      case 'ADD_FILTER':
        return `Added filter: ${params.field} ${params.operator || 'is'} "${params.value}"`;

      case 'REMOVE_FILTER':
        if (params.field && params.value) {
          return `Removed filter: ${params.field} = "${params.value}"`;
        }
        return 'Removed filter';

      case 'CHANGE_TIME_RANGE':
        const timeRange = params.timeRange || params;
        return `Changed time range to ${timeRange.from} - ${timeRange.to}`;

      case 'REFRESH_DATA':
        return 'Data refreshed successfully';

      case 'NAVIGATE_TO_DASHBOARD':
        return params.id ? `Navigated to dashboard: ${params.id}` : 'Navigated to dashboard';

      case 'NAVIGATE_TO_DISCOVER':
        return 'Navigated to Discover';

      default:
        return `Action ${actionType} completed successfully`;
    }
  }
}
