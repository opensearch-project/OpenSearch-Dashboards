/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */
/* eslint-disable no-console */

import { useState, useEffect } from 'react';
import { ContextData } from '../types';

export function useContextProvider() {
  const [context, setContext] = useState<ContextData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateContext = async () => {
      try {
        const contextProvider = (window as any).contextProvider;
        if (contextProvider && typeof contextProvider.getCurrentContext === 'function') {
          const currentContext = await contextProvider.getCurrentContext();
          console.log('🔄 Context updated for AI Chatbot:', currentContext);
          console.debug(
            '🔥 debug: AI Chatbot received context with keys:',
            currentContext?.data ? Object.keys(currentContext.data) : 'no data'
          );
          console.debug(
            '🔥 DEBUG: AI Chatbot expandedDocuments count:',
            currentContext?.data?.expandedDocuments?.length || 0
          );
          setContext(currentContext);
          setError(null);
        } else {
          console.warn('⚠️ Context Provider not available');
          setContext({
            pageType: 'unknown',
            currentUrl: window.location.href,
            timestamp: Date.now(),
          });
          setError('Context Provider not available');
        }
      } catch (err) {
        console.error('❌ Error fetching context:', err);
        setError(err.message);
        setContext({
          pageType: 'error',
          currentUrl: window.location.href,
          timestamp: Date.now(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    updateContext();

    // Listen for context updates from our Context Provider
    const handleContextUpdate = (event: any) => {
      console.log('📡 Context Provider update received:', event.detail);
      updateContext();
    };

    window.addEventListener('contextProviderUpdate', handleContextUpdate);

    // 🔧 FIX: Listen for static context updates to refresh AI assistant context
    const handleStaticContextUpdate = () => {
      console.log('🔥 DEBUG: Static context update detected, refreshing AI assistant context');
      setTimeout(updateContext, 50); // Small delay to ensure context is available
    };

    // Listen for our custom static context update events
    window.addEventListener('staticContextUpdated', handleStaticContextUpdate);

    // Also update on URL changes
    const handleUrlChange = () => {
      setTimeout(updateContext, 1000); // Delay to let page load
    };

    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('contextProviderUpdate', handleContextUpdate);
      window.removeEventListener('staticContextUpdated', handleStaticContextUpdate);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  return { context, isLoading, error };
}

export function useContextSummary(context: ContextData | null): string {
  if (!context) return 'No context available';

  const parts = [];

  if (context.pageType) {
    parts.push(`Page: ${context.pageType}`);
  }

  if (context.panels && context.panels.length > 0) {
    parts.push(`${context.panels.length} dashboard panels`);
  }

  if (context.expandedDocuments && context.expandedDocuments.length > 0) {
    parts.push(`${context.expandedDocuments.length} expanded documents`);
  }

  if (context.filters && context.filters.length > 0) {
    parts.push(`${context.filters.length} active filters`);
  }

  if (context.query) {
    parts.push('active query');
  }

  return parts.length > 0 ? parts.join(', ') : 'Basic page context';
}
