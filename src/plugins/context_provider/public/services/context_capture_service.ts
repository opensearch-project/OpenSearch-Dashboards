/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart } from '../../../../core/public';
import {
  ContextProviderSetupDeps,
  ContextProviderStartDeps,
  AssistantContextStore,
} from '../types';
import { AssistantContextStoreImpl } from './assistant_context_store';

export class ContextCaptureService {
  private coreStart?: CoreStart;
  private pluginsStart?: ContextProviderStartDeps;
  private assistantContextStore: AssistantContextStore;

  constructor(private coreSetup: CoreSetup, private pluginsSetup: ContextProviderSetupDeps) {
    this.assistantContextStore = new AssistantContextStoreImpl();
  }

  public setup(): void {
    // Setup assistant context store
  }

  public start(core: CoreStart, plugins: ContextProviderStartDeps): void {
    this.coreStart = core;
    this.pluginsStart = plugins;

    // Make assistant context store globally available for hooks
    (window as any).assistantContextStore = this.assistantContextStore;
  }

  public async executeAction(actionType: string, params: any): Promise<any> {
    if (!this.coreStart || !this.pluginsStart) {
      throw new Error('Services not available for action execution');
    }

    try {
      switch (actionType) {
        case 'ADD_FILTER':
          return this.addFilter(params);
        case 'REMOVE_FILTER':
          return this.removeFilter(params);
        case 'CHANGE_TIME_RANGE':
          return this.changeTimeRange(params);
        case 'REFRESH_DATA':
          return this.refreshData();
        case 'NAVIGATE_TO_DISCOVER':
          return this.navigateToDiscover(params);
        case 'NAVIGATE_TO_DASHBOARD':
          return this.navigateToDashboard(params);
        default:
          throw new Error(`Unknown action type: ${actionType}`);
      }
    } catch (error) {
      throw error;
    }
  }

  private async addFilter(params: any): Promise<any> {
    if (!params.field || !params.value) {
      throw new Error('Filter requires field and value');
    }

    const filter = {
      meta: {
        alias: null,
        disabled: false,
        negate: false,
        key: params.field,
        type: 'phrase',
      },
      query: {
        match_phrase: {
          [params.field]: params.value,
        },
      },
    };

    this.pluginsStart!.data.query.filterManager.addFilters([filter]);
    return { success: true, filter };
  }

  private async removeFilter(params: any): Promise<any> {
    const filters = this.pluginsStart!.data.query.filterManager.getFilters();
    const updatedFilters = filters.filter((filter, index) => {
      if (params.index !== undefined) {
        return index !== params.index;
      }
      if (params.field) {
        return filter.meta?.key !== params.field;
      }
      return true;
    });

    this.pluginsStart!.data.query.filterManager.setFilters(updatedFilters);
    return { success: true, removedCount: filters.length - updatedFilters.length };
  }

  private async changeTimeRange(params: any): Promise<any> {
    if (!params.from || !params.to) {
      throw new Error('Time range requires from and to parameters');
    }

    this.pluginsStart!.data.query.timefilter.timefilter.setTime({
      from: params.from,
      to: params.to,
    });

    return { success: true, timeRange: { from: params.from, to: params.to } };
  }

  private async refreshData(): Promise<any> {
    const currentQuery = this.pluginsStart!.data.query.queryString.getQuery();
    this.pluginsStart!.data.query.queryString.setQuery(currentQuery, true);
    return { success: true, timestamp: Date.now() };
  }

  private async navigateToDiscover(params: any): Promise<any> {
    await this.coreStart!.application.navigateToApp('discover', {
      path: params.path || '',
    });

    return { success: true, destination: 'discover' };
  }

  private async navigateToDashboard(params: any): Promise<any> {
    const path = params.dashboardId ? `/${params.dashboardId}` : '';
    await this.coreStart!.application.navigateToApp('dashboards', {
      path,
    });

    return { success: true, destination: 'dashboards' };
  }

  public getAssistantContextStore(): AssistantContextStore {
    return this.assistantContextStore;
  }

  public stop(): void {
    this.assistantContextStore.clearAll();
    delete (window as any).assistantContextStore;
  }
}
