/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Worker URL mapping for static files served by OpenSearch Dashboards
const WORKER_URL_MAP: Record<string, string> = {
  json: '/ui/assets/monaco-workers/json.editor.worker.js',
  ppl: '/ui/assets/monaco-workers/ppl.editor.worker.js',
  xjson: '/ui/assets/monaco-workers/xjson.editor.worker.js',
};

// Helper function to get base path from current location
function getBasePath(): string {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return '';
  }

  // Extract base path from the current page URL
  // This handles cases where OpenSearch Dashboards is served from a subpath
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);

  // Handle different deployment patterns:
  // 1. Workspace URLs: /w/{workspaceId}/app/... → /w/{workspaceId}
  // 2. Custom base path: /opensearch-dashboards/app/... → /opensearch-dashboards
  // 3. Root deployment: /app/... → (empty)

  if (segments.length >= 3 && segments[0] === 'w' && segments[2] === 'app') {
    // Workspace pattern: /w/{workspaceId}/app/...
    return `/${segments[0]}/${segments[1]}`;
  } else if (segments.length >= 2 && segments[segments.length - 2] === 'app') {
    // Find where 'app' appears and take everything before it as base path
    const appIndex = segments.indexOf('app');
    if (appIndex > 0) {
      return '/' + segments.slice(0, appIndex).join('/');
    }
  } else if (segments.length > 0 && segments[0] !== 'app' && segments[0] !== 'ui') {
    // Simple case: first segment is not 'app' or 'ui'
    return `/${segments[0]}`;
  }

  return '';
}

// @ts-ignore
window.MonacoEnvironment = {
  getWorker: (_: string, label: string) => {
    const workerUrl = WORKER_URL_MAP[label];
    if (workerUrl) {
      const basePath = getBasePath();
      const fullWorkerUrl = basePath + workerUrl;

      // Debug logging to help troubleshoot worker loading
      console.log(`Monaco Worker [${label}]:`, {
        pathname: window.location.pathname,
        basePath,
        workerUrl,
        fullWorkerUrl,
      });

      return new Worker(fullWorkerUrl);
    }
    throw new Error(`No worker available for language: ${label}`);
  },
};
