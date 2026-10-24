/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';

/**
 * Reads an advanced setting. Returns `fallback` where the OpenSearch Dashboards services are
 * not provided (unit tests, components rendered standalone), so callers still render.
 *
 * The value is read on each render and is not subscribed to: like other advanced settings, a
 * change takes effect when the page is next loaded.
 */
export const useExploreUiSetting = <T>(key: string, fallback: T): T => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  return services?.uiSettings?.get<T>(key, fallback) ?? fallback;
};
