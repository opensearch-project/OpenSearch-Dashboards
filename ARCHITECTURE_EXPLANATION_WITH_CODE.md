# Context Provider Architecture Explained Through Code

## 🎯 **The Problem We Solved**

You asked: *"Where should we do DashboardContextContributor? Is it in Dashboard plugin? I am hoping each plugin can register the context provider service then context provider can monitor the current app Id can call the correct method if provided."*

**Answer: YES! Each plugin implements its own context contributor and registers it with the Context Provider service.**

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Context Provider Plugin                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Central Registry + Smart Monitoring + App-based Routing    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ Registration
                    ┌───────────────┼───────────────┐
                    │               │               │
        ┌───────────▼──────────┐   │   ┌───────────▼──────────┐
        │ Dashboard Plugin     │   │   │ Discover Plugin      │
        │                      │   │   │                      │
        │ DashboardContext     │   │   │ DiscoverContext      │
        │ Contributor          │   │   │ Contributor          │
        │ (Complex Logic)      │   │   │ (Simple URL Logic)   │
        └──────────────────────┘   │   └──────────────────────┘
                                   │
                        ┌──────────▼──────────┐
                        │ Other Plugins       │
                        │ (Visualize, etc.)   │
                        └─────────────────────┘
```

## 📁 **File Locations (Answering Your Question)**

### **1. DashboardContextContributor** → **Dashboard Plugin**
**Location:** [`src/plugins/dashboard/public/context_contributor.ts`](src/plugins/dashboard/public/context_contributor.ts)

```typescript
export class DashboardContextContributor implements ContextContributor {
  appId = 'dashboard';
  contextTriggerActions = ['clonePanel', 'deletePanel', 'addPanel', 'replacePanel'];
  
  // Complex context capture - scans all embeddables
  async captureStaticContext(): Promise<Record<string, any>> {
    const container = this.getDashboardContainer();
    const embeddableContexts = await this.captureAllEmbeddableContexts(container);
    
    return {
      type: 'dashboard',
      embeddables: { count: embeddableContexts.length, panels: embeddableContexts },
      viewMode: container.getInput().viewMode,
      // ... comprehensive dashboard state
    };
  }
}
```

### **2. DiscoverContextContributor** → **Discover Plugin**
**Location:** [`src/plugins/discover/public/context_contributor.ts`](src/plugins/discover/public/context_contributor.ts)

```typescript
export class DiscoverContextContributor implements ContextContributor {
  appId = 'discover';
  urlStateKeys = ['_g', '_a', '_q']; // Simple URL monitoring
  
  // Simple URL parsing - no complex logic needed
  parseUrlState(urlState: Record<string, any>): Record<string, any> {
    return {
      type: 'discover',
      timeRange: urlState._g?.time,
      query: urlState._q?.query,
      columns: urlState._a?.columns || ['_source']
    };
  }
}
```

## 🔧 **Plugin Registration Process**

### **Dashboard Plugin Registration**
**Location:** [`src/plugins/dashboard/public/plugin.tsx`](src/plugins/dashboard/public/plugin.tsx)

```typescript
export class DashboardPlugin implements Plugin<DashboardSetup, DashboardStart> {
  private currentDashboardContainer?: DashboardContainer;

  public start(core: CoreStart, plugins: StartDependencies): DashboardStart {
    const { contextProvider } = plugins;

    // Register Dashboard Context Contributor
    if (contextProvider) {
      const dashboardContextContributor = new DashboardContextContributor(
        () => this.currentDashboardContainer,  // Access to dashboard container
        core.savedObjects.client              // Access to saved objects
      );
      
      contextProvider.registerContextContributor(dashboardContextContributor);
      console.log('📝 Dashboard: Context contributor registered');
    }
  }
}
```

### **Plugin Dependencies**
**Location:** [`src/plugins/dashboard/opensearch_dashboards.json`](src/plugins/dashboard/opensearch_dashboards.json)

```json
{
  "optionalPlugins": ["home", "share", "usageCollection", "contextProvider"]
}
```

## 🎯 **Context Provider: Central Coordination**

### **Flexible Contract**
**Location:** [`src/plugins/context_provider/public/types.ts`](src/plugins/context_provider/public/types.ts)

```typescript
export interface ContextContributor {
  appId: string;
  
  // Option 1: Simple URL-based context (Discover, Visualize)
  urlStateKeys?: string[];
  parseUrlState?(urlState: Record<string, any>): Record<string, any>;
  
  // Option 2: Complex context capture (Dashboard)
  captureStaticContext?(): Promise<Record<string, any>>;
  
  // UI Actions that trigger context refresh
  contextTriggerActions?: string[];
}
```

### **App-based Routing**
**Location:** [`src/plugins/context_provider/public/services/context_manager.ts`](src/plugins/context_provider/public/services/context_manager.ts)

```typescript
export class ContextManager {
  public async refreshContextForApp(appId: string): Promise<void> {
    const contributor = this.registry.get(appId);  // Get plugin's contributor
    if (!contributor) return;

    let contextData = { appId, url: window.location.href };

    // Route to appropriate context capture method
    if (contributor.urlStateKeys && contributor.parseUrlState) {
      // Simple URL-based context (Discover)
      const urlState = {};
      contributor.urlStateKeys.forEach(key => {
        urlState[key] = this.urlStateStorage.get(key);
      });
      const parsedContext = contributor.parseUrlState(urlState);
      contextData = { ...contextData, ...parsedContext };
    }

    if (contributor.captureStaticContext) {
      // Complex context capture (Dashboard)
      const complexContext = await contributor.captureStaticContext();
      contextData = { ...contextData, ...complexContext };
    }

    // Store and broadcast context
    this.staticContext$.next({ appId, timestamp: Date.now(), data: contextData });
  }
}
```

## 🔄 **Complete Flow Example**

### **Scenario: User clones a panel in dashboard**

1. **User Action**: Clicks clone panel button
2. **Dashboard Plugin**: `ClonePanelAction.execute()` runs
3. **Context Provider**: Detects `clonePanel` action (registered as trigger)
4. **App-based Routing**: `contextManager.refreshContextForApp('dashboard')` called
5. **Dashboard Contributor**: `captureStaticContext()` method called
6. **Embeddable Scan**: All dashboard embeddables scanned and captured
7. **Context Update**: New context with updated panel count stored
8. **Global API**: `window.contextProvider.getCurrentContext()` returns fresh context

### **Scenario: User changes time range in Discover**

1. **User Action**: Changes date picker to "Last 7 days"
2. **URL Update**: `_g` parameter updated with new time range
3. **Context Provider**: Detects `_g` state change
4. **App-based Routing**: `contextManager.refreshContextForApp('discover')` called
5. **Discover Contributor**: `parseUrlState()` method called with new `_g` value
6. **Context Update**: Simple time range context updated
7. **Global API**: Returns updated Discover context

## 🎯 **Key Benefits of This Architecture**

### **1. Plugin Autonomy**
- **Dashboard Plugin**: Implements complex embeddable scanning logic
- **Discover Plugin**: Implements simple URL parsing logic
- **Context Provider**: Just coordinates and routes

### **2. Clear Separation of Concerns**
```
Context Provider = Registry + Routing + Monitoring
Dashboard Plugin = Dashboard-specific context logic
Discover Plugin = Discover-specific context logic
```

### **3. Smart Monitoring**
- Only monitors URL keys that plugins actually care about
- Only monitors UI actions that plugins have registered interest in
- App-based routing ensures correct plugin methods are called

### **4. Zero Core Changes**
- All plugins register voluntarily
- Context Provider is optional dependency
- Existing functionality unaffected

## 🚀 **Usage Examples**

### **For AI/Chatbot Integration**
```javascript
// Get current context (works regardless of which app is active)
const context = await window.contextProvider.getCurrentContext();

if (context.appId === 'dashboard') {
  console.log(`Dashboard has ${context.data.embeddables.count} panels`);
  context.data.embeddables.panels.forEach(panel => {
    console.log(`Panel: ${panel.title} (${panel.type})`);
  });
} else if (context.appId === 'discover') {
  console.log(`Discover query: ${context.data.query}`);
  console.log(`Time range: ${context.data.timeRange}`);
}
```

### **For Plugin Developers**
```typescript
// Simple plugin (URL-based)
class MySimplePlugin implements ContextContributor {
  appId = 'myApp';
  urlStateKeys = ['_g', '_a'];
  parseUrlState(urlState) { return { myData: urlState._a }; }
}

// Complex plugin (custom logic)
class MyComplexPlugin implements ContextContributor {
  appId = 'myApp';
  async captureStaticContext() { 
    return { complexData: await this.scanMyComplexState() }; 
  }
}
```

## ✅ **Summary**

**Your Questions Answered:**

1. **"Where should we do DashboardContextContributor?"** 
   → **In the Dashboard plugin** ([`src/plugins/dashboard/public/context_contributor.ts`](src/plugins/dashboard/public/context_contributor.ts))

2. **"Each plugin can register the context provider service"** 
   → **YES!** Each plugin registers its own contributor in its `start()` method

3. **"Context provider can monitor the current app Id can call the correct method"** 
   → **YES!** Context Provider routes to the correct plugin's methods based on `appId`

This architecture provides **complete plugin autonomy** while maintaining **centralized coordination** through the Context Provider plugin. Each plugin owns its context logic, and the Context Provider just handles the routing and monitoring infrastructure.