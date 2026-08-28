/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiHighlight, EuiText } from '@elastic/eui';
import {
  ApplicationStart,
  ChromeRecentlyAccessedHistoryItem,
  GlobalSearchResult,
  IBasePath,
} from '../../../../../core/public';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';

interface SearchRecentlyAccessedOptions {
  items: ChromeRecentlyAccessedHistoryItem[];
  query: string;
  currentWorkspaceId?: string;
  basePath: IBasePath;
  navigateToUrl: ApplicationStart['navigateToUrl'];
}

type RecentlyAccessedItemWithType = ChromeRecentlyAccessedHistoryItem & {
  meta: {
    type: string;
    lastAccessedTime?: number;
  };
};

const hasType = (item: ChromeRecentlyAccessedHistoryItem): item is RecentlyAccessedItemWithType =>
  Boolean(item.meta?.type);

export const searchRecentlyAccessed = ({
  items,
  query,
  currentWorkspaceId,
  basePath,
  navigateToUrl,
}: SearchRecentlyAccessedOptions): GlobalSearchResult[] => {
  if (!currentWorkspaceId) {
    return [];
  }

  const normalizedQuery = query.trim().toLocaleLowerCase();

  return items
    .filter((item) => item.workspaceId === currentWorkspaceId)
    .filter(hasType)
    .filter((item) => item.label.toLocaleLowerCase().includes(normalizedQuery))
    .map((item) => {
      const href = formatUrlWithWorkspaceId(item.link, currentWorkspaceId, basePath);

      return {
        id: item.id,
        label: item.label,
        content: (
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiHighlight search={query}>{item.label}</EuiHighlight>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText color="subdued" size="xs" style={{ textTransform: 'capitalize' }}>
                {item.meta.type}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        ),
        href,
        execute: () => navigateToUrl(href),
      };
    });
};
