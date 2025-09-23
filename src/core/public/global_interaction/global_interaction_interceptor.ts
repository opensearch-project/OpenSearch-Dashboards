/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-console */

export interface ContextExtractionRule {
  extract: (target: HTMLElement, basicContext: GlobalInteraction) => GlobalInteraction;
}

export interface GlobalInteractionContext {
  uiAction?: {
    type: string;
    trigger?: string;
    actionId?: string;
    data?: any;
    [key: string]: any;
  };
  uiActions?: {
    [key: string]: any;
  };
  semantic?: {
    [key: string]: any;
  };
  custom?: {
    [key: string]: any;
  };
}

export interface GlobalInteraction {
  type: string;
  app?: string;
  testSubj?: string;
  className: string;
  tagName: string;
  text?: string;
  timestamp: string;
  interactionType?: string;
  context?: GlobalInteractionContext;
  [key: string]: any;
}

export class GlobalInteractionInterceptor {
  private contextRules = new Map<string, ContextExtractionRule>();
  private isActive = false;
  private interactionHistory: GlobalInteraction[] = [];
  private maxHistorySize = 1000; // Limit to prevent memory issues

  constructor(
    private deps: {
      getCurrentApp: () => string | undefined;
      contextProvider?: any;
      uiActions?: any; // UI Actions service for rich context
    }
  ) {}

  /**
   * Inject UI Actions service after it becomes available
   */
  public injectUIActions(uiActions: any): void {
    console.log('💉 Injecting UI Actions into Global Interaction Interceptor');
    this.deps.uiActions = uiActions;
    console.log('✅ UI Actions injection complete - direct access now available');

    // Test UI Actions availability immediately
    this.testUIActionsIntegration();
  }

  /**
   * Test UI Actions integration to verify it's working
   */
  private testUIActionsIntegration(): void {
    console.log('🧪 Testing UI Actions integration...');

    try {
      const uiActionsService = this.deps.uiActions;
      if (!uiActionsService) {
        console.error('❌ UI Actions service still not available after injection');
        return;
      }

      // Test basic UI Actions methods with proper error handling
      const triggers = uiActionsService.getTriggers?.() || [];
      console.log(
        '✅ UI Actions getTriggers() works:',
        Array.isArray(triggers) ? triggers.length : 'undefined',
        'triggers found'
      );

      if (Array.isArray(triggers) && triggers.length > 0) {
        console.log(
          '🎯 Available trigger IDs:',
          triggers.map((t: any) => t.id || t)
        );

        // Test getting actions for a common trigger if available
        const firstTrigger = triggers[0];
        const triggerId = firstTrigger.id || firstTrigger;
        console.log(`🔍 Testing getActions() for trigger: ${triggerId}`);

        uiActionsService
          .getActions?.(triggerId)
          .then((actions: any[]) => {
            console.log(
              `✅ UI Actions getActions(${triggerId}) works:`,
              actions.length,
              'actions found'
            );
          })
          .catch((error: any) => {
            console.log(`⚠️ UI Actions getActions(${triggerId}) failed:`, error.message);
          });
      } else {
        console.log('⚠️ No triggers found or getTriggers() returned non-array:', triggers);
      }

      console.log('🎉 UI Actions integration test completed successfully!');
    } catch (error) {
      console.error('❌ UI Actions integration test failed:', error);
    }
  }

  public start(): void {
    if (this.isActive) return;

    console.log(
      '🎯 Starting Global Interaction Interceptor - Simple Mode (Click + Navigation only)'
    );

    // Setup global event listeners - SIMPLIFIED for testing
    document.addEventListener('click', this.handleGlobalClick, true);

    // Setup navigation listeners
    window.addEventListener('popstate', this.handleNavigation);
    window.addEventListener('hashchange', this.handleNavigation);

    // Register default context extraction rules
    this.registerDefaultRules();

    this.isActive = true;
    console.log('✅ Global Interaction Interceptor started successfully (Simple Mode)');
  }

  public stop(): void {
    if (!this.isActive) return;

    console.log('🛑 Stopping Global Interaction Interceptor');

    document.removeEventListener('click', this.handleGlobalClick, true);
    window.removeEventListener('popstate', this.handleNavigation);
    window.removeEventListener('hashchange', this.handleNavigation);

    this.isActive = false;
  }

  private handleGlobalClick = async (event: MouseEvent): Promise<void> => {
    const target = event.target as HTMLElement;
    const basicContext = this.extractBasicContextFromTarget(target, 'click');

    if (basicContext) {
      // Enhance with rich context from UI Actions and other sources
      const enrichedContext = await this.enrichWithContext(basicContext, target, event);
      this.captureInteraction(enrichedContext);
    }
  };

  private handleNavigation = (): void => {
    const context: GlobalInteraction = {
      type: 'navigation',
      className: '',
      tagName: 'NAVIGATION',
      timestamp: new Date().toISOString(),
      app: this.getCurrentAppName(),
      interactionType: 'NAVIGATION',
      previousUrl: document.referrer,
    };

    this.captureInteraction(context);
  };

  private extractBasicContextFromTarget(
    target: HTMLElement,
    eventType: string
  ): GlobalInteraction | null {
    // Create basic context
    const basicContext: GlobalInteraction = {
      type: eventType,
      testSubj: target.getAttribute('data-test-subj') || undefined,
      className: target.className,
      tagName: target.tagName,
      text: this.getCleanText(target),
      timestamp: new Date().toISOString(),
      app: this.getCurrentAppName(),
      // Don't initialize context - only add when we have actual data
    };

    // Apply basic context extraction rules for interactionType
    for (const [selector, rule] of this.contextRules) {
      const matchingElement = target.closest(selector);
      if (matchingElement) {
        try {
          const enhancedContext = rule.extract(matchingElement as HTMLElement, basicContext);
          // Only apply basic enhancements, not rich context yet
          basicContext.interactionType = enhancedContext.interactionType;
          if (enhancedContext.buttonText) basicContext.buttonText = enhancedContext.buttonText;
          if (enhancedContext.buttonType) basicContext.buttonType = enhancedContext.buttonType;
          if (enhancedContext.isDisabled !== undefined)
            basicContext.isDisabled = enhancedContext.isDisabled;
          break; // Use first matching rule
        } catch (error) {
          console.warn(`Error applying context rule for selector ${selector}:`, error);
        }
      }
    }

    return basicContext;
  }

  /**
   * Enrich basic context with UI Actions and other rich context sources
   */
  private async enrichWithContext(
    basicContext: GlobalInteraction,
    target: HTMLElement,
    event: MouseEvent
  ): Promise<GlobalInteraction> {
    const enrichedContext = { ...basicContext };

    console.debug('🔍 DEBUG: Starting context enrichment for:', {
      testSubj: basicContext.testSubj,
      tagName: basicContext.tagName,
      className: basicContext.className,
    });

    try {
      // Get UI Actions context
      console.debug('🔍 DEBUG: Getting UI Action context...');
      const uiActionContext = await this.getUIActionContext(target, event);
      console.debug('🔍 DEBUG: UI Action context result:', uiActionContext);

      // Get semantic context from plugins
      console.debug('🔍 DEBUG: Getting semantic context...');
      const semanticContext = await this.getSemanticContext(target, basicContext);
      console.debug('🔍 DEBUG: Semantic context result:', semanticContext);

      // Only add context object if we have actual data
      if (uiActionContext || semanticContext) {
        enrichedContext.context = {};

        // Combine both UI Actions context and semantic context under uiActions
        const combinedUIActionsContext: any = {};

        if (uiActionContext) {
          combinedUIActionsContext.triggers = uiActionContext.triggers;
          combinedUIActionsContext.actions = uiActionContext.actions;
        }

        if (semanticContext) {
          // Add document expansion data directly to uiActions context
          combinedUIActionsContext.type = semanticContext.type;
          combinedUIActionsContext.source = semanticContext.source;
          combinedUIActionsContext.expandedDocuments = semanticContext.expandedDocuments;
        }

        enrichedContext.context.uiActions = combinedUIActionsContext;

        console.log('🎯 Enriched interaction with context:', enrichedContext);
      } else {
        console.debug('🔍 DEBUG: No rich context found, keeping basic interaction');
      }
    } catch (error) {
      console.warn('❌ Error enriching context:', error);
    }

    return enrichedContext;
  }

  /**
   * Get context from UI Actions system
   */
  private async getUIActionContext(target: HTMLElement, event: MouseEvent): Promise<any> {
    console.debug('🔍 DEBUG: getUIActionContext called');
    console.debug('🔍 DEBUG: uiActions available:', !!this.deps.uiActions);

    if (!this.deps.uiActions) {
      console.debug('🔍 DEBUG: No uiActions service available, trying window.uiActions');
      // Try to get UI Actions from window if not injected
      const windowUIActions = (window as any).uiActions;
      if (windowUIActions) {
        console.debug('🔍 DEBUG: Found uiActions on window, using it');
        this.deps.uiActions = windowUIActions;
      } else {
        console.debug('🔍 DEBUG: No uiActions found anywhere, returning null');
        return null;
      }
    }

    try {
      // Find triggers that might be associated with this element
      const triggers = this.getTriggersForElement(target);
      console.debug('🔍 DEBUG: Found triggers:', triggers);

      if (triggers.length === 0) {
        console.debug('🔍 DEBUG: No triggers found for element');
        return null;
      }

      // Execute UI Actions and collect context
      const uiActionResults: any[] = [];

      for (const trigger of triggers) {
        try {
          console.log(`🔍 DEBUG: Processing trigger: ${trigger}`);
          const context = this.buildUIActionContext(target, event);
          console.debug('🔍 DEBUG: Built UI Action context:', context);

          const actions = this.deps.uiActions.getTriggerActions?.(trigger) || [];
          console.log(`🔍 DEBUG: Actions for trigger ${trigger}:`, actions);

          if (actions && actions.length > 0) {
            // Execute actions and collect their context
            for (const action of actions) {
              console.log(`🔍 DEBUG: Processing action:`, action);
              try {
                if (action.getDisplayName && action.execute) {
                  // Safely get display name with error handling
                  let actionName = 'Unknown Action';
                  try {
                    actionName = action.getDisplayName(context);
                  } catch (displayNameError) {
                    console.warn(
                      `⚠️ Error getting display name for action ${action.id}:`,
                      displayNameError
                    );
                    actionName = action.id || 'Unknown Action';
                  }

                  const actionResult = {
                    trigger,
                    actionId: action.id,
                    actionName,
                    type: this.inferActionType(action, target),
                    data: await this.executeActionForContext(action, context),
                  };
                  console.log(`🔍 DEBUG: Action result:`, actionResult);
                  uiActionResults.push(actionResult);
                }
              } catch (actionError) {
                console.warn(`⚠️ Error processing action ${action.id}:`, actionError);
              }
            }
          } else {
            console.log(`🔍 DEBUG: No actions found for trigger ${trigger}`);
          }
        } catch (error) {
          console.warn(`❌ Error executing UI Action for trigger ${trigger}:`, error);
        }
      }

      const result =
        uiActionResults.length > 0
          ? {
              triggers,
              actions: uiActionResults,
            }
          : null;

      console.debug('🔍 DEBUG: Final UI Action context result:', result);
      return result;
    } catch (error) {
      console.warn('❌ Error getting UI Action context:', error);
      return null;
    }
  }

  /**
   * Get semantic context from plugins via Context Provider
   */
  private async getSemanticContext(
    target: HTMLElement,
    basicContext: GlobalInteraction
  ): Promise<any> {
    console.log(
      '🔍 DEBUG: getSemanticContext called, contextProvider available:',
      !!this.deps.contextProvider
    );

    if (!this.deps.contextProvider) {
      console.debug('🔍 DEBUG: No contextProvider available, trying window.contextProvider');
      // Try to get context provider from window if not injected
      const windowContextProvider = (window as any).contextProvider;
      if (windowContextProvider) {
        console.debug('🔍 DEBUG: Found contextProvider on window, using it');
        this.deps.contextProvider = windowContextProvider;
      } else {
        console.debug('🔍 DEBUG: No contextProvider found anywhere, returning null');
        return null;
      }
    }

    try {
      // For document expansion, wait for Context Provider to process and get updated context
      if (basicContext.testSubj === 'docTableExpandToggleColumn') {
        console.log(
          '🔍 DEBUG: Document expansion detected, waiting for Context Provider to process...'
        );

        // Wait longer for the Context Provider to fully process the document expansion
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Force refresh the context to get the latest state
        const refreshedContext = await this.deps.contextProvider.refreshCurrentContext?.();
        console.debug('🔍 DEBUG: Refreshed context from Context Provider:', refreshedContext);

        if (
          refreshedContext &&
          refreshedContext.data &&
          refreshedContext.data.expandedDocuments &&
          refreshedContext.data.expandedDocuments.length > 0
        ) {
          console.log(
            '🔍 DEBUG: Found expandedDocuments in refreshed context:',
            refreshedContext.data.expandedDocuments.length
          );

          // Extract just the expanded documents with parsed fields (no extra contextData)
          const expandedDocs = refreshedContext.data.expandedDocuments;
          console.debug('🔍 DEBUG: Expanded documents:', expandedDocs);

          return {
            type: 'DOCUMENT_EXPAND',
            source: 'context_provider_refreshed',
            expandedDocuments: expandedDocs,
          };
        }

        // If still no expanded documents, try direct extraction
        console.debug('🔍 DEBUG: No expanded documents found, trying direct extraction');
        const directContext = await this.getDocumentExpansionContextFromProvider(target);
        console.debug('🔍 DEBUG: Direct extraction result:', directContext);
        return directContext;
      }

      // Ask Context Provider for semantic context
      const semanticContext = await this.deps.contextProvider.getSemanticContext?.(
        target,
        basicContext
      );
      return semanticContext;
    } catch (error) {
      console.warn('Error getting semantic context:', error);
      return null;
    }
  }

  /**
   * Get document expansion context from the existing Context Provider system
   */
  private async getDocumentExpansionContextFromProvider(target: HTMLElement): Promise<any> {
    try {
      // Extract document data using the same logic as the existing system
      const tableRow = target.closest('tr');
      if (!tableRow) {
        console.debug('🔍 DEBUG: No table row found for document expansion');
        return null;
      }

      const documentData = this.extractDocumentFromRow(tableRow);
      const documentId = this.generateDocumentId(tableRow);
      const rowIndex = this.getRowIndex(tableRow);
      const tableInfo = this.getTableInfo(tableRow);

      console.debug('🔍 DEBUG: Extracted document expansion context:', {
        documentId,
        rowIndex,
        documentDataKeys: Object.keys(documentData),
        tableInfo,
      });

      return {
        type: 'DOCUMENT_EXPAND',
        documentId,
        rowIndex,
        documentData,
        tableInfo,
        source: 'global_interceptor_extraction',
      };
    } catch (error) {
      console.warn('❌ Error getting document expansion context from provider:', error);
      return null;
    }
  }

  /**
   * Determine which UI Action triggers might apply to this element
   */
  private getTriggersForElement(target: HTMLElement): string[] {
    const triggers: string[] = [];
    const testSubj = target.getAttribute('data-test-subj');

    console.log(
      `🔍 DEBUG: getTriggersForElement - testSubj: ${testSubj}, tagName: ${target.tagName}`
    );

    // Map common test subjects to triggers
    const triggerMap: Record<string, string[]> = {
      docTableExpandToggleColumn: ['ROW_CLICK_TRIGGER', 'CONTEXT_MENU_TRIGGER'],
      filterButton: ['FILTER_TRIGGER'],
      addFilterButton: ['FILTER_TRIGGER'],
      querySubmitButton: ['SEARCH_TRIGGER'],
      // Add more mappings as needed
    };

    if (testSubj && triggerMap[testSubj]) {
      triggers.push(...triggerMap[testSubj]);
      console.log(`🔍 DEBUG: Found triggers for ${testSubj}:`, triggerMap[testSubj]);
    }

    // Also check for generic triggers based on element type
    if (target.tagName === 'BUTTON') {
      triggers.push('BUTTON_CLICK_TRIGGER');
      console.debug('🔍 DEBUG: Added BUTTON_CLICK_TRIGGER for button element');
    }

    const uniqueTriggers = [...new Set(triggers)]; // Remove duplicates
    console.debug('🔍 DEBUG: Final triggers:', uniqueTriggers);
    return uniqueTriggers;
  }

  /**
   * Build context object for UI Action execution
   */
  private buildUIActionContext(target: HTMLElement, event: MouseEvent): any {
    return {
      element: target,
      event,
      testSubj: target.getAttribute('data-test-subj'),
      // Add more context as needed
    };
  }

  /**
   * Infer the action type from the action and target
   */
  private inferActionType(action: any, target: HTMLElement): string {
    const testSubj = target.getAttribute('data-test-subj');

    if (testSubj === 'docTableExpandToggleColumn') {
      return 'DOCUMENT_EXPAND';
    }

    if (testSubj?.includes('filter')) {
      return 'FILTER_ACTION';
    }

    if (action.id?.includes('expand')) {
      return 'EXPAND_ACTION';
    }

    return 'UNKNOWN_ACTION';
  }

  /**
   * Execute action to get context data (without actually performing the action)
   */
  private async executeActionForContext(action: any, context: any): Promise<any> {
    console.debug('🔍 DEBUG: executeActionForContext called with:', { action: action.id, context });

    try {
      // For document expansion, extract document data
      if (context.testSubj === 'docTableExpandToggleColumn') {
        console.debug('🔍 DEBUG: Processing document expansion context');
        const result = this.extractDocumentExpansionContext(context.element);
        console.debug('🔍 DEBUG: Document expansion context result:', result);
        return result;
      }

      // For other actions, return basic context
      const basicResult = {
        element: context.testSubj,
        timestamp: new Date().toISOString(),
      };
      console.debug('🔍 DEBUG: Returning basic context:', basicResult);
      return basicResult;
    } catch (error) {
      console.warn('❌ Error executing action for context:', error);
      return null;
    }
  }

  /**
   * Extract document expansion context
   */
  private extractDocumentExpansionContext(element: HTMLElement): any {
    console.debug('🔍 DEBUG: extractDocumentExpansionContext called with element:', element);

    const tableRow = element.closest('tr');
    console.debug('🔍 DEBUG: Found table row:', !!tableRow);

    if (!tableRow) {
      console.debug('🔍 DEBUG: No table row found, returning null');
      return null;
    }

    const documentData = this.extractDocumentFromRow(tableRow);
    const documentId = this.generateDocumentId(tableRow);
    const rowIndex = this.getRowIndex(tableRow);
    const tableInfo = this.getTableInfo(tableRow);

    console.debug('🔍 DEBUG: Extracted document context:', {
      documentId,
      rowIndex,
      documentDataKeys: Object.keys(documentData),
      tableInfo,
    });

    return {
      type: 'DOCUMENT_EXPAND',
      documentId,
      rowIndex,
      documentData,
      tableInfo,
    };
  }

  /**
   * Get clean, readable text from an element
   */
  private getCleanText(element: HTMLElement): string | undefined {
    if (!element.textContent) return undefined;

    // For SELECT elements, get the selected option text instead of all options
    if (element.tagName === 'SELECT') {
      const selectElement = element as HTMLSelectElement;
      const selectedOption = selectElement.options[selectElement.selectedIndex];
      return selectedOption ? selectedOption.text.trim() : undefined;
    }

    // For other elements, get visible text and clean it up
    let text = element.textContent.trim();

    // If text is too long and seems to be concatenated options/items, try to get a better representation
    if (text.length > 100 && text.includes('ago') && text.includes('from now')) {
      // This looks like a time picker with all options concatenated
      // Try to find the actual selected/visible text
      const visibleText = this.getVisibleText(element);
      if (visibleText && visibleText.length < text.length) {
        text = visibleText;
      }
    }

    // Limit text length and clean up
    text = text.substring(0, 100);

    // Remove extra whitespace and line breaks
    text = text.replace(/\s+/g, ' ').trim();

    return text || undefined;
  }

  /**
   * Try to get only the visible/selected text from an element
   */
  private getVisibleText(element: HTMLElement): string {
    // For elements with aria-label, use that
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // For elements with title, use that
    const title = element.getAttribute('title');
    if (title) return title;

    // For buttons, try to get just the button text without child elements
    if (element.tagName === 'BUTTON') {
      // Get direct text nodes only
      let buttonText = '';
      element.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          buttonText += node.textContent?.trim() + ' ';
        }
      });
      if (buttonText.trim()) return buttonText.trim();
    }

    // Fallback to regular text content
    return element.textContent?.trim() || '';
  }

  /**
   * Get a clean app name from the current app
   */
  private getCurrentAppName(): string | undefined {
    const currentApp = this.deps.getCurrentApp();
    if (!currentApp) return undefined;

    // The app might be something like "explore/logs", let's keep it as is
    // since it provides useful context about which flavor of explore
    return currentApp;
  }

  private captureInteraction(context: GlobalInteraction): void {
    console.log('🎯 Global Interaction Captured:', context);

    // Store in history
    this.addToHistory(context);

    // Send to context provider
    if (this.deps.contextProvider?.captureGlobalInteraction) {
      this.deps.contextProvider.captureGlobalInteraction(context);
    }

    // Also trigger any registered listeners
    this.notifyListeners(context);
  }

  private addToHistory(interaction: GlobalInteraction): void {
    this.interactionHistory.push(interaction);

    // Keep history size manageable
    if (this.interactionHistory.length > this.maxHistorySize) {
      this.interactionHistory.shift(); // Remove oldest interaction
    }

    console.log(`📊 Interaction History: ${this.interactionHistory.length} total interactions`);
  }

  // Public methods to access interaction history
  public getInteractionHistory(): GlobalInteraction[] {
    return [...this.interactionHistory]; // Return copy to prevent external modification
  }

  public getRecentInteractions(count: number = 10): GlobalInteraction[] {
    return this.interactionHistory.slice(-count);
  }

  public getInteractionsByApp(appId: string): GlobalInteraction[] {
    return this.interactionHistory.filter((interaction) => interaction.app === appId);
  }

  public getInteractionsByType(type: string): GlobalInteraction[] {
    return this.interactionHistory.filter((interaction) => interaction.interactionType === type);
  }

  public getInteractionsInTimeRange(startTime: number, endTime: number): GlobalInteraction[] {
    return this.interactionHistory.filter((interaction) => {
      const interactionTime = new Date(interaction.timestamp).getTime();
      return interactionTime >= startTime && interactionTime <= endTime;
    });
  }

  public clearHistory(): void {
    this.interactionHistory = [];
    console.log('🗑️ Interaction history cleared');
  }

  public getHistoryStats(): {
    totalInteractions: number;
    byApp: Record<string, number>;
    byType: Record<string, number>;
    timeRange: { oldest: string; newest: string } | null;
  } {
    if (this.interactionHistory.length === 0) {
      return {
        totalInteractions: 0,
        byApp: {},
        byType: {},
        timeRange: null,
      };
    }

    const byApp: Record<string, number> = {};
    const byType: Record<string, number> = {};

    this.interactionHistory.forEach((interaction) => {
      // Count by app
      const app = interaction.app || 'unknown';
      byApp[app] = (byApp[app] || 0) + 1;

      // Count by interaction type
      const type = interaction.interactionType || interaction.type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      totalInteractions: this.interactionHistory.length,
      byApp,
      byType,
      timeRange: {
        oldest: this.interactionHistory[0].timestamp,
        newest: this.interactionHistory[this.interactionHistory.length - 1].timestamp,
      },
    };
  }

  private listeners: Array<(context: GlobalInteraction) => void> = [];

  public addListener(listener: (context: GlobalInteraction) => void): void {
    this.listeners.push(listener);
  }

  private notifyListeners(context: GlobalInteraction): void {
    this.listeners.forEach((listener) => {
      try {
        listener(context);
      } catch (error) {
        console.warn('Error in interaction listener:', error);
      }
    });
  }

  // Public method to register custom context extraction rules
  public registerContextRule(selector: string, rule: ContextExtractionRule): void {
    this.contextRules.set(selector, rule);
    console.log(`📝 Registered context rule for selector: ${selector}`);
  }

  private registerDefaultRules(): void {
    console.log('📝 Registering default context extraction rules');

    // Generic button rule
    this.registerContextRule('button, [role="button"]', {
      extract: (target, basicContext) => {
        return {
          ...basicContext,
          interactionType: 'BUTTON_CLICK',
          buttonText: target.textContent?.trim(),
          buttonType: target.getAttribute('type'),
          isDisabled: target.hasAttribute('disabled'),
        };
      },
    });

    // Navigation rule
    this.registerContextRule('nav a, [data-test-subj="breadcrumb"] a, .euiSideNav a', {
      extract: (target, basicContext) => {
        return {
          ...basicContext,
          interactionType: 'NAVIGATION_CLICK',
          href: target.getAttribute('href'),
          linkText: target.textContent?.trim(),
          isExternalLink: target.getAttribute('href')?.startsWith('http'),
        };
      },
    });

    // Generic link rule
    this.registerContextRule('a', {
      extract: (target, basicContext) => {
        return {
          ...basicContext,
          interactionType: 'LINK_CLICK',
          href: target.getAttribute('href'),
          linkText: target.textContent?.trim(),
        };
      },
    });

    console.log(`✅ Registered ${this.contextRules.size} default context rules`);
  }

  // Helper methods for context extraction
  protected extractDocumentFromRow(row: HTMLElement | null): Record<string, any> {
    if (!row) return {};

    const documentData: Record<string, any> = {};
    const cells = row.querySelectorAll('td');

    cells.forEach((cell, index) => {
      const fieldName =
        cell.getAttribute('data-field-name') ||
        cell.getAttribute('data-test-subj') ||
        `field_${index}`;

      const value = cell.textContent?.trim();
      if (value) {
        documentData[fieldName] = value;
      }
    });

    return documentData;
  }

  protected generateDocumentId(row: HTMLElement | null): string {
    if (!row) return `doc_${Date.now()}`;

    // Try to get existing document ID
    const existingId = row.getAttribute('data-document-id') || row.getAttribute('data-row-id');

    if (existingId) return existingId;

    // Generate based on row content hash or position
    const rowIndex = this.getRowIndex(row);
    return `doc_row_${rowIndex}_${Date.now()}`;
  }

  protected getRowIndex(row: HTMLElement | null): number {
    if (!row || !row.parentElement) return -1;

    return Array.from(row.parentElement.children).indexOf(row);
  }

  protected getTableInfo(row: HTMLElement | null): Record<string, any> {
    if (!row) return {};

    const table = row.closest('table');
    if (!table) return {};

    return {
      tableTestSubj: table.getAttribute('data-test-subj'),
      totalRows: table.querySelectorAll('tbody tr').length,
      tableId: table.id,
    };
  }
}
