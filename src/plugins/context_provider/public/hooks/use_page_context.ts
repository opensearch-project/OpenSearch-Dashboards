/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { useAssistantContext } from './use_assistant_context';

/**
 * URL state interface for OpenSearch Dashboards
 */
export interface URLState {
  pathname: string;
  search: string;
  hash: string;
  searchParams: Record<string, string>;
  _g?: any; // Global state parameter
  _a?: any; // App state parameter
}

/**
 * Options for usePageContext hook
 */
export interface UsePageContextOptions {
  description: string;
  convert?: (urlState: URLState) => any;
  categories?: string[];
  enabled?: boolean;
}

/**
 * Parse OpenSearch Dashboards URL parameter (like _g or _a)
 */
function parseOSDUrlParam(paramName: string): any {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get(paramName);
    if (!param) return null;
    
    // Decode and parse the parameter
    const decoded = decodeURIComponent(param);
    return JSON.parse(decoded);
  } catch (error) {
    console.debug(`Failed to parse URL parameter ${paramName}:`, error);
    return null;
  }
}

/**
 * Capture current URL state including OpenSearch Dashboards specific parameters
 */
function captureCurrentURLState(): URLState {
  const url = new URL(window.location.href);
  
  return {
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    searchParams: Object.fromEntries(url.searchParams.entries()),
    _g: parseOSDUrlParam('_g'),
    _a: parseOSDUrlParam('_a'),
  };
}

/**
 * Hook for automatically capturing page context from URL state.
 * 
 * Zero-config usage:
 * ```typescript
 * const pageContextId = usePageContext();
 * ```
 * 
 * Custom usage with conversion:
 * ```typescript
 * const pageContextId = usePageContext({
 *   description: "Dashboard state",
 *   convert: (urlState) => ({
 *     dashboardId: urlState._a?.dashboardId,
 *     timeRange: urlState._g?.time,
 *   }),
 *   categories: ['dashboard', 'page']
 * });
 * ```
 */
export function usePageContext(): string;
export function usePageContext(options: UsePageContextOptions): string;
export function usePageContext(options?: UsePageContextOptions): string {
  // Auto-capture URL state
  const [urlState, setUrlState] = useState<URLState>(() => captureCurrentURLState());

  // Monitor URL changes (similar to ContextCaptureService.setupUrlMonitoring)
  useEffect(() => {
    if (options?.enabled === false) return;

    let lastUrl = window.location.href;
    let lastHash = window.location.hash;

    const handleURLChange = () => {
      const currentUrl = window.location.href;
      const currentHash = window.location.hash;

      if (currentUrl !== lastUrl || currentHash !== lastHash) {
        setUrlState(captureCurrentURLState());
        lastUrl = currentUrl;
        lastHash = currentHash;
      }
    };

    // Listen for browser navigation events
    window.addEventListener('popstate', handleURLChange);
    window.addEventListener('hashchange', handleURLChange);
    
    // Poll for programmatic URL changes (OpenSearch Dashboards URL state management)
    const interval = setInterval(handleURLChange, 1000);

    return () => {
      window.removeEventListener('popstate', handleURLChange);
      window.removeEventListener('hashchange', handleURLChange);
      clearInterval(interval);
    };
  }, [options?.enabled]);

  // Prepare context options
  const contextOptions = useMemo(() => {
    if (options?.enabled === false) {
      return {
        description: 'Disabled page context',
        value: null,
        label: 'Disabled',
        categories: ['disabled'],
      };
    }

    const processedValue = options?.convert ? options.convert(urlState) : urlState;
    
    return {
      description: options?.description || `Page context for ${urlState.pathname}`,
      value: processedValue,
      label: `Page: ${urlState.pathname}`,
      categories: options?.categories || ['page', 'url'],
    };
  }, [urlState, options]);

  return useAssistantContext(contextOptions);
}