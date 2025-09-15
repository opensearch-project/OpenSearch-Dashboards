/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import { BehaviorSubject, Observable } from 'rxjs';
import { CoreSetup, CoreStart } from '../../../../core/public';
import {
  ContextProviderSetupDeps,
  ContextProviderStartDeps,
  StaticContext,
  DynamicContext,
  ContextContributor,
  GlobalInteraction,
} from '../types';

// Define singleton context types that should only have one instance
const SINGLETON_CONTEXT_TYPES = new Set(['time_range', 'query', 'index_pattern', 'app_state']);

export class ContextCaptureService {
  private staticContext$ = new BehaviorSubject<StaticContext | null>(null);
  private dynamicContext$ = new BehaviorSubject<DynamicContext | null>(null);
  private coreStart?: CoreStart;
  private pluginsStart?: ContextProviderStartDeps;
  private contextContributors = new Map<string, ContextContributor>();

  constructor(private coreSetup: CoreSetup, private pluginsSetup: ContextProviderSetupDeps) {}

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

    // 🔑 NEW: Monitor URL changes for automatic context refresh
    this.setupUrlMonitoring();
  }

  /**
   * Monitor URL changes to automatically refresh context when parameters change
   * This handles cases like time range changes, filter updates, etc. within the same app
   */
  private setupUrlMonitoring(): void {
    console.log('🔍 Setting up URL monitoring for automatic context refresh');

    let lastUrl = window.location.href;
    let lastHash = window.location.hash;

    // Monitor both popstate (back/forward) and hashchange events
    const handleUrlChange = () => {
      const currentUrl = window.location.href;
      const currentHash = window.location.hash;

      if (currentUrl !== lastUrl || currentHash !== lastHash) {
        console.log('🔄 URL change detected, refreshing context');
        console.log('  Previous URL:', lastUrl);
        console.log('  Current URL:', currentUrl);

        // Get current app and refresh context
        const currentAppId = window.location.pathname.split('/app/')[1]?.split('/')[0];
        if (currentAppId) {
          console.log(`🎯 Auto-refreshing context for app: ${currentAppId}`);
          this.captureStaticContext(currentAppId);
        }

        lastUrl = currentUrl;
        lastHash = currentHash;
      }
    };

    // Listen for browser navigation events
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    // Also monitor for programmatic URL changes using a polling approach
    // This catches changes made by OpenSearch Dashboards' URL state management
    const urlCheckInterval = setInterval(() => {
      handleUrlChange();
    }, 1000); // Check every second

    // Store cleanup function
    (this as any).urlMonitoringCleanup = () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      if (urlCheckInterval) {
        clearInterval(urlCheckInterval);
      }
    };
  }

  public getStaticContext$(): Observable<StaticContext | null> {
    return this.staticContext$.asObservable();
  }

  public getDynamicContext$(): Observable<DynamicContext | null> {
    return this.dynamicContext$.asObservable();
  }

  public captureDynamicContext(trigger: string, data: any): void {
    console.log(`⚡ Context Capture: Processing dynamic context for trigger: ${trigger}`);
    console.log('🔥 DEBUG: Total registered contributors:', this.contextContributors.size);
    console.log(
      '🔥 DEBUG: Registered contributor keys:',
      Array.from(this.contextContributors.keys())
    );

    // Find all contributors that are interested in this trigger
    const interestedContributors = Array.from(this.contextContributors.values()).filter(
      (contributor) => {
        console.log(`🔥 DEBUG: Checking contributor ${contributor.appId}:`, {
          contextTriggerActions: contributor.contextTriggerActions,
          includesTrigger: contributor.contextTriggerActions?.includes(trigger),
        });
        return contributor.contextTriggerActions?.includes(trigger);
      }
    );

    console.log(
      `🎯 Found ${interestedContributors.length} contributors interested in trigger: ${trigger}`
    );
    console.log(
      '🔥 DEBUG: Interested contributors:',
      interestedContributors.map((c) => c.appId)
    );

    // Route the trigger to each interested contributor
    interestedContributors.forEach((contributor) => {
      if (contributor.captureDynamicContext) {
        try {
          const contributorContext = contributor.captureDynamicContext(trigger, data);

          const dynamicContext: DynamicContext = {
            appId: contributor.appId,
            trigger,
            timestamp: Date.now(),
            data: contributorContext,
          };

          this.dynamicContext$.next(dynamicContext);
          console.log(`✅ Dynamic context captured for ${contributor.appId}:`, contributorContext);
        } catch (error) {
          console.error(`❌ Error capturing dynamic context for ${contributor.appId}:`, error);
        }
      }
    });

    // If no contributors are interested, still emit the raw context
    if (interestedContributors.length === 0) {
      const dynamicContext: DynamicContext = {
        trigger,
        timestamp: Date.now(),
        data,
      };
      this.dynamicContext$.next(dynamicContext);
      console.log(`📝 No contributors for trigger ${trigger}, emitting raw context`);
    }
  }

  public captureGlobalInteraction(interaction: GlobalInteraction): void {
    console.log('🎯 Global Interaction Captured by Context Provider:', interaction);

    // Route to appropriate contributor based on app
    const contributor = this.contextContributors.get(interaction.app || 'unknown');
    if (contributor && contributor.handleGlobalInteraction) {
      try {
        contributor.handleGlobalInteraction(interaction);
        console.log(`✅ Global interaction routed to ${contributor.appId} contributor`);
      } catch (error) {
        console.error(
          `❌ Error in ${contributor.appId} contributor handling global interaction:`,
          error
        );
      }
    } else {
      console.log(
        `⚠️ No contributor found for app: ${interaction.app}, or contributor doesn't handle global interactions`
      );
    }

    // Also emit as dynamic context for backward compatibility
    const dynamicContext: DynamicContext = {
      appId: interaction.app,
      trigger: interaction.interactionType || 'GLOBAL_CLICK',
      timestamp: interaction.timestamp,
      data: interaction,
    };

    this.dynamicContext$.next(dynamicContext);
    console.log('📡 Global interaction also emitted as dynamic context for backward compatibility');
  }

  public registerContextContributor(contributor: ContextContributor): void {
    console.log(`📝 Registering context contributor for app: ${contributor.appId}`);
    console.log(`🔍 DEBUG: Contributor details:`, {
      appId: contributor.appId,
      hasStaticCapture: !!contributor.captureStaticContext,
      hasDynamicCapture: !!contributor.captureDynamicContext,
      triggerActions: contributor.contextTriggerActions,
    });

    this.contextContributors.set(contributor.appId, contributor);

    console.log(`✅ Contributor registered. Total contributors: ${this.contextContributors.size}`);
    console.log(
      `🔍 DEBUG: All registered contributors:`,
      Array.from(this.contextContributors.keys())
    );
  }

  public unregisterContextContributor(appId: string): void {
    console.log(`🗑️ Unregistering context contributor for app: ${appId}`);
    this.contextContributors.delete(appId);
  }

  /**
   * Deduplicates context data, ensuring singleton types only have one instance
   */
  private deduplicateContext(contextData: Record<string, any>): Record<string, any> {
    const deduplicated: Record<string, any> = {};

    // Handle singleton context types
    Object.keys(contextData).forEach((key) => {
      const contextType = this.inferContextType(key);

      if (contextType && SINGLETON_CONTEXT_TYPES.has(contextType)) {
        // For singleton types, always replace the existing value
        deduplicated[key] = contextData[key];
      } else {
        // For non-singleton types, preserve the value
        deduplicated[key] = contextData[key];
      }
    });

    return deduplicated;
  }

  /**
   * Infers the context type from the key name
   */
  private inferContextType(key: string): string | null {
    if (key === 'timeRange' || key === 'dataContext.timeRange') return 'time_range';
    if (key === 'query' || key === 'dataContext.query') return 'query';
    if (key === 'indexPatternId' || key === 'indexPattern') return 'index_pattern';
    if (key === 'appId' || key === 'appState') return 'app_state';
    if (key.includes('filter')) return 'filters';
    if (key.includes('dashboard')) return 'dashboard';
    if (key.includes('visualization')) return 'visualization';
    if (key.includes('document')) return 'document';
    return null;
  }

  private async captureStaticContext(appId: string): Promise<void> {
    console.log(`📊 Capturing static context for app: ${appId}`);
    console.log(`🔍 DEBUG: Registered contributors:`, Array.from(this.contextContributors.keys()));
    console.log(`🔍 DEBUG: Looking for contributor with appId: ${appId}`);
    console.log('🔥 DEBUG: captureStaticContext called with appId:', appId);

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
      // Check if there's a registered context contributor for this app
      let contributor = this.contextContributors.get(appId);

      // 🔧 FIX: Handle app ID variations (e.g., 'explore/logs' -> 'explore')
      if (!contributor && appId.includes('/')) {
        const baseAppId = appId.split('/')[0];
        console.log(`🔍 DEBUG: Trying base app ID: ${baseAppId}`);
        contributor = this.contextContributors.get(baseAppId);
      }

      // If still no exact match, check if any contributor can handle this app
      if (!contributor) {
        console.log('🔍 DEBUG: Checking contributors with canHandleApp method');
        for (const [contributorAppId, contributorInstance] of this.contextContributors.entries()) {
          if (
            typeof contributorInstance.canHandleApp === 'function' &&
            contributorInstance.canHandleApp(appId)
          ) {
            console.log(`✅ Found contributor ${contributorAppId} that can handle app: ${appId}`);
            contributor = contributorInstance;
            break;
          }
        }
      }

      if (contributor && contributor.captureStaticContext) {
        console.log(
          `🎯 Using registered context contributor for app: ${appId} (contributor: ${contributor.appId})`
        );
        console.log('🔥 DEBUG: About to call contributor.captureStaticContext()');

        const contributorContext = await contributor.captureStaticContext();
        contextData = { ...contextData, ...contributorContext };

        console.log(`✅ Contributor context captured:`, contributorContext);
        console.log('🔥 DEBUG: Context data keys after contributor:', Object.keys(contextData));
        console.log(
          '🔥 DEBUG: expandedDocuments in context:',
          contextData.expandedDocuments?.length || 0
        );
      } else {
        console.log(`⚠️ No registered contributor found for app: ${appId}`);
        console.log(`🔍 DEBUG: Available contributors:`, this.contextContributors);
        console.log('🔥 DEBUG: contributor found:', !!contributor);
        console.log(
          '🔥 DEBUG: contributor has captureStaticContext:',
          !!contributor?.captureStaticContext
        );
        // Fallback to built-in app-specific context
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
      }

      // Capture common data context
      const dataContext = await this.captureDataContext();
      contextData = { ...contextData, ...dataContext };
    } catch (error) {
      console.error('Error capturing context:', error);
      contextData.error = error.message;
    }

    // Apply deduplication
    const deduplicatedData = this.deduplicateContext(contextData);

    const staticContext: StaticContext = {
      appId,
      timestamp: Date.now(),
      data: deduplicatedData,
    };

    console.log('🔥 DEBUG: About to emit new static context');
    console.log('🔥 DEBUG: Static context data keys:', Object.keys(deduplicatedData));
    console.log(
      '🔥 DEBUG: expandedDocuments in static context:',
      deduplicatedData.expandedDocuments?.length || 0
    );

    this.staticContext$.next(staticContext);
    console.log('🔥 DEBUG: Static context emitted successfully');

    // 🔧 FIX: Emit custom event to notify AI assistant of static context updates
    window.dispatchEvent(
      new CustomEvent('staticContextUpdated', {
        detail: { appId, timestamp: Date.now(), contextData: deduplicatedData },
      })
    );
    console.log('🔥 DEBUG: staticContextUpdated event dispatched for AI assistant');
  }

  private async captureDashboardContext(): Promise<Record<string, any>> {
    console.log('📊 Capturing Dashboard context');

    try {
      // Extract dashboard ID from URL
      const urlParts = window.location.pathname.split('/');
      const dashboardIndex = urlParts.indexOf('dashboard');
      const dashboardId =
        dashboardIndex !== -1 && urlParts[dashboardIndex + 1] ? urlParts[dashboardIndex + 1] : null;

      const context: Record<string, any> = {
        type: 'dashboard',
        dashboardId,
      };

      if (dashboardId && this.coreStart) {
        try {
          // Try to get dashboard from saved objects
          const dashboard = await this.coreStart.savedObjects.client.get('dashboard', dashboardId);
          const attributes = dashboard.attributes as any;
          context.dashboard = {
            title: attributes.title,
            description: attributes.description,
            panelsJSON: attributes.panelsJSON,
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
      const indexPatternId = urlParams.get('_a')
        ? this.extractIndexPatternFromState(urlParams.get('_a'))
        : null;

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
      dataContext.filters = filters.map((filter) => ({
        meta: filter.meta,
        query: filter.query,
      }));

      // Capture current query
      const currentQuery = this.pluginsStart.data.query.queryString.getQuery();
      dataContext.query = currentQuery;

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

    // Trigger a refresh by updating the query state
    const currentQuery = this.pluginsStart!.data.query.queryString.getQuery();
    this.pluginsStart!.data.query.queryString.setQuery(currentQuery, true);
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

  /**
   * Cleanup method to remove URL monitoring listeners
   */
  public stop(): void {
    console.log('🛑 Context Capture Service Stop');

    // Cleanup URL monitoring
    if ((this as any).urlMonitoringCleanup) {
      (this as any).urlMonitoringCleanup();
    }

    // Clear context contributors
    this.contextContributors.clear();
  }
}
