/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IBasePath } from '../../../../../core/public';
import { searchCreateActions } from './search_create_actions_command';

const currentWorkspaceId = 'current-workspace';
const basePath = {
  remove: jest.fn((path: string) => path),
  prepend: jest.fn((path: string) => `/base${path}`),
} as unknown as IBasePath;
const navigateToUrl = jest.fn().mockResolvedValue(undefined);

describe('searchCreateActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns both actions for an empty query in the expected order', () => {
    const results = searchCreateActions({
      query: '',
      currentWorkspaceId,
      basePath,
      navigateToUrl,
    });

    expect(results.map(({ id }) => id)).toEqual(['new-dashboard', 'new-visualization']);
    expect(results[0].href).toContain(`/w/${currentWorkspaceId}/app/dashboards`);
    expect(results[0].href).toContain('#/create');
    expect(results[1].href).toContain(`/w/${currentWorkspaceId}/app/visualization-editor`);
  });

  it('filters actions by label case-insensitively', () => {
    expect(
      searchCreateActions({
        query: 'DASH',
        currentWorkspaceId,
        basePath,
        navigateToUrl,
      }).map(({ id }) => id)
    ).toEqual(['new-dashboard']);

    expect(
      searchCreateActions({
        query: 'visual',
        currentWorkspaceId,
        basePath,
        navigateToUrl,
      }).map(({ id }) => id)
    ).toEqual(['new-visualization']);
  });

  it('returns no actions without a current workspace', () => {
    expect(
      searchCreateActions({
        query: '',
        basePath,
        navigateToUrl,
      })
    ).toEqual([]);
  });

  it('navigates to the workspace-aware action URL', () => {
    const [result] = searchCreateActions({
      query: '',
      currentWorkspaceId,
      basePath,
      navigateToUrl,
    });

    result.execute();

    expect(navigateToUrl).toHaveBeenCalledWith(result.href);
  });
});
