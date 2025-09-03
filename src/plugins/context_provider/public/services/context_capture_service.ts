/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { BehaviorSubject, Observable } from 'rxjs';
import { CoreSetup, CoreStart } from '../../../../core/public';
import {
  ContextProviderSetupDeps,
  ContextProviderStartDeps,
  StaticContext,
  DynamicContext,
} from '../types';

export class ContextCaptureService {
  private staticContext$ = new BehaviorSubject<StaticContext | null>(null);
  private dynamicContext$ = new BehaviorSubject<DynamicContext | null>(null);
  private coreStart?: CoreStart;
  private pluginsStart?: ContextProviderStartDeps;

  constructor(
    private coreSetup: CoreSetup,
    private pluginsSetup: ContextProviderSetupDeps
  ) {}

  public setup(): void {
    console.log('🔧 Context Capture Service Setup');
  }

  public start(core: CoreStart, plugins: ContextProviderStartDeps): void {
    console.log('🚀 Context Capture Service Start');
    this.coreStart = core;
    this.pluginsStart = plugins;

    // Subscribe to application changes
    core.application.currentAppId$.subscribe((appId) => {
      if (appId) {
        this.captureStaticContext(appId);
      }
    });
  }

  public getStaticContext$(): Observable<StaticContext | null> {
    return this.staticContext$.asObservable();
  }

  public getDynamicContext$(): Observable<DynamicContext | null> {
    return this.dynamicContext$.asObservable();
  }

  public captureDynamicContext(trigger: string, data: any): void {
    const dynamicContext: DynamicContext = {
      trigger,
      timestamp: Date.now(),
      data,
    };
    this.dynamicContext$.next(dynamicContext);
  }

  private async captureStaticContext(appId: string): Promise<void> {
    console.log(`📊 Capturing static context for app: ${appId}`);

    if (!this.coreStart || !this.pluginsStart) {
      console.warn('Services not available for context capture');
      return;
    }

    let contextData: Record<string, any> = {
      appId,
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
    };

    try {
      // Capture app-specific context
      switch (appId) {
        case 'dashboards':
          contextData = { ...contextData, ...(await this.captureDashboardContext()) };
          break;
        case 'discover':
          contextData = { ...contextData, ...(await this.captureDiscoverContext()) };
          break;
        default:
          contextData.message = `Generic context for app: ${appId}`;
      }

      // Capture common data context
      const dataContext = await this.captureDataContext();
      contextData = { ...contextData, ...dataContext };

    } catch (error) {
      console.error('Error capturing context:', error);
      contextData.error = error.message;
    }

    const staticContext: StaticContext = {
      appId,
      timestamp: Date.now(),
      data: contextData,
    };

    this.staticContext$.next(staticContext);
  }

  private async captureDashboardContext(): Promise<Record<string, any>> {
    console.log('📊 Capturing Dashboard context');
    
    try {
      // Extract dashboard ID from URL
      const urlParts = window.location.pathname.split('/');
      const dashboardIndex = urlParts.indexOf('dashboard');
      const dashboardId = dashboardIndex !== -1 && urlParts[dashboardIndex + 1] 
        ? urlParts[dashboardIndex + 1] 
        : null;

      const context: Record<string, any> = {
        type: 'dashboard',
        dashboardId,
      };

      if (dashboardId && this.coreStart) {
        try {
          // Try to get dashboard from saved objects
          const dashboard = await this.coreStart.savedObjects.client.get('dashboard', dashboardId);
          context.dashboard = {
            title: dashboard.attributes.title,
            description: dashboard.attributes.description,
            panelsJSON: dashboard.attributes.panelsJSON,
          };
        } catch (error) {
          console.warn('Could not fetch dashboard details:', error);
          context.dashboardError = error.message;
        }
      }

      return context;
    } catch (error) {
      console.error('Error capturing dashboard context:', error);
      return { type: 'dashboard', error: error.message };
    }
  }

  private async captureDiscoverContext(): Promise<Record<string, any>> {
    console.log('🔍 Capturing Discover context');
    
    try {
      const context: Record<string, any> = {
        type: 'discover',
      };

      // Try to get current index pattern from URL or state
      const urlParams = new URLSearchParams(window.location.search);
      const indexPatternId = urlParams.get('_a') ? this.extractIndexPatternFromState(urlParams.get('_a')) : null;
      
      if (indexPatternId) {
        context.indexPatternId = indexPatternId;
      }

      return context;
    } catch (error) {
      console.error('Error capturing discover context:', error);
      return { type: 'discover', error: error.message };
    }
  }

  private extractIndexPatternFromState(stateParam: string | null): string | null {
    if (!stateParam) return null;
    
    try {
      const decoded = decodeURIComponent(stateParam);
      const state = JSON.parse(decoded);
      return state.index || null;
    } catch (error) {
      console.warn('Could not parse state parameter:', error);
      return null;
    }
  }

  private async captureDataContext(): Promise<Record<string, any>> {
    if (!this.pluginsStart) return {};

    try {
      const dataContext: Record<string, any> = {};

      // Capture current time range
      const timeRange = this.pluginsStart.data.query.timefilter.timefilter.getTime();
      dataContext.timeRange = timeRange;

      // Capture current filters
      const filters = this.pluginsStart.data.query.filterManager.getFilters();
      dataContext.filters = filters.map(filter => ({
        meta: filter.meta,
        query: filter.query,
      }));

      // Capture current query
      const queryState = this.pluginsStart.data.query.getState();
      dataContext.query = queryState.query;

      return { dataContext };
    } catch (error) {
      console.error('Error capturing data context:', error);
      return { dataContextError: error.message };
    }
  }

  public async executeAction(actionType: string, params: any): Promise<any> {
    console.log(`🎯 Executing action: ${actionType}`, params);

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
      console.error(`Error executing action ${actionType}:`, error);
      throw error;
    }
  }

  private async addFilter(params: any): Promise<any> {
    console.log('➕ Adding filter:', params);
    
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
    console.log('➖ Removing filter:', params);
    
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
    console.log('⏰ Changing time range:', params);
    
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
    console.log('🔄 Refreshing data');
    
    this.pluginsStart!.data.query.queryString.getUpdates$().next();
    return { success: true, timestamp: Date.now() };
  }

  private async navigateToDiscover(params: any): Promise<any> {
    console.log('🧭 Navigating to Discover:', params);
    
    await this.coreStart!.application.navigateToApp('discover', {
      path: params.path || '',
    });
    
    return { success: true, destination: 'discover' };
  }

  private async navigateToDashboard(params: any): Promise<any> {
    console.log('🧭 Navigating to Dashboard:', params);
    
    const path = params.dashboardId ? `/${params.dashboardId}` : '';
    await this.coreStart!.application.navigateToApp('dashboards', {
      path,
    });
    
    return { success: true, destination: 'dashboards' };
  }
}