/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { UiSettingScope } from '../../../../../../core/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { LOGS_BUILDER_MODE_ONLY_SETTING } from '../../../../common';

/**
 * Whether the logs editor should allow only the visual query builder.
 *
 * The setting is workspace-scoped, so it only applies inside a workspace and is
 * read via `getUserProvidedWithScope` (the default cache is global-scoped),
 * re-reading whenever the current workspace changes. It is registered only when
 * the query builder is enabled, so `enabled` gates the read.
 */
export const useBuilderOnlyMode = (enabled: boolean): boolean => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings, core } = services;
  const [builderOnly, setBuilderOnly] = useState(false);
  const builderOnlyRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const workspaces = core?.workspaces;
    const apply = (next: boolean) => {
      if (next === builderOnlyRef.current) return;
      builderOnlyRef.current = next;
      setBuilderOnly(next);
    };
    const sub = workspaces?.currentWorkspaceId$.subscribe(async (workspaceId) => {
      if (!workspaceId) {
        apply(false);
        return;
      }
      try {
        const value = await uiSettings.getUserProvidedWithScope<boolean>(
          LOGS_BUILDER_MODE_ONLY_SETTING,
          UiSettingScope.WORKSPACE
        );
        apply(Boolean(value));
      } catch {
        apply(false);
      }
    });
    return () => sub?.unsubscribe();
  }, [enabled, uiSettings, core]);

  return builderOnly;
};
