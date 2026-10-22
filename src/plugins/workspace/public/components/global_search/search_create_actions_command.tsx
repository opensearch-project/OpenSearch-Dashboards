/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiHighlight } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ApplicationStart, GlobalSearchResult, IBasePath } from '../../../../../core/public';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';

interface SearchCreateActionsOptions {
  query: string;
  currentWorkspaceId?: string;
  basePath: IBasePath;
  navigateToUrl: ApplicationStart['navigateToUrl'];
}

const createActions = [
  {
    id: 'new-dashboard',
    label: i18n.translate('workspace.globalSearch.actions.newDashboard', {
      defaultMessage: 'New dashboard',
    }),
    path: '/app/dashboards#/create',
  },
  {
    id: 'new-visualization',
    label: i18n.translate('workspace.globalSearch.actions.newVisualization', {
      defaultMessage: 'New visualization',
    }),
    path: '/app/visualization-editor',
  },
];

export const searchCreateActions = ({
  query,
  currentWorkspaceId,
  basePath,
  navigateToUrl,
}: SearchCreateActionsOptions): GlobalSearchResult[] => {
  if (!currentWorkspaceId) {
    return [];
  }

  const normalizedQuery = query.trim().toLocaleLowerCase();

  return createActions
    .filter(({ label }) => label.toLocaleLowerCase().includes(normalizedQuery))
    .map(({ id, label, path }) => {
      const href = formatUrlWithWorkspaceId(path, currentWorkspaceId, basePath);

      return {
        id,
        label,
        content: <EuiHighlight search={query}>{label}</EuiHighlight>,
        href,
        execute: () => navigateToUrl(href),
      };
    });
};
