/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { SavedObjectsClientContract } from '../../../core/public';
import { ContextContributor } from '../../context_provider/public';
import { DashboardContainer } from './application/embeddable/dashboard_container';

/**
 * Dashboard Context Contributor - captures comprehensive dashboard state
 * including all embeddable panels and their configurations
 * 
 * This demonstrates the "Complex Context Capture" approach where the plugin
 * implements its own sophisticated context logic rather than relying on URL parsing
 */
export class DashboardContextContributor implements ContextContributor {
  appId = 'dashboards';
  
  // Dashboard uses UI Actions for context triggers (when panels are cloned, deleted, added)
  contextTriggerActions = ['clonePanel', 'deletePanel', 'addPanel', 'replacePanel'];
  
  constructor(
    private getDashboardContainer: () => DashboardContainer | undefined,
    private savedObjects: SavedObjectsClientContract
  ) {}

  /**
   * Capture comprehensive dashboard context including all embeddable details
   * This is called by the Context Provider when:
   * 1. User navigates to dashboard app
   * 2. UI actions like clonePanel are triggered
   * 3. Manual context refresh is requested
   */
  async captureStaticContext(): Promise<Record<string, any>> {
    console.log('🏗️ Dashboard: Capturing static context...');
    console.log('🔍 Dashboard: getDashboardContainer function:', this.getDashboardContainer);
    console.log('🔍 Dashboard: window.dashboardPlugin:', (window as any).dashboardPlugin);
    console.log('🔍 Dashboard: window.dashboardPlugin?.currentDashboardContainer:', (window as any).dashboardPlugin?.currentDashboardContainer);
    
    const container = this.getDashboardContainer();
    console.log('🔍 Dashboard: Container check:', {
      hasContainer: !!container,
      containerType: container?.type,
      containerId: container?.id
    });
    
    if (!container) {
      console.warn('Dashboard: No dashboard container available');
      console.log('🔍 Dashboard: Checking if we can access container directly from window...');
      const directContainer = (window as any).dashboardPlugin?.currentDashboardContainer;
      if (directContainer) {
        console.log('✅ Dashboard: Found container via direct window access!');
        return await this.captureContainerContext(directContainer);
      }
      
      return {
        type: 'dashboard',
        error: 'No dashboard container available',
        timestamp: Date.now()
      };
    }

    return await this.captureContainerContext(container);
  }

  /**
   * Capture context from a dashboard container
   */
  private async captureContainerContext(container: any): Promise<Record<string, any>> {
    try {
      const dashboardId = this.extractDashboardId();
      const embeddableContexts = await this.captureAllEmbeddableContexts(container);
      const dashboardMetadata = dashboardId ? await this.getDashboardMetadata(dashboardId) : null;
      
      const context = {
        type: 'dashboard',
        dashboardId,
        dashboard: dashboardMetadata,
        embeddables: {
          count: embeddableContexts.length,
          panels: embeddableContexts
        },
        viewMode: container.getInput().viewMode,
        useMargins: container.getInput().useMargins,
        timeRange: container.getInput().timeRange,
        filters: container.getInput().filters,
        query: container.getInput().query,
        isFullScreenMode: container.getInput().isFullScreenMode,
        timestamp: Date.now()
      };

      console.log(`✅ Dashboard: Context captured with ${embeddableContexts.length} embeddables:`, context);
      return context;
      
    } catch (error) {
      console.error('❌ Dashboard: Error capturing context:', error);
      return {
        type: 'dashboard',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Capture detailed context for all embeddable panels in the dashboard
   * This provides comprehensive information about each visualization, saved search, etc.
   */
  private async captureAllEmbeddableContexts(container: DashboardContainer): Promise<any[]> {
    const childIds = container.getChildIds();
    const contexts = [];
    
    console.log(`📊 Dashboard: Scanning ${childIds.length} embeddables...`);
    console.log('🔍 Dashboard: Child IDs:', childIds);
    console.log('🔍 Dashboard: Container input panels:', Object.keys(container.getInput().panels || {}));
    console.log('🔍 Dashboard: Container output embeddableLoaded:', container.getOutput().embeddableLoaded);

    if (childIds.length === 0) {
      console.warn('⚠️ Dashboard: No child IDs found, but container exists');
      return [];
    }

    for (const id of childIds) {
      try {
        const embeddable = container.getChild(id);
        const input = embeddable.getInput();
        const output = embeddable.getOutput();
        const panelState = container.getInput().panels[id];
        
        // 🔍 DEEP DIVE: Let's investigate the embeddable structure
        console.log(`🔍 DEEP DIVE: Investigating embeddable ${id}:`);
        console.log(`  📋 Embeddable Type: ${embeddable.type}`);
        console.log(`  📋 Embeddable Constructor: ${embeddable.constructor.name}`);
        console.log(`  📋 Embeddable Keys:`, Object.keys(embeddable));
        console.log(`  📋 Embeddable Prototype:`, Object.getPrototypeOf(embeddable).constructor.name);
        
        // Check all properties on the embeddable object itself
        console.log(`  🎯 DIRECT EMBEDDABLE PROPERTIES:`);
        const embeddableAny = embeddable as any; // Type assertion for investigation
        const embeddableProps = {
          // Common visualization properties
          savedObject: embeddableAny.savedObject ? 'Present' : 'Not present',
          visualization: embeddableAny.visualization ? 'Present' : 'Not present',
          vis: embeddableAny.vis ? 'Present' : 'Not present',
          visState: embeddableAny.visState ? 'Present' : 'Not present',
          uiState: embeddableAny.uiState ? 'Present' : 'Not present',
          // Check for getters/methods
          getSavedObject: typeof embeddableAny.getSavedObject === 'function' ? 'Available' : 'Not available',
          getVisualization: typeof embeddableAny.getVisualization === 'function' ? 'Available' : 'Not available',
          getVis: typeof embeddableAny.getVis === 'function' ? 'Available' : 'Not available',
          // Other common properties
          savedObjectId: embeddableAny.savedObjectId,
          indexPattern: embeddableAny.indexPattern,
          indexPatterns: embeddableAny.indexPatterns
        };
        console.log(`  🎯 Properties:`, embeddableProps);
        
        // 📋 INPUT DEEP DIVE
        console.log(`  📤 INPUT DEEP DIVE for ${id}:`);
        console.log(`    Keys:`, Object.keys(input));
        console.log(`    Full Input:`, input);
        
        // Check if input has nested objects we should explore
        Object.keys(input).forEach(key => {
          const value = (input as any)[key];
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            console.log(`    📦 ${key} (object):`, Object.keys(value));
          }
        });
        
        // 📤 OUTPUT DEEP DIVE
        console.log(`  📥 OUTPUT DEEP DIVE for ${id}:`);
        console.log(`    Keys:`, Object.keys(output));
        console.log(`    Full Output:`, output);
        
        // Check if output has nested objects
        Object.keys(output).forEach(key => {
          const value = (output as any)[key];
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            console.log(`    📦 ${key} (object):`, Object.keys(value));
          }
        });
        
        // 💾 SAVED OBJECT INVESTIGATION
        if ((input as any).savedObjectId) {
          console.log(`  💾 SAVED OBJECT ID: ${(input as any).savedObjectId}`);
          
          // Try to access the saved object if it's available on the embeddable
          if (embeddableAny.savedObject) {
            console.log(`  💾 Embeddable has savedObject:`, {
              id: embeddableAny.savedObject.id,
              type: embeddableAny.savedObject.type,
              attributes: Object.keys(embeddableAny.savedObject.attributes || {}),
              attributesContent: embeddableAny.savedObject.attributes
            });
          }
          
          // Try to get visualization if available
          if (embeddableAny.vis || embeddableAny.visualization) {
            const vis = embeddableAny.vis || embeddableAny.visualization;
            console.log(`  🎨 Visualization object found:`, {
              type: vis.type,
              title: vis.title,
              params: vis.params,
              uiState: vis.uiState,
              data: vis.data ? 'Present' : 'Not present'
            });
          }
        }
        
        // 🔧 METHOD INVESTIGATION
        console.log(`  🔧 AVAILABLE METHODS on embeddable:`);
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(embeddable))
          .filter(name => typeof embeddableAny[name] === 'function' && !name.startsWith('_'))
          .slice(0, 20); // Limit to first 20 methods
        console.log(`    Methods:`, methods);
        
        // Try calling some common getter methods if they exist
        if (typeof embeddableAny.getSavedObject === 'function') {
          try {
            const savedObj = embeddableAny.getSavedObject();
            console.log(`  💾 getSavedObject() result:`, savedObj);
          } catch (e) {
            console.log(`  💾 getSavedObject() error:`, e.message);
          }
        }
        
        if (typeof embeddableAny.getVis === 'function') {
          try {
            const vis = embeddableAny.getVis();
            console.log(`  🎨 getVis() result:`, vis);
          } catch (e) {
            console.log(`  🎨 getVis() error:`, e.message);
          }
        }

        const embeddableContext = {
          id,
          type: embeddable.type,
          title: embeddable.getTitle?.() || input.title || 'Untitled',
          
          // Enhanced input information
          input: {
            id: input.id,
            savedObjectId: (input as any).savedObjectId,
            title: input.title,
            // Include all available input properties
            ...Object.keys(input).reduce((acc, key) => {
              if (!['id', 'title'].includes(key) && (input as any)[key] !== undefined) {
                acc[key] = (input as any)[key];
              }
              return acc;
            }, {} as any)
          },
          
          // Enhanced output information
          output: {
            loading: output.loading,
            error: output.error,
            // Include all available output properties
            ...Object.keys(output).reduce((acc, key) => {
              if (!['loading', 'error'].includes(key) && (output as any)[key] !== undefined) {
                acc[key] = (output as any)[key];
              }
              return acc;
            }, {} as any)
          },
          
          // Panel layout and configuration
          gridData: panelState?.gridData,
          panelType: panelState?.type,
          
          // Additional embeddable metadata
          metadata: {
            isLoading: output.loading,
            hasError: !!output.error,
            isContainer: (embeddable as any).isContainer || false,
            runtimeId: (embeddable as any).runtimeId,
            // Try to get visualization type from different sources
            visualizationType: (output as any).visType ||
                              (input as any).visState?.type ||
                              ((input as any).savedObjectId && embeddable.type === 'visualization' ? 'saved_visualization' : null),
            // Try to get index pattern information
            indexPatternId: (output as any).indexPattern?.id ||
                           (input as any).indexPatternId ||
                           ((input as any).savedObjectId && 'from_saved_object'),
          },
          
          // 🔍 DEBUG: Investigation results
          investigation: {
            embeddableKeys: Object.keys(embeddable),
            inputKeys: Object.keys(input),
            outputKeys: Object.keys(output),
            hasDirectSavedObject: !!embeddableAny.savedObject,
            hasDirectVis: !!(embeddableAny.vis || embeddableAny.visualization),
            availableMethods: methods,
            embeddableProperties: embeddableProps
          }
        };
        
        contexts.push(embeddableContext);
        console.log(`  ✓ ${embeddable.type}: ${embeddableContext.title}`);
        
      } catch (error) {
        console.error(`  ❌ Error capturing context for embeddable ${id}:`, error);
        contexts.push({
          id,
          type: 'unknown',
          error: error.message
        });
      }
    }

    return contexts;
  }

  /**
   * Extract dashboard ID from current URL
   * Handles both view and edit modes
   */
  private extractDashboardId(): string | null {
    const urlParts = window.location.pathname.split('/');
    const viewIndex = urlParts.indexOf('view');
    const editIndex = urlParts.indexOf('edit');
    
    if (viewIndex !== -1 && urlParts[viewIndex + 1]) {
      return urlParts[viewIndex + 1];
    }
    
    if (editIndex !== -1 && urlParts[editIndex + 1]) {
      return urlParts[editIndex + 1];
    }
    
    // Check hash for dashboard ID (alternative URL format)
    const hash = window.location.hash;
    const hashMatch = hash.match(/\/view\/([^?]+)/);
    if (hashMatch) {
      return hashMatch[1];
    }
    
    return null;
  }

  /**
   * Get dashboard metadata from saved objects
   */
  private async getDashboardMetadata(dashboardId: string): Promise<any> {
    try {
      console.log(`📋 Dashboard: Fetching metadata for dashboard ${dashboardId}`);
      const dashboard = await this.savedObjects.get('dashboard', dashboardId);
      const attributes = dashboard.attributes as any;
      
      return {
        id: dashboardId,
        title: attributes.title,
        description: attributes.description,
        _version: dashboard._version,
        updated_at: dashboard.updated_at,
        panelsJSON: attributes.panelsJSON ? JSON.parse(attributes.panelsJSON) : [],
        optionsJSON: attributes.optionsJSON ? JSON.parse(attributes.optionsJSON) : {},
        timeRestore: attributes.timeRestore,
        timeTo: attributes.timeTo,
        timeFrom: attributes.timeFrom,
        refreshInterval: attributes.refreshInterval
      };
    } catch (error) {
      console.error(`❌ Dashboard: Error fetching metadata for ${dashboardId}:`, error);
      return { 
        id: dashboardId,
        error: error.message 
      };
    }
  }

  /**
   * Get available actions that can be executed on the dashboard
   */
  getAvailableActions(): string[] {
    return [
      'clonePanel',
      'deletePanel', 
      'addPanel',
      'replacePanel',
      'expandPanel',
      'editPanel',
      'saveDashboard',
      'refreshDashboard'
    ];
  }

  /**
   * Execute dashboard-specific actions
   */
  async executeAction(actionType: string, params: any): Promise<any> {
    console.log(`🎯 Dashboard: Executing action ${actionType}`, params);
    
    const container = this.getDashboardContainer();
    if (!container) {
      throw new Error('No dashboard container available for action execution');
    }

    switch (actionType) {
      case 'refreshDashboard':
        container.updateInput({ 
          lastReloadRequestTime: new Date().getTime() 
        });
        return { success: true, message: 'Dashboard refreshed' };
        
      case 'saveDashboard':
        // This would integrate with the dashboard save functionality
        return { success: true, message: 'Dashboard save action triggered' };
        
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  /**
   * Capture dynamic context when UI actions occur
   */
  captureDynamicContext(trigger: string, data: any): Record<string, any> {
    return {
      type: 'dashboard_dynamic',
      trigger,
      timestamp: Date.now(),
      data,
      dashboardId: this.extractDashboardId()
    };
  }
}