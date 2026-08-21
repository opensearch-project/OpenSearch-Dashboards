/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ViewMode } from '../../../../embeddable/public';
import { DashboardAppState } from '../../types';

export const dashboardAppStateStub: DashboardAppState = {
  panels: [],
  fullScreenMode: false,
  title: 'Dashboard Test Title',
  description: 'Dashboard Test Description',
  timeRestore: true,
  options: {
    hidePanelTitles: false,
    useMargins: true,
  },
  query: { query: '', language: 'kuery' },
  filters: [],
  viewMode: ViewMode.EDIT,
};
