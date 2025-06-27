/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import uuid from 'uuid';
import { DashboardStart } from 'src/plugins/dashboard/public';
import { getDashboardVersion } from '../../../application/legacy/discover/opensearch_dashboards_services';
import { DashboardUrlGeneratorState } from '../../../../../dashboard/public';
import { setStateToOsdUrl } from '../../../../../opensearch_dashboards_utils/public';

interface PanelConfig {
  id: string;
  version: string;
  type: string;
  panelIndex: string;
  gridData: {
    x: number;
    y: number;
    w: number;
    h: number;
    i: string;
  };
}

export const addToDashboard = async (
  dashboardService: DashboardStart,
  obj: { id: string; type: string },
  mode: 'new' | 'existing',
  options: {
    newDashboardName?: string;
    createDashboardOptions?: {
      isTitleDuplicateConfirmed: boolean;
      onTitleDuplicate: () => void;
    };
    existingDashboardId?: string;
  }
) => {
  const dashboardUrlGenerator = dashboardService.dashboardUrlGenerator;
  const loader = dashboardService.getSavedDashboardLoader();
  const { version } = getDashboardVersion();
  const PANEL_WIDTH = 24;
  const PANEL_HEIGHT = 15;
  let panels: PanelConfig[] = [];

  let dashboard;

  try {
    dashboard = await loader.get(options.existingDashboardId);
    panels = JSON.parse(dashboard.panelsJSON || '[]');
  } catch (error) {
    throw new Error('Fail to get dashboard');
  }

  let x = 0;
  let y = 0;
  if (panels.length > 0) {
    // get the last panel
    const lastPanel = panels[panels.length - 1];

    if (lastPanel.gridData.x + lastPanel.gridData.w + PANEL_WIDTH <= 48) {
      x = lastPanel.gridData.x + lastPanel.gridData.w;
      y = lastPanel.gridData.y; // stay in same line
    } else {
      x = 0;
      y = lastPanel.gridData.y + lastPanel.gridData.h; // new line
    }
  }

  const panelIndex = uuid.v4();
  panels.push({
    version,
    id: obj.id,
    type: obj.type,
    panelIndex,
    gridData: {
      i: panelIndex,
      x,
      y,
      w: PANEL_WIDTH,
      h: PANEL_HEIGHT,
    },
  });

  dashboard.panelsJSON = JSON.stringify(panels);

  let dashboardUrl;
  if (mode === 'new') {
    dashboard.title = options.newDashboardName;
    dashboard.description = 'The dashboard was created from explore';
    const state: DashboardUrlGeneratorState = {};
    dashboardUrl = await dashboardUrlGenerator?.createUrl(state);
    if (!dashboardUrl) {
      throw new Error('Failed to generate dashboard URL');
    }

    const appState = {
      panels: panels.map((panel) => ({
        embeddableConfig: {},
        gridData: {
          h: panel.gridData.h,
          i: panel.gridData.i,
          w: panel.gridData.w,
          x: panel.gridData.x,
          y: panel.gridData.y,
        },
        id: panel.id,
        panelIndex: panel.panelIndex,
        type: panel.type,
        version: panel.version,
      })),
    };

    const finalUrl = setStateToOsdUrl('_a', appState, { useHash: true }, dashboardUrl);
    dashboard.url = finalUrl;
    return await dashboard.save(options.createDashboardOptions);
  } else {
    return await dashboard.save();
  }
};
