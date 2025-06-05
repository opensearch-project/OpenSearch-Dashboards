/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
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
const mockNavigateToApp = jest.fn();

const coreMockWithExploreId = ({
  workspaces: {
    currentWorkspace$,
  },
  getStartServices: async () => [
    { application: { currentAppId$: exploreObservable, navigateToApp: mockNavigateToApp } },
  ],
} as unknown) as CoreSetup<ExploreStartDependencies, ExplorePluginStart>;
const coreMockWithDataExplorerId = ({
  workspaces: {
    currentWorkspace$,
  },
  getStartServices: async () => [
    { application: { currentAppId$: dataExplorerObservable, navigateToApp: mockNavigateToApp } },
  ],
} as unknown) as CoreSetup<ExploreStartDependencies, ExplorePluginStart>;

describe('createQueryEditorExtensionConfig', () => {
  it('returns the correct id and order', () => {
    const result = createQueryEditorExtensionConfig(coreMockWithExploreId);
    expect(result.id).toBe('explore-plugin-extension');
    expect(result.order).toBe(1);
  });

  it('returns the correct isEnabled$ for explore enabled workspace', async () => {
    currentWorkspace$.next(exploreEnabledWorkspace);
    const isEnabled = createQueryEditorExtensionConfig(coreMockWithExploreId).isEnabled$(
      undefined as any
    );
    const isEnabledValue = await isEnabled.pipe(take(1)).toPromise();
    expect(isEnabledValue).toBeTruthy();
  });

  it('returns the correct isEnabled$ for non-explore enabled workspace', async () => {
    currentWorkspace$.next(nonExploreEnabledWorkspace);
    const isEnabled = createQueryEditorExtensionConfig(coreMockWithExploreId).isEnabled$(
      undefined as any
    );
    const isEnabledValue = await isEnabled.pipe(take(1)).toPromise();
    expect(isEnabledValue).toBeFalsy();
  });

  it('returns correct banner for explore app', async () => {
    const banner = createQueryEditorExtensionConfig(coreMockWithExploreId).getBanner?.(
      undefined as any
    );
    render(banner!);
    // wait for it to load
    expect(await screen.findByTestId('exploreNewExperienceBanner')).toBeInTheDocument();
  });

  it('returns correct banner for data explorer app', async () => {
    const banner = createQueryEditorExtensionConfig(coreMockWithDataExplorerId).getBanner?.(
      undefined as any
    );
    render(banner!);
    // wait for it to load
    expect(await screen.findByTestId('exploreClassicExperienceBanner')).toBeInTheDocument();
  });

  it('correct callback for handling switching for data explorer app', async () => {
    const banner = createQueryEditorExtensionConfig(coreMockWithDataExplorerId).getBanner?.(
      undefined as any
    );
    render(banner!);
    // wait for it to load
    await screen.findByTestId('exploreClassicExperienceBanner');
    fireEvent.click(screen.getByTestId('exploreClassicExperienceBanner__newExperienceButton'));
    expect(mockNavigateToApp).toHaveBeenCalled();
  });
});
