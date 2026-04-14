/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { UiSettingScope } from 'opensearch-dashboards/public';

import { ExploreServices } from '../../../types';

export const useResolvedOpenSearchDataSourceId = (
  services: ExploreServices,
  explicitDataSourceId?: string,
  options?: {
    onlyWhenHideLocalCluster?: boolean;
  }
) => {
  const shouldUseManagedDataSource =
    services.dataSourceEnabled && (!options?.onlyWhenHideLocalCluster || services.hideLocalCluster);
  const normalizedExplicitDataSourceId = shouldUseManagedDataSource
    ? String(explicitDataSourceId || '').trim()
    : '';
  const currentWorkspaceId = (services.core as any)?.workspaces?.currentWorkspaceId$?.getValue?.();
  const [fallbackDataSourceId, setFallbackDataSourceId] = useState('');
  const [isResolvingDataSourceId, setIsResolvingDataSourceId] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resolveFallbackDataSourceId = async () => {
      const shouldResolveFallback =
        shouldUseManagedDataSource &&
        !normalizedExplicitDataSourceId &&
        !!services.dataSourceManagement?.getDefaultDataSourceId;

      if (!shouldResolveFallback) {
        setFallbackDataSourceId('');
        setIsResolvingDataSourceId(false);
        return;
      }

      setIsResolvingDataSourceId(true);
      try {
        const uiSettingsScope = currentWorkspaceId
          ? UiSettingScope.WORKSPACE
          : UiSettingScope.GLOBAL;
        const defaultDataSourceId = await services.dataSourceManagement!.getDefaultDataSourceId(
          services.uiSettings,
          uiSettingsScope
        );
        if (!cancelled) {
          setFallbackDataSourceId(String(defaultDataSourceId || '').trim());
        }
      } catch {
        if (!cancelled) {
          setFallbackDataSourceId('');
        }
      } finally {
        if (!cancelled) {
          setIsResolvingDataSourceId(false);
        }
      }
    };

    resolveFallbackDataSourceId();

    return () => {
      cancelled = true;
    };
  }, [
    currentWorkspaceId,
    normalizedExplicitDataSourceId,
    services.dataSourceManagement,
    services.uiSettings,
    shouldUseManagedDataSource,
  ]);

  const dataSourceId = useMemo(() => normalizedExplicitDataSourceId || fallbackDataSourceId, [
    fallbackDataSourceId,
    normalizedExplicitDataSourceId,
  ]);

  return {
    dataSourceId,
    isResolvingDataSourceId,
  };
};
