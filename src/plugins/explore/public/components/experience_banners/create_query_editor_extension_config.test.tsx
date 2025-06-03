/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { createQueryEditorExtensionConfig } from './create_query_editor_extension_config';
import { BehaviorSubject, Observable } from 'rxjs';
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
const exploreObservable = new Observable((subscriber) => {
  subscriber.next('explore');
});
const dataExplorerObservable = new Observable((subscriber) => {
  subscriber.next('data-explorer');
});

const coreMockWithExploreId = ({
  workspaces: {
    currentWorkspace$,
  },
  getStartServices: async () => [{ application: { currentAppId$: exploreObservable } }],
} as unknown) as CoreSetup<ExploreStartDependencies, ExplorePluginStart>;
const coreMockWithDataExplorerId = ({
  workspaces: {
    currentWorkspace$,
  },
  getStartServices: async () => [{ application: { currentAppId$: dataExplorerObservable } }],
} as unknown) as CoreSetup<ExploreStartDependencies, ExplorePluginStart>;

describe('createQueryEditorExtensionConfig', () => {
  it('returns the correct id and order', () => {
    const result = createQueryEditorExtensionConfig(coreMockWithExploreId);
    expect(result.id).toBe('explore-plugin-extension');
    expect(result.order).toBe(1);
  });

  it('returns the correct isEnabled$ for explore enabled workspace', async () => {
    currentWorkspace$.next(exploreEnabledWorkspace);
    const isEnabled = await createQueryEditorExtensionConfig(coreMockWithExploreId).isEnabled$(
      undefined as any
    );
    const isEnabledValue = await isEnabled.pipe(take(1)).toPromise();
    expect(isEnabledValue).toBeTruthy();
  });

  it('returns the correct isEnabled$ for non-explore enabled workspace', async () => {
    currentWorkspace$.next(nonExploreEnabledWorkspace);
    const isEnabled = await createQueryEditorExtensionConfig(coreMockWithExploreId).isEnabled$(
      undefined as any
    );
    const isEnabledValue = await isEnabled.pipe(take(1)).toPromise();
    expect(isEnabledValue).toBeFalsy();
  });

  it('returns correct banner for explore app', async () => {
    const banner = await createQueryEditorExtensionConfig(coreMockWithExploreId).getBanner?.(
      undefined as any
    );
    render(banner!);
    expect(screen.getByTestId('exploreNewExperienceBanner')).toBeInTheDocument();
  });

  it('returns correct banner for data explorer app', async () => {
    const banner = await createQueryEditorExtensionConfig(coreMockWithDataExplorerId).getBanner?.(
      undefined as any
    );
    render(banner!);
    expect(screen.getByTestId('exploreClassicExperienceBanner')).toBeInTheDocument();
  });
});
