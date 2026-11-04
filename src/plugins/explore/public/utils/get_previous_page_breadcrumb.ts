/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChromeStart, ChromeRecentlyAccessedHistoryItem, ApplicationStart } from 'src/core/public';

export interface BreadcrumbConfig {
  href?: string;
  onClick?: () => void;
}

export interface PreviousPageInfo {
  breadcrumbConfig: BreadcrumbConfig;
  previousPage?: ChromeRecentlyAccessedHistoryItem;
}

export interface GetBreadcrumbOptions {
  chrome: ChromeStart;
  application?: ApplicationStart;
  currentPageId?: string;
}

/**
 * Get breadcrumb configuration that navigates to the previous page
 * Uses chrome.recentlyAccessed to determine where the user came from
 *
 * @param options - Configuration options
 * @returns Previous page info with breadcrumb config
 */
export function getPreviousPageBreadcrumb(options: GetBreadcrumbOptions): PreviousPageInfo {
  const { chrome, application, currentPageId: pageId } = options;
  const recentlyAccessed = chrome.recentlyAccessed.get();

  // Get the most recently accessed page (first item, which is most recent)
  // Skip if it's the current page
  const previousPage =
    recentlyAccessed.length > 0 && recentlyAccessed[0].id !== pageId
      ? recentlyAccessed[0]
      : undefined;

  if (previousPage && previousPage.link) {
    // We found a previous page - construct the full URL with workspace ID
    let href = previousPage.link;

    // Check if the current URL has a workspace ID and the previous page link doesn't
    const currentPathname = window.location.pathname;
    const workspaceMatch = currentPathname.match(/\/w\/([^/]+)\//);

    if (workspaceMatch && !href.includes('/w/')) {
      // Add workspace ID to the href
      const workspaceId = workspaceMatch[1];
      href = `/w/${workspaceId}${href}`;
    }

    // If application service is available, use onClick with navigateToUrl for SPA navigation
    if (application) {
      return {
        breadcrumbConfig: {
          onClick: () => {
            application.navigateToUrl(href);
          },
        },
        previousPage,
      };
    }

    // Fallback to href (may cause hard refresh)
    return { breadcrumbConfig: { href }, previousPage };
  } else {
    // No previous page found, fallback to explore home
    return { breadcrumbConfig: { href: '#/' } };
  }
}
