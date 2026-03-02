/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createQueryEditorExtensionConfig } from './create_query_editor_extension_config';
import { BehaviorSubject } from 'rxjs';
import { CoreSetup, WorkspaceObject } from 'opensearch-dashboards/public';
import { ExplorePluginStart, ExploreStartDependencies } from '../../types';
import { take } from 'rxjs/operators';

const exploreEnabledWorkspace = {
  features: ['use-case-observability'],
} as WorkspaceObject;

const nonExploreEnabledWorkspace = {
  features: ['some-weird-feature'],
} as WorkspaceObject;

const currentWorkspace$ = new BehaviorSubject(exploreEnabledWorkspace);
const coreMock = ({
  workspaces: {
    currentWorkspace$,
  },
} as unknown) as CoreSetup<ExploreStartDependencies, ExplorePluginStart>;

describe('createQueryEditorExtensionConfig', () => {
  it('returns the correct id and order', () => {
    const result = createQueryEditorExtensionConfig(coreMock);
    expect(result.id).toBe('explore-plugin-extension');
    expect(result.order).toBe(1);
  });

  it('returns isEnabled$ as false for all workspaces (banners disabled)', async () => {
    // Test with explore enabled workspace
    currentWorkspace$.next(exploreEnabledWorkspace);
    const isEnabledExplore = createQueryEditorExtensionConfig(coreMock).isEnabled$(
      undefined as any
    );
    const isEnabledExploreValue = await isEnabledExplore.pipe(take(1)).toPromise();
    expect(isEnabledExploreValue).toBeFalsy();

    // Test with non-explore enabled workspace
    currentWorkspace$.next(nonExploreEnabledWorkspace);
    const isEnabledNonExplore = createQueryEditorExtensionConfig(coreMock).isEnabled$(
      undefined as any
    );
    const isEnabledNonExploreValue = await isEnabledNonExplore.pipe(take(1)).toPromise();
    expect(isEnabledNonExploreValue).toBeFalsy();
  });

  it('returns null for getBanner (banners completely disabled)', () => {
    const banner = createQueryEditorExtensionConfig(coreMock).getBanner?.(undefined as any);
    expect(banner).toBeNull();
  });
});
