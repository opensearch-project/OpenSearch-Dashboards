/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { useDynamicContext } from './use_dynamic_context';
import { getStateFromOsdUrl } from '../../../opensearch_dashboards_utils/public';

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
  _q?: any; // Query state parameter (for Explore)
}

/**
 * Options for usePageContext hook
 */
export interface UsePageContextOptions {
  description?: string;
  convert?: (urlState: URLState) => any;
  categories?: string[];
  enabled?: boolean;
}

// Constants for stable references
const DEFAULT_CATEGORIES = ['page', 'url', 'static'];

/**
 * Capture current URL state using direct browser URL monitoring
 * Uses OpenSearch Dashboards' existing URL parsing utilities
 */
function captureCurrentURLState(): URLState {
  const url = new URL(window.location.href);

  // Use OpenSearch Dashboards' built-in URL state parsing utilities
  // These handle rison decoding automatically
  const _g = getStateFromOsdUrl('_g', url.href);
  const _a = getStateFromOsdUrl('_a', url.href);
  const _q = getStateFromOsdUrl('_q', url.href);

  const urlState: URLState = {
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    searchParams: Object.fromEntries(url.searchParams.entries()),
    _g,
    _a,
    _q,
  };

  return urlState;
}

/**
 * Hook for automatically capturing page context from URL state.
 * Uses direct browser URL monitoring with OpenSearch Dashboards parsing utilities.
 */
export function usePageContext(options?: UsePageContextOptions): string {
  const [urlState, setUrlState] = useState<URLState | null>(null);

  useEffect(() => {
    if (options?.enabled === false) return;

    // Initial state capture
    const initialState = captureCurrentURLState();
    setUrlState(initialState);

    // Set up URL change monitoring
    const handleUrlChange = (source: string) => {
      const newState = captureCurrentURLState();
      setUrlState(newState);
    };

    // 1. Monitor hash changes (PRIMARY method for OpenSearch Dashboards)
    // This covers most URL changes in OSD since it uses hash-based routing
    const hashChangeHandler = () => handleUrlChange('hashchange');
    window.addEventListener('hashchange', hashChangeHandler);

    // 2. Monitor popstate for back/forward navigation
    const popstateHandler = () => handleUrlChange('popstate');
    window.addEventListener('popstate', popstateHandler);

    // 3. Monitor pushState/replaceState (for programmatic navigation)
    // These are the main methods used by OpenSearch Dashboards for navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      // Use microtask to ensure URL is updated before we check it
      queueMicrotask(() => handleUrlChange('pushState'));
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      // Use microtask to ensure URL is updated before we check it
      queueMicrotask(() => handleUrlChange('replaceState'));
    };

    // Cleanup
    return () => {
      window.removeEventListener('hashchange', hashChangeHandler);
      window.removeEventListener('popstate', popstateHandler);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [options?.enabled]);

  // Simplified context options with stable references
  const contextOptions = useMemo(() => {
    if (options?.enabled === false) {
      return {
        description: 'Disabled page context',
        value: null,
        label: 'Disabled',
        categories: ['disabled'],
      };
    }

    if (!urlState) {
      return null;
    }

    // Create processed value
    const processedValue = options?.convert ? options.convert(urlState) : urlState;

    return {
      description: options?.description || `Page context for ${urlState.pathname}`,
      value: processedValue,
      label: `Page: ${urlState.pathname}`,
      categories: options?.categories || DEFAULT_CATEGORIES,
    };
  }, [urlState, options]); // Include options in dependencies

  const contextId = useDynamicContext(contextOptions);

  return contextId;
}
