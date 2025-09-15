# Practical Global Implementation Example

## Step 1: Modify Core Application Service

```typescript
// src/core/public/application/application_service.tsx

export class ApplicationService {
  private globalInteractionCapture?: GlobalInteractionCapture;
  
  public async start({ http, notifications, overlays }: ApplicationStartDeps) {
    // ... existing code ...
    
    // Initialize global interaction capture
    this.globalInteractionCapture = new GlobalInteractionCapture({
      getCurrentApp: () => this.currentAppId$.getValue(),
      contextProvider: this.contextProvider // Your existing context provider
    });
    
    this.globalInteractionCapture.start();
    
    return {
      // ... existing return
    };
  }
}

// New class for global interaction capture
class GlobalInteractionCapture {
  constructor(private deps: {
    getCurrentApp: () => string | undefined;
    contextProvider?: any;
  }) {}
  
  start() {
    // Capture all clicks
    document.addEventListener('click', this.handleClick, true);
    
    // Capture keyboard interactions
    document.addEventListener('keydown', this.handleKeydown, true);
    
    // Capture navigation
    window.addEventListener('popstate', this.handleNavigation);
    
    // Capture hash changes (for single-page navigation)
    window.addEventListener('hashchange', this.handleNavigation);
  }
  
  private handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const currentApp = this.deps.getCurrentApp();
    
    const interaction = {
      type: 'click',
      app: currentApp,
      timestamp: Date.now(),
      url: window.location.href,
      target: this.analyzeTarget(target),
      context: this.extractContext(target, currentApp)
    };
    
    // Send to context provider
    this.deps.contextProvider?.captureGlobalInteraction?.(interaction);
    
    console.log('🎯 Global Interaction Captured:', interaction);
  };
  
  private analyzeTarget(target: HTMLElement) {
    return {
      tagName: target.tagName,
      className: target.className,
      id: target.id,
      testSubj: target.getAttribute('data-test-subj'),
      text: target.textContent?.substring(0, 50),
      interactionType: this.detectInteractionType(target)
    };
  }
  
  private detectInteractionType(target: HTMLElement) {
    // Explore-specific interactions
    if (target.closest('[data-test-subj="docTableExpandToggleColumn"]')) {
      return 'document_expand';
    }
    
    if (target.closest('[data-test-subj="filterButton"]')) {
      return 'filter_action';
    }
    
    // Dashboard-specific interactions
    if (target.closest('[data-test-subj="embeddablePanelAction"]')) {
      return 'dashboard_panel_action';
    }
    
    // Navigation
    if (target.closest('nav') || target.closest('[data-test-subj="breadcrumb"]')) {
      return 'navigation';
    }
    
    // Generic button/link
    if (target.tagName === 'BUTTON' || target.tagName === 'A') {
      return 'button_click';
    }
    
    return 'generic_click';
  }
  
  private extractContext(target: HTMLElement, app?: string) {
    const context: any = { app };
    
    // Extract app-specific context
    switch (app) {
      case 'explore':
        return this.extractExploreContext(target, context);
      case 'dashboard':
        return this.extractDashboardContext(target, context);
      case 'discover':
        return this.extractDiscoverContext(target, context);
      default:
        return context;
    }
  }
  
  private extractExploreContext(target: HTMLElement, context: any) {
    // Document expansion
    if (target.closest('[data-test-subj="docTableExpandToggleColumn"]')) {
      const row = target.closest('tr');
      if (row) {
        context.documentId = row.getAttribute('data-document-id');
        context.documentData = this.extractDocumentDataFromRow(row);
      }
    }
    
    // Filter actions
    if (target.closest('[data-test-subj="filterButton"]')) {
      context.fieldName = target.getAttribute('data-field-name');
      context.filterValue = target.getAttribute('data-filter-value');
    }
    
    return context;
  }
  
  private extractDashboardContext(target: HTMLElement, context: any) {
    // Dashboard panel interactions
    if (target.closest('[data-test-subj="embeddablePanelAction"]')) {
      const panel = target.closest('[data-test-subj="embeddablePanel"]');
      if (panel) {
        context.panelId = panel.getAttribute('data-panel-id');
        context.panelType = panel.getAttribute('data-panel-type');
      }
    }
    
    return context;
  }
  
  private extractDiscoverContext(target: HTMLElement, context: any) {
    // Similar to explore but for discover-specific interactions
    return context;
  }
  
  private handleNavigation = () => {
    const interaction = {
      type: 'navigation',
      app: this.deps.getCurrentApp(),
      timestamp: Date.now(),
      url: window.location.href,
      previousUrl: document.referrer
    };
    
    this.deps.contextProvider?.captureGlobalInteraction?.(interaction);
  };
  
  stop() {
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('keydown', this.handleKeydown, true);
    window.removeEventListener('popstate', this.handleNavigation);
    window.removeEventListener('hashchange', this.handleNavigation);
  }
}
```

## Step 2: Update Context Provider to Handle Global Interactions

```typescript
// src/plugins/context_provider/public/context_provider_service.ts

export class ContextProviderService {
  // ... existing code ...
  
  captureGlobalInteraction(interaction: GlobalInteraction) {
    console.log('📊 Global Interaction:', interaction);
    
    // Route to appropriate contributor based on app
    const contributor = this.contributors.get(interaction.app);
    if (contributor && contributor.handleGlobalInteraction) {
      contributor.handleGlobalInteraction(interaction);
    }
    
    // Store in global interaction history
    this.globalInteractionHistory.push(interaction);
    
    // Trigger any global listeners
    this.notifyGlobalInteractionListeners(interaction);
  }
}
```

## Step 3: Update Explore Context Contributor

```typescript
// src/plugins/explore/public/context_contributor.ts

export class ExploreContextContributor implements StatefulContextContributor {
  // ... existing code ...
  
  handleGlobalInteraction(interaction: GlobalInteraction) {
    console.log('🔍 Explore handling global interaction:', interaction);
    
    switch (interaction.target.interactionType) {
      case 'document_expand':
        this.handleDocumentExpand({
          documentId: interaction.context.documentId,
          documentData: interaction.context.documentData,
          source: 'global_capture'
        });
        break;
        
      case 'filter_action':
        this.handleFieldFilterAdd({
          fieldName: interaction.context.fieldName,
          filterValue: interaction.context.filterValue,
          source: 'global_capture'
        });
        break;
    }
  }
}
```

## Benefits of This Approach:

1. **🎯 Captures Everything**: All clicks, navigation, keyboard interactions
2. **🔄 Works Across All Pages**: Automatically active on Explore, Dashboard, Discover, etc.
3. **🧠 Smart Context Extraction**: Knows how to extract relevant data for each app
4. **📊 Comprehensive Tracking**: Navigation between pages, user journey tracking
5. **🛠️ Easy to Extend**: Add new interaction types by updating the detection logic

## Usage:
Once implemented, this will automatically capture:
- Document expansions in Explore
- Filter additions/removals in Explore
- Dashboard panel interactions
- Navigation between pages
- Any button clicks across the entire application
- Keyboard shortcuts and interactions

No need to add listeners to individual pages - it's all handled globally!