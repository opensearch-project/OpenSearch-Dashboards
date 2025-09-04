# Context Provider Complete Architecture Design

## 🏗️ **Overall System Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenSearch Dashboards Core                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐ │
│  │ Context Provider    │  │ Individual Plugins                  │ │
│  │ Plugin              │  │ (Dashboard, Discover, etc.)         │ │
│  │                     │  │                                     │ │
│  │ • Central Registry  │◄─┤ • Register Context Contributors     │ │
│  │ • URL Monitoring    │  │ • Implement Context Logic          │ │
│  │ • Context Storage   │  │ • Define UI Action Triggers        │ │
│  │ • Global API        │  │                                     │ │
│  └─────────────────────┘  └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 **File Structure and Responsibilities**

### **Context Provider Plugin** (`src/plugins/context_provider/`)

```
src/plugins/context_provider/
├── public/
│   ├── plugin.ts                    # Main plugin registration
│   ├── types.ts                     # ContextContributor interface
│   └── services/
│       ├── context_registry.ts      # Central registry for contributors
│       ├── url_monitor.ts           # URL state monitoring
│       └── context_manager.ts       # Context coordination
```

### **Dashboard Plugin** (`src/plugins/dashboard/`)

```
src/plugins/dashboard/
├── public/
│   ├── plugin.tsx                   # Dashboard plugin main file
│   ├── context_contributor.ts       # NEW: Dashboard context logic
│   └── application/
│       └── actions/
│           └── clone_panel_action.tsx # Enhanced with context triggers
```

### **Other Plugins** (Discover, Visualize, etc.)

```
src/plugins/[plugin_name]/
├── public/
│   ├── plugin.ts                    # Plugin main file
│   └── context_contributor.ts       # NEW: Plugin-specific context logic
```

## 🔧 **Implementation Details**

### **1. Context Provider Plugin** (`src/plugins/context_provider/`)

#### **Enhanced Types** (`public/types.ts`)

```typescript
export interface ContextContributor {
  appId: string;
  
  // Option 1: Simple URL-based context
  urlStateKeys?: string[]; // ['_g', '_a', '_q']
  parseUrlState?(urlState: Record<string, any>): Record<string, any>;
  
  // Option 2: Complex context capture
  captureStaticContext?(): Promise<Record<string, any>>;
  
  // UI Actions that should trigger context refresh
  contextTriggerActions?: string[];
}

export interface ContextProviderStart {
  registerContextContributor(contributor: ContextContributor): void;
  getCurrentContext(): Promise<StaticContext | null>;
  executeAction(actionType: string, params: any): Promise<any>;
}
```

#### **Context Registry** (`public/services/context_registry.ts`)

```typescript
export class ContextRegistry {
  private contributors = new Map<string, ContextContributor>();
  
  public register(contributor: ContextContributor): void {
    console.log(`📝 Registering context contributor: ${contributor.appId}`);
    this.contributors.set(contributor.appId, contributor);
  }
  
  public get(appId: string): ContextContributor | undefined {
    return this.contributors.get(appId);
  }
  
  public getAll(): ContextContributor[] {
    return Array.from(this.contributors.values());
  }
  
  public getUrlStateKeys(): string[] {
    const keys = new Set<string>();
    this.contributors.forEach(contributor => {
      contributor.urlStateKeys?.forEach(key => keys.add(key));
    });
    return Array.from(keys);
  }
  
  public getContextTriggerActions(): string[] {
    const actions = new Set<string>();
    this.contributors.forEach(contributor => {
      contributor.contextTriggerActions?.forEach(action => actions.add(action));
    });
    return Array.from(actions);
  }
}
```

#### **URL Monitor** (`public/services/url_monitor.ts`)

```typescript
export class URLMonitor {
  private urlStateStorage: IOsdUrlStateStorage;
  
  constructor(
    private registry: ContextRegistry,
    private contextManager: ContextManager
  ) {
    this.urlStateStorage = createOsdUrlStateStorage({
      useHash: false,
      history: window.history
    });
  }
  
  public start(): void {
    // Monitor only URL keys that registered contributors care about
    const monitoredKeys = this.registry.getUrlStateKeys();
    
    monitoredKeys.forEach(key => {
      this.urlStateStorage.change$(key).subscribe((newState) => {
        console.log(`🔄 URL state changed: ${key}`, newState);
        this.handleUrlStateChange(key, newState);
      });
    });
  }
  
  private async handleUrlStateChange(stateKey: string, newState: any): Promise<void> {
    // Find contributors affected by this URL state change
    const affectedContributors = this.registry.getAll()
      .filter(c => c.urlStateKeys?.includes(stateKey));
    
    // Refresh context for affected apps
    for (const contributor of affectedContributors) {
      await this.contextManager.refreshContextForApp(contributor.appId);
    }
  }
}
```

#### **Context Manager** (`public/services/context_manager.ts`)

```typescript
export class ContextManager {
  private staticContext$ = new BehaviorSubject<StaticContext | null>(null);
  
  constructor(
    private registry: ContextRegistry,
    private urlStateStorage: IOsdUrlStateStorage,
    private coreStart: CoreStart
  ) {}
  
  public async refreshContextForApp(appId: string): Promise<void> {
    const contributor = this.registry.get(appId);
    if (!contributor) {
      console.warn(`No context contributor found for app: ${appId}`);
      return;
    }
    
    let contextData: Record<string, any> = {
      appId,
      url: window.location.href,
      pathname: window.location.pathname
    };
    
    try {
      // URL-based context (simple plugins)
      if (contributor.urlStateKeys && contributor.parseUrlState) {
        const urlState: Record<string, any> = {};
        contributor.urlStateKeys.forEach(key => {
          urlState[key] = this.urlStateStorage.get(key);
        });
        const parsedContext = contributor.parseUrlState(urlState);
        contextData = { ...contextData, ...parsedContext };
      }
      
      // Complex context (dashboard, embeddables)
      if (contributor.captureStaticContext) {
        const complexContext = await contributor.captureStaticContext();
        contextData = { ...contextData, ...complexContext };
      }
      
      // Update static context
      const staticContext: StaticContext = {
        appId,
        timestamp: Date.now(),
        data: contextData
      };
      
      this.staticContext$.next(staticContext);
      console.log(`📊 Context updated for ${appId}:`, staticContext);
      
    } catch (error) {
      console.error(`Error refreshing context for ${appId}:`, error);
    }
  }
  
  public getCurrentContext(): StaticContext | null {
    return this.staticContext$.getValue();
  }
}
```

#### **Main Plugin** (`public/plugin.ts`)

```typescript
export class ContextProviderPlugin implements Plugin<ContextProviderSetup, ContextProviderStart> {
  private contextRegistry = new ContextRegistry();
  private urlMonitor?: URLMonitor;
  private contextManager?: ContextManager;
  private uiActionsMonitor?: UIActionsMonitor;
  
  public setup(core: CoreSetup, plugins: ContextProviderSetupDeps): ContextProviderSetup {
    console.log('🔧 Context Provider Plugin Setup');
    return {};
  }
  
  public start(core: CoreStart, plugins: ContextProviderStartDeps): ContextProviderStart {
    console.log('🚀 Context Provider Plugin Start');
    
    // Initialize services
    const urlStateStorage = createOsdUrlStateStorage({
      useHash: false,
      history: window.history
    });
    
    this.contextManager = new ContextManager(this.contextRegistry, urlStateStorage, core);
    this.urlMonitor = new URLMonitor(this.contextRegistry, this.contextManager);
    this.uiActionsMonitor = new UIActionsMonitor(this.contextRegistry, this.contextManager, plugins.uiActions);
    
    // Start monitoring
    this.urlMonitor.start();
    this.uiActionsMonitor.start();
    
    // Subscribe to app navigation
    core.application.currentAppId$.subscribe(async (appId) => {
      if (appId) {
        await this.contextManager!.refreshContextForApp(appId);
      }
    });
    
    // Global API
    (window as any).contextProvider = {
      getCurrentContext: () => this.contextManager!.getCurrentContext(),
      registerContextContributor: (contributor: ContextContributor) => {
        this.contextRegistry.register(contributor);
      }
    };
    
    return {
      registerContextContributor: (contributor: ContextContributor) => {
        this.contextRegistry.register(contributor);
      },
      getCurrentContext: async () => this.contextManager!.getCurrentContext(),
      executeAction: async (actionType: string, params: any) => {
        // Implementation for action execution
        return { success: true };
      }
    };
  }
}
```

### **2. Dashboard Plugin Integration** (`src/plugins/dashboard/`)

#### **Dashboard Context Contributor** (`public/context_contributor.ts`)

```typescript
import { ContextContributor } from '../../context_provider/public';
import { DashboardContainer } from './application/embeddable/dashboard_container';

export class DashboardContextContributor implements ContextContributor {
  appId = 'dashboard';
  contextTriggerActions = ['clonePanel', 'deletePanel', 'addPanel'];
  
  constructor(
    private getDashboardContainer: () => DashboardContainer | undefined,
    private savedObjects: SavedObjectsClientContract
  ) {}
  
  async captureStaticContext(): Promise<Record<string, any>> {
    const container = this.getDashboardContainer();
    if (!container) {
      return { type: 'dashboard', error: 'No dashboard container available' };
    }
    
    try {
      const dashboardId = this.extractDashboardId();
      const embeddableContexts = await this.captureAllEmbeddableContexts(container);
      
      return {
        type: 'dashboard',
        dashboardId,
        dashboard: dashboardId ? await this.getDashboardMetadata(dashboardId) : null,
        embeddables: {
          count: embeddableContexts.length,
          panels: embeddableContexts
        },
        viewMode: container.getInput().viewMode,
        useMargins: container.getInput().useMargins
      };
    } catch (error) {
      return { type: 'dashboard', error: error.message };
    }
  }
  
  private async captureAllEmbeddableContexts(container: DashboardContainer): Promise<any[]> {
    const children = container.getChildren();
    const contexts = [];
    
    for (const [id, embeddable] of Object.entries(children)) {
      const input = embeddable.getInput();
      const output = embeddable.getOutput();
      const panelState = container.getInput().panels[id];
      
      contexts.push({
        id,
        type: embeddable.type,
        title: embeddable.getTitle?.() || input.title,
        input: {
          id: input.id,
          savedObjectId: input.savedObjectId,
          title: input.title
        },
        output: {
          loading: output.loading,
          error: output.error,
          ...(embeddable.type === 'visualization' && {
            visType: output.visType,
            indexPattern: output.indexPattern
          })
        },
        gridData: panelState?.gridData,
        embeddableConfig: panelState?.embeddableConfig
      });
    }
    
    return contexts;
  }
  
  private extractDashboardId(): string | null {
    const urlParts = window.location.pathname.split('/');
    const dashboardIndex = urlParts.indexOf('view');
    return dashboardIndex !== -1 && urlParts[dashboardIndex + 1] 
      ? urlParts[dashboardIndex + 1] 
      : null;
  }
  
  private async getDashboardMetadata(dashboardId: string): Promise<any> {
    try {
      const dashboard = await this.savedObjects.get('dashboard', dashboardId);
      const attributes = dashboard.attributes as any;
      return {
        title: attributes.title,
        description: attributes.description
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}
```

#### **Enhanced Dashboard Plugin** (`public/plugin.tsx`)

```typescript
export class DashboardPlugin implements Plugin<DashboardSetup, DashboardStart> {
  private dashboardContextContributor?: DashboardContextContributor;
  private currentDashboardContainer?: DashboardContainer;
  
  public start(core: CoreStart, plugins: StartDependencies): DashboardStart {
    console.log('🚀 Dashboard Plugin Start');
    
    // Create dashboard context contributor
    this.dashboardContextContributor = new DashboardContextContributor(
      () => this.currentDashboardContainer,
      core.savedObjects.client
    );
    
    // Register with context provider
    if (plugins.contextProvider) {
      plugins.contextProvider.registerContextContributor(this.dashboardContextContributor);
      console.log('📝 Dashboard context contributor registered');
    }
    
    // ... rest of existing dashboard plugin logic
    
    return {
      // ... existing return values
    };
  }
  
  // Method to set current dashboard container (called when dashboard loads)
  public setCurrentDashboardContainer(container: DashboardContainer): void {
    this.currentDashboardContainer = container;
  }
}
```

### **3. Simple Plugin Example** (Discover)

#### **Discover Context Contributor** (`src/plugins/discover/public/context_contributor.ts`)

```typescript
export class DiscoverContextContributor implements ContextContributor {
  appId = 'discover';
  urlStateKeys = ['_g', '_a', '_q'];
  
  parseUrlState(urlState: Record<string, any>): Record<string, any> {
    return {
      type: 'discover',
      timeRange: urlState._g?.time,
      filters: urlState._g?.filters || [],
      query: urlState._q?.query,
      columns: urlState._a?.columns || ['_source'],
      sort: urlState._a?.sort,
      indexPattern: urlState._q?.dataset?.title
    };
  }
}
```

#### **Discover Plugin Integration** (`src/plugins/discover/public/plugin.ts`)

```typescript
export class DiscoverPlugin implements Plugin {
  public start(core: CoreStart, plugins: StartDependencies) {
    // Register simple URL-based context contributor
    if (plugins.contextProvider) {
      plugins.contextProvider.registerContextContributor(
        new DiscoverContextContributor()
      );
    }
    
    // ... rest of discover plugin logic
  }
}
```

## 🔄 **Complete Flow Example**

### **Scenario: User clones a panel in dashboard**

1. **User Action**: Clicks clone panel button
2. **Clone Action Executes**: `ClonePanelAction.execute()` runs
3. **UI Actions Monitor**: Detects `clonePanel` action (registered as context trigger)
4. **Context Refresh**: `contextManager.refreshContextForApp('dashboard')` called
5. **Dashboard Contributor**: `captureStaticContext()` called
6. **Embeddable Scan**: All 15+ embeddables scanned and captured
7. **Context Update**: New context with 16 embeddables stored
8. **Global API**: `window.contextProvider.getCurrentContext()` returns updated context

### **Scenario: User changes time range**

1. **User Action**: Changes date picker to "Last 1 year"
2. **URL Update**: `_g` parameter updated with new time range
3. **URL Monitor**: Detects `_g` state change
4. **Affected Contributors**: All contributors with `urlStateKeys: ['_g']`
5. **Context Refresh**: Each affected app's context refreshed
6. **Dashboard Context**: Includes new time range + all embeddable details
7. **Discover Context**: Simple URL parsing for new time range

## 🎯 **Key Benefits**

1. **Clear Separation**: Context Provider = coordination, Plugins = implementation
2. **Plugin Autonomy**: Each plugin implements its own context logic
3. **Flexible Contract**: Simple URL parsing OR complex context capture
4. **Smart Monitoring**: Only monitor URL keys and actions that plugins care about
5. **Zero Core Changes**: All plugins register voluntarily
6. **Comprehensive Coverage**: Dashboard gets full embeddable context, simple plugins get URL context

This architecture provides **complete plugin autonomy** while maintaining **centralized coordination** through the Context Provider plugin.