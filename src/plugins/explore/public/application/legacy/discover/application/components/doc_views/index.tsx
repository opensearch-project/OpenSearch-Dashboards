/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { toMountPoint } from '../../../../../opensearch_dashboards_react/public';
import { docViewsRouter } from './doc_views_router';
import { getServices } from '../../../opensearch_dashboards_services';

export const renderDocView = (element: HTMLElement) => {
  const { history } = getServices();
  const unmount = toMountPoint(docViewsRouter(history()))(element);
  return unmount;
};
