/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

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
          setContext(currentContext);
          setError(null);
        } else {
          console.warn('⚠️ Context Provider not available');
          setContext({
            pageType: 'unknown',
            currentUrl: window.location.href,
            timestamp: Date.now()
          });
          setError('Context Provider not available');
        }
      } catch (err) {
        console.error('❌ Error fetching context:', err);
        setError(err.message);
        setContext({
          pageType: 'error',
          currentUrl: window.location.href,
          timestamp: Date.now()
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

    // Only update on events, not periodic polling
    // const interval = setInterval(updateContext, 10000);

    // Also update on URL changes
    const handleUrlChange = () => {
      setTimeout(updateContext, 1000); // Delay to let page load
    };

    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('contextProviderUpdate', handleContextUpdate);
      window.removeEventListener('popstate', handleUrlChange);
      // clearInterval(interval); // Removed since we're not using periodic polling
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