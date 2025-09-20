/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Redux Bridge Client - Client-side Redux execution
 *
 * Intercepts HTTP responses from server routes and executes Redux actions
 * directly in the browser context where the Redux store is available.
 */

declare global {
  interface Window {
    exploreServices?: any;
    exploreReduxActions?: any;
  }
}

interface ReduxExecutionInstruction {
  action: string;
  type: string;
  payload: any;
  timestamp: string;
  message: string;
}

class ReduxBridgeClient {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized) return;

    console.log('🌉 Redux Bridge Client initializing (Option C - Client-side execution)...');

    // Wait for global services and set up interception
    this.waitForGlobalServices().then(() => {
      this.setupHttpInterception();
      this.setupReduxMonitoring();
      this.initialized = true;
      console.log('✅ Redux Bridge Client initialized successfully');
    });
  }

  public async waitForGlobalServices(): Promise<void> {
    return new Promise((resolve) => {
      const checkServices = () => {
        if (window.exploreServices && window.exploreServices.store) {
          console.log('🔗 Redux Bridge: Global services detected');

          // Test Redux store access and log current query
          try {
            const currentState = window.exploreServices.store.getState();
            console.log('✅ Redux Store Access: Working');
            console.log('📊 Current Query State:', {
              query: currentState.query?.query || 'empty',
              language: currentState.query?.language || 'unknown',
              dataset: currentState.query?.dataset?.title || 'none',
            });
          } catch (error) {
            console.error('❌ Redux Store Error:', error);
          }

          resolve();
        } else {
          setTimeout(checkServices, 1000);
        }
      };
      checkServices();
    });
  }

  private setupHttpInterception() {
    // Intercept fetch requests to Redux bridge endpoints
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();

      // Only log Redux bridge requests to reduce noise (match both /redux/ and /redux endpoints)
      if (url.includes('/api/osd-mcp-server/redux')) {
        console.log('🎯 MCP Redux Request Intercepted:', url);

        // Call original fetch to get server response
        const response = await originalFetch(input, init);
        const responseData = await response.json();

        console.log('📡 Server Response:', responseData);

        // Check if server returned direct Redux execution instructions (Option D)
        if (responseData.action === 'execute_direct_redux') {
          console.log('🎯 Executing Direct Redux Instructions (Option D)...');

          // Execute Redux action directly without HTTP overhead
          const executionResult = await this.executeDirectReduxInstruction(responseData);
          console.log('✅ Direct Redux Execution Complete:', executionResult.success);

          // Return modified response with execution results
          return new Response(JSON.stringify(executionResult), {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }

        // Fallback: Check if server returned legacy Redux execution instructions
        if (responseData.action === 'execute_redux') {
          console.log('🔧 Executing Legacy Redux Instructions...');

          // Execute Redux action and return modified response
          const executionResult = await this.executeReduxInstruction(responseData);
          console.log('✅ Redux Execution Complete:', executionResult.success);

          // Return modified response with execution results
          return new Response(JSON.stringify(executionResult), {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }

        // Return original response if no Redux instructions
        return new Response(JSON.stringify(responseData), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }

      // For non-bridge requests, use original fetch
      return originalFetch(input, init);
    };

    console.log('🔧 HTTP Interception: Ready for MCP requests');
  }

  public async executeDirectReduxInstruction(instruction: any): Promise<any> {
    const { type, payload, directExecution } = instruction;

    console.log(`🎯 Executing Direct Redux instruction: ${type}`, payload);
    console.log('🎯 Direct execution details:', directExecution);

    const globalServices = window.exploreServices;
    if (!globalServices || !globalServices.store) {
      console.error('❌ Global services or store not available');
      return {
        success: false,
        message: 'Global services or store not available in browser context',
        timestamp: new Date().toISOString(),
        executionType: 'direct_redux',
      };
    }

    try {
      // Use the same handlers but with enhanced logging for direct execution
      switch (type) {
        case 'update_query':
          console.log('🎯 Direct Redux: Updating query directly via store.dispatch()');
          const updateResult = await this.handleUpdateQuery(payload);
          return {
            ...updateResult,
            executionType: 'direct_redux',
            directExecution,
            message: updateResult.message + ' (Direct Redux - No HTTP overhead)',
          };
        case 'execute_query':
          console.log('🎯 Direct Redux: Executing query directly via store.dispatch()');
          const executeResult = await this.handleExecuteQuery(payload);
          return {
            ...executeResult,
            executionType: 'direct_redux',
            directExecution,
            message: executeResult.message + ' (Direct Redux - No HTTP overhead)',
          };
        case 'get_state':
          console.log('🎯 Direct Redux: Getting state directly from store.getState()');
          const stateResult = await this.handleGetState(payload);
          return {
            ...stateResult,
            executionType: 'direct_redux',
            directExecution,
            message: stateResult.message + ' (Direct Redux - No HTTP overhead)',
          };
        default:
          return {
            success: false,
            message: `Unknown Direct Redux instruction type: ${type}`,
            timestamp: new Date().toISOString(),
            executionType: 'direct_redux',
          };
      }
    } catch (error) {
      console.error('❌ Error executing Direct Redux instruction:', error);
      return {
        success: false,
        message: `Error executing Direct Redux instruction: ${error.message}`,
        timestamp: new Date().toISOString(),
        executionType: 'direct_redux',
      };
    }
  }

  private async executeReduxInstruction(instruction: ReduxExecutionInstruction): Promise<any> {
    const { type, payload } = instruction;

    console.log(`🚀 Executing Redux instruction: ${type}`, payload);

    const globalServices = window.exploreServices;
    if (!globalServices || !globalServices.store) {
      console.error('❌ Global services or store not available');
      return {
        success: false,
        message: 'Global services or store not available in browser context',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      switch (type) {
        case 'update_query':
          return await this.handleUpdateQuery(payload);
        case 'execute_query':
          return await this.handleExecuteQuery(payload);
        case 'get_state':
          return await this.handleGetState(payload);
        default:
          return {
            success: false,
            message: `Unknown Redux instruction type: ${type}`,
            timestamp: new Date().toISOString(),
          };
      }
    } catch (error) {
      console.error('❌ Error executing Redux instruction:', error);
      return {
        success: false,
        message: `Error executing Redux instruction: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async handleUpdateQuery(payload: any): Promise<any> {
    const { query, language = 'PPL' } = payload;

    console.log('🎯 Client Redux - Simulating human typing behavior:', { query, language });

    const globalServices = window.exploreServices;
    const currentState = globalServices.store.getState();
    const currentQuery = currentState.query;

    console.log('🔍 Client Redux - BEFORE editor update:', {
      currentQuery: currentQuery.query,
      currentLanguage: currentQuery.language,
      currentDataset: currentQuery.dataset ? currentQuery.dataset.title : 'none',
      requestedQuery: query,
      requestedLanguage: language,
    });

    // 🎯 CORRECT APPROACH: Use OpenSearch Dashboards' Editor Context System
    console.log('🎯 Using OpenSearch Dashboards Editor Context approach...');

    // Try to access the global editor context through window.exploreServices
    const exploreServices = window.exploreServices;
    if (exploreServices && exploreServices.editorRef) {
      console.log('✅ Found exploreServices.editorRef');
      const editor = exploreServices.editorRef.current;
      if (editor && typeof editor.setValue === 'function') {
        console.log('🎯 Using editor.setValue() method');
        editor.setValue(query);
        console.log('✅ Editor value set successfully via EditorContext');
      } else {
        console.log('⚠️ Editor ref exists but no setValue method');
      }
    } else {
      console.log('⚠️ exploreServices.editorRef not found, trying alternative approaches...');

      // Alternative 1: Try to find Monaco editor through global registry
      if ((window as any).monaco && (window as any).monaco.editor) {
        const editors = (window as any).monaco.editor.getEditors();
        console.log('🔧 Found Monaco editors:', editors.length);

        if (editors.length > 0) {
          const editor = editors[0]; // Use the first editor
          console.log('🎯 Using Monaco editor.setValue()');
          editor.setValue(query);
          console.log('✅ Monaco editor value set successfully');
        }
      } else {
        console.log('⚠️ Monaco not available globally');

        // Alternative 2: Try to trigger React onChange through DOM manipulation
        console.log('🔧 Trying DOM-based approach...');
        const editorContainer = document.querySelector(
          '[data-test-subj="exploreQueryPanelEditor"]'
        );
        if (editorContainer) {
          // Find textarea and trigger change events
          const textarea = editorContainer.querySelector('textarea');
          if (textarea) {
            console.log('🎯 Found textarea, setting value and triggering events');
            textarea.value = query;

            // Trigger React synthetic events
            const inputEvent = new Event('input', { bubbles: true });
            const changeEvent = new Event('change', { bubbles: true });
            textarea.dispatchEvent(inputEvent);
            textarea.dispatchEvent(changeEvent);

            // Also try focus/blur to trigger React updates
            textarea.focus();
            setTimeout(() => {
              textarea.blur();
              setTimeout(() => textarea.focus(), 50);
            }, 50);

            console.log('✅ Textarea value set and events triggered');
          } else {
            console.log('⚠️ No textarea found in editor container');
          }
        } else {
          console.log('⚠️ Editor container not found');
        }
      }
    }

    // 2. UPDATE REDUX STATE: Ensure Redux state is updated
    console.log('🔧 Step 2: Updating Redux state...');
    const reduxActions = window.exploreReduxActions;

    // Update query text with history tracking
    if (reduxActions && reduxActions.setQueryStringWithHistory) {
      console.log('🔧 Client Redux - Dispatching setQueryStringWithHistory action');
      globalServices.store.dispatch(reduxActions.setQueryStringWithHistory(query));
    } else {
      console.log('🔧 Client Redux - Dispatching fallback setQueryStringWithHistory action');
      globalServices.store.dispatch({
        type: 'query/setQueryStringWithHistory',
        payload: query,
        meta: { addToHistory: true },
      });
    }

    // 3. EXECUTE QUERY: Run the query
    console.log('🚀 Step 3: Executing query...');
    try {
      if (reduxActions && reduxActions.executeQueries) {
        console.log('🔧 Client Redux - Dispatching executeQueries action');
        await globalServices.store.dispatch(
          reduxActions.executeQueries({ services: globalServices })
        );
      } else {
        console.log('🔧 Client Redux - Dispatching fallback executeQueries action');
        await globalServices.store.dispatch({
          type: 'query/executeQueries',
          payload: { services: globalServices },
        });
      }
      console.log('✅ Query execution completed');
    } catch (error) {
      console.error('❌ Query execution failed:', error);
    }

    // Wait a moment for state to update
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify the update
    const updatedState = globalServices.store.getState();
    const updatedQuery = updatedState.query;

    console.log('✅ Client Redux - AFTER simulated typing and execution:', {
      previousQuery: currentQuery.query,
      updatedQuery: updatedQuery.query,
      previousLanguage: currentQuery.language,
      updatedLanguage: updatedQuery.language,
      queryChanged: currentQuery.query !== updatedQuery.query,
      languageChanged: currentQuery.language !== updatedQuery.language,
      simulationMethod: 'input_events_plus_redux',
    });

    return {
      success: true,
      message: 'Query updated and executed successfully via input simulation + Redux',
      updatedQuery: updatedQuery.query,
      language: updatedQuery.language,
      previousQuery: currentQuery.query,
      previousLanguage: currentQuery.language,
      timestamp: new Date().toISOString(),
      simulationMethod: 'input_events_plus_redux',
      actions: [
        'input.setValue',
        'input.dispatchEvent',
        'setQueryStringWithHistory',
        'executeQueries',
      ],
    };
  }

  private async handleExecuteQuery(payload: any): Promise<any> {
    const { query, waitForResults = true } = payload;

    console.log('🚀 Client Redux - Executing query:', { query, waitForResults });

    const globalServices = window.exploreServices;
    const currentState = globalServices.store.getState();
    let currentQuery = currentState.query;
    const currentResults = currentState.results;

    console.log('🔍 Client Redux - BEFORE query execution:', {
      currentQuery: currentQuery.query,
      currentLanguage: currentQuery.language,
      currentDataset: currentQuery.dataset ? currentQuery.dataset.title : 'none',
      currentResultKeys: Object.keys(currentResults),
      requestedQuery: query,
      waitForResults,
    });

    // If a query was provided, update it first
    if (query) {
      console.log('🔧 Client Redux - Updating query before execution');
      const reduxActions = window.exploreReduxActions;

      if (reduxActions && reduxActions.setQueryStringWithHistory) {
        console.log('🔧 Client Redux - Dispatching setQueryStringWithHistory for execution');
        globalServices.store.dispatch(reduxActions.setQueryStringWithHistory(query));
      } else {
        console.log(
          '🔧 Client Redux - Dispatching fallback setQueryStringWithHistory for execution'
        );
        globalServices.store.dispatch({
          type: 'query/setQueryStringWithHistory',
          payload: query,
          meta: { addToHistory: true },
        });
      }

      // Get updated state
      const updatedState = globalServices.store.getState();
      currentQuery = updatedState.query;
      console.log('🔧 Client Redux - Query updated for execution:', currentQuery.query);
    }

    // Execute the query using Redux actions
    console.log('🚀 Client Redux - Starting query execution...');
    const reduxActions = window.exploreReduxActions;
    let executePromise;

    if (reduxActions && reduxActions.executeQueries) {
      console.log('🔧 Client Redux - Dispatching executeQueries action');
      executePromise = globalServices.store.dispatch(
        reduxActions.executeQueries({ services: globalServices })
      );
    } else {
      console.log('🔧 Client Redux - Dispatching fallback executeQueries action');
      executePromise = globalServices.store.dispatch({
        type: 'query/executeQueries',
        payload: { services: globalServices },
      });
    }

    if (waitForResults) {
      console.log('⏳ Client Redux - Waiting for query execution to complete...');
      // Wait for query execution to complete
      await executePromise;

      // Get updated results
      const finalState = globalServices.store.getState();
      const results = finalState.results;
      const queryStatus = finalState.queryEditor ? finalState.queryEditor.queryStatus : null;

      // Count total results
      let totalResultCount = 0;
      let hasResults = false;

      Object.values(results).forEach((result: any) => {
        if (result && result.hits && result.hits.hits) {
          totalResultCount += result.hits.hits.length;
          hasResults = true;
        }
      });

      console.log('✅ Client Redux - AFTER query execution:', {
        executedQuery: currentQuery.query,
        language: currentQuery.language,
        dataset: currentQuery.dataset ? currentQuery.dataset.title : 'default',
        previousResultKeys: Object.keys(currentResults),
        newResultKeys: Object.keys(results),
        totalResultCount,
        hasResults,
        queryStatus,
        resultCacheKeys: Object.keys(results).length,
      });

      return {
        success: true,
        message: query
          ? `Query "${query}" executed successfully`
          : 'Current query executed successfully',
        executedQuery: currentQuery.query,
        language: currentQuery.language,
        dataset: currentQuery.dataset ? currentQuery.dataset.title : 'default',
        resultCount: totalResultCount,
        hasResults,
        resultCacheKeys: Object.keys(results).length,
        queryStatus,
        timestamp: new Date().toISOString(),
        reduxActions: query ? ['setQueryStringWithHistory', 'executeQueries'] : ['executeQueries'],
      };
    } else {
      console.log('✅ Client Redux - Query execution started (not waiting for results)');
      return {
        success: true,
        message: query ? `Query "${query}" execution started` : 'Current query execution started',
        executedQuery: currentQuery.query,
        language: currentQuery.language,
        dataset: currentQuery.dataset ? currentQuery.dataset.title : 'default',
        waitForResults,
        timestamp: new Date().toISOString(),
        reduxActions: query ? ['setQueryStringWithHistory', 'executeQueries'] : ['executeQueries'],
      };
    }
  }

  private async handleGetState(payload: any): Promise<any> {
    console.log('🔍 Client Redux - Getting current state');

    const globalServices = window.exploreServices;
    const currentState = globalServices.store.getState();
    const queryState = currentState.query;
    const uiState = currentState.ui;
    const queryEditorState = currentState.queryEditor;

    return {
      success: true,
      message: 'Query state retrieved successfully via client-side Redux execution',
      queryState: {
        query: queryState.query,
        language: queryState.language,
        dataset: queryState.dataset
          ? {
              id: queryState.dataset.id,
              title: queryState.dataset.title,
              type: queryState.dataset.type,
            }
          : null,
      },
      uiState: {
        activeTabId: uiState.activeTabId,
      },
      queryEditor: {
        dateRange: queryEditorState ? queryEditorState.dateRange : null,
        queryStatus: queryEditorState ? queryEditorState.queryStatus : null,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private setupReduxMonitoring() {
    const store = window.exploreServices?.store;
    if (!store) return;

    // Subscribe to Redux store changes
    let previousState = store.getState();

    store.subscribe(() => {
      const currentState = store.getState();

      // Check if query state changed
      if (previousState.query !== currentState.query) {
        console.log('🔄 Browser Redux Monitor - Query state changed:', {
          previous: {
            query: previousState.query?.query,
            language: previousState.query?.language,
            dataset: previousState.query?.dataset?.title,
          },
          current: {
            query: currentState.query?.query,
            language: currentState.query?.language,
            dataset: currentState.query?.dataset?.title,
          },
        });
      }

      // Check if results state changed
      if (previousState.results !== currentState.results) {
        const previousResultKeys = Object.keys(previousState.results || {});
        const currentResultKeys = Object.keys(currentState.results || {});

        console.log('📊 Browser Redux Monitor - Results state changed:', {
          previousResultKeys,
          currentResultKeys,
          resultKeysChanged: previousResultKeys.length !== currentResultKeys.length,
        });
      }

      // Check if query editor state changed
      if (previousState.queryEditor !== currentState.queryEditor) {
        console.log('⚙️ Browser Redux Monitor - Query editor state changed:', {
          previous: {
            queryStatus: previousState.queryEditor?.overallQueryStatus?.status,
          },
          current: {
            queryStatus: currentState.queryEditor?.overallQueryStatus?.status,
          },
        });
      }

      previousState = currentState;
    });

    console.log('👂 Redux state monitoring active - will log all state changes');
  }

  // Utility method to get current state (for debugging)
  public getCurrentState() {
    const store = window.exploreServices?.store;
    if (!store) {
      console.log('❌ No Redux store available');
      return null;
    }

    const state = store.getState();
    console.log('🔍 Current Redux State:', {
      query: {
        query: state.query?.query,
        language: state.query?.language,
        dataset: state.query?.dataset?.title,
      },
      results: {
        cacheKeys: Object.keys(state.results || {}),
        totalCacheEntries: Object.keys(state.results || {}).length,
      },
      queryEditor: {
        queryStatus: state.queryEditor?.overallQueryStatus?.status,
      },
    });

    return state;
  }
}

// Add polling mechanism for MCP commands
class MCPCommandPoller {
  private pollingInterval: number = 2000; // 2 seconds
  private isPolling: boolean = false;
  private pollTimer?: NodeJS.Timeout;
  private processedCommands: Set<string> = new Set(); // Track processed commands

  constructor(private reduxBridge: ReduxBridgeClient) {}

  start() {
    if (this.isPolling) return;

    console.log('🔄 MCP Command Polling: Starting (every 2 seconds)');
    this.isPolling = true;
    this.poll();
  }

  stop() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
    this.isPolling = false;
    console.log('🛑 MCP Command Polling: Stopped');
  }

  private async poll() {
    if (!this.isPolling) return;

    try {
      // Check for pending MCP commands
      const response = await fetch('/api/osd-mcp-server/pending-commands', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'osd-xsrf': 'true',
        },
      });

      if (response.ok) {
        const commands = await response.json();

        if (commands && commands.length > 0) {
          console.log('📨 MCP Polling: Found pending commands:', commands.length);

          for (const command of commands) {
            // Create a more robust unique ID for this command to prevent duplicates
            const commandPayloadHash = JSON.stringify(command.payload || {}).substring(0, 100);
            const commandId = `${command.type}_${
              command.timestamp || Date.now()
            }_${commandPayloadHash}`;

            console.log('🔍 MCP Polling: Processing command:', {
              type: command.type,
              action: command.action,
              commandId: commandId.substring(0, 80) + '...',
              alreadyProcessed: this.processedCommands.has(commandId),
            });

            if (this.processedCommands.has(commandId)) {
              console.log(
                '⚠️ MCP Polling: Skipping duplicate command:',
                commandId.substring(0, 80) + '...'
              );
              continue;
            }

            if (command.action === 'execute_direct_redux') {
              console.log('🎯 MCP Polling: Executing direct Redux command');
              console.log('🎯 MCP Polling: Command details:', {
                type: command.type,
                payload: command.payload,
                timestamp: command.timestamp,
              });

              // Mark as processed BEFORE execution to prevent race conditions
              this.processedCommands.add(commandId);

              // Clean up old processed commands (keep only last 50 to prevent memory leaks)
              if (this.processedCommands.size > 50) {
                const commandsArray = Array.from(this.processedCommands);
                this.processedCommands = new Set(commandsArray.slice(-25));
                console.log(
                  '🧹 MCP Polling: Cleaned up processed commands cache, now has:',
                  this.processedCommands.size
                );
              }

              try {
                await this.reduxBridge.executeDirectReduxInstruction(command);
                console.log('✅ MCP Polling: Command executed successfully');
              } catch (error) {
                console.error('❌ MCP Polling: Command execution failed:', error);
                // Remove from processed commands if execution failed so it can be retried
                this.processedCommands.delete(commandId);
              }
            } else {
              console.log('⚠️ MCP Polling: Unknown command action:', command.action);
            }
          }
        }
      }
    } catch (error) {
      // Silently ignore polling errors (server might not have pending commands endpoint yet)
      console.log('🔄 MCP Polling: No pending commands or endpoint not available');
    }

    // Schedule next poll
    if (this.isPolling) {
      this.pollTimer = setTimeout(() => this.poll(), this.pollingInterval);
    }
  }
}

// Initialize the Redux bridge client immediately
console.log('🚀 REDUX BRIDGE CLIENT: Starting initialization...');
console.log('🚀 REDUX BRIDGE CLIENT: Current timestamp:', new Date().toISOString());
console.log('🚀 REDUX BRIDGE CLIENT: Current URL:', window.location.href);
const reduxBridgeClient = new ReduxBridgeClient();

// Initialize MCP command polling
const mcpPoller = new MCPCommandPoller(reduxBridgeClient);

// Start polling when Redux bridge is ready
reduxBridgeClient.waitForGlobalServices().then(() => {
  console.log('🔄 Starting MCP command polling...');
  mcpPoller.start();
});

// Export for compatibility and debugging
export { reduxBridgeClient, mcpPoller };

// Make it available globally for debugging
(window as any).reduxBridgeClient = reduxBridgeClient;
(window as any).mcpPoller = mcpPoller;

console.log('🌐 REDUX BRIDGE CLIENT: Available at window.reduxBridgeClient');
console.log(
  '🔧 REDUX BRIDGE CLIENT: Use window.reduxBridgeClient.getCurrentState() to inspect Redux state'
);
console.log('🎯 REDUX BRIDGE CLIENT: Module loaded and client initialized');
console.log('🎯 REDUX BRIDGE CLIENT: Ready to intercept /api/osd-mcp-server/redux requests');
console.log('🔄 MCP POLLER: Available at window.mcpPoller (start/stop polling)');
