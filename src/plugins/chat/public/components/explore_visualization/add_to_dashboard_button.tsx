/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiButtonEmpty } from '@elastic/eui';
import React, { useState } from 'react';
import { SimpleSavedObject } from 'src/core/public';
import { CoreStart } from 'opensearch-dashboards/public';
import uuid from 'uuid';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DashboardStart, DASHBOARD_CONTAINER_TYPE } from '../../../../dashboard/public';
import { setStateToOsdUrl } from '../../../../opensearch_dashboards_utils/public';
import { AddToDashboardModal } from './add_to_dashboard_modal';

interface DashboardAttributes {
  title?: string;
}
export type DashboardInterface = SimpleSavedObject<DashboardAttributes>;

export interface OnSaveProps {
  visualizationData: any;
  newTitle: string;
  isTitleDuplicateConfirmed: boolean;
  onTitleDuplicate: () => void;
  mode: 'existing' | 'new';
  selectDashboard: DashboardInterface | null;
  newDashboardName: string;
}

export const AddToDashboardButton = ({ visualizationData }: { visualizationData: any }) => {
  const { services } = useOpenSearchDashboards<{
    core: CoreStart;
    dashboard?: DashboardStart;
    embeddable?: any;
  }>();
  const { core, dashboard, embeddable } = services;
  const [showAddToDashboardModal, setShowAddToDashboardModal] = useState(false);

  // Get the current dashboard ID if we're on a dashboard page
  const currentDashboardId = React.useMemo(() => {
    const path = window.location.hash;
    const dashboardMatch = path.match(/^#\/view\/([^\/]+)/);
    return dashboardMatch ? dashboardMatch[1] : null;
  }, []);

  const handleSave = async (props: OnSaveProps) => {
    const {
      newTitle,
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
      mode,
      selectDashboard,
      newDashboardName,
    } = props;
    try {
      // Create a saved object for the visualization
      const savedObjectsClient = core.savedObjects?.client;

      if (!savedObjectsClient) {
        throw new Error('SavedObjects client is not available');
      }

      // Create a saved object with the visualization data
      const savedObject = await savedObjectsClient.create(
        'ai_vis',
        {
          title: newTitle,
          description: 'Created from chat visualization',
          visualizationType: 'timeseries',
          chartType: 'line',
          params: JSON.stringify({
            title: newTitle,
            chartType: 'line',
            styles: {},
            axesMapping: {},
          }),
          // Store the visualization data in a dedicated field
          visualizationData: JSON.stringify(visualizationData),
          version: 1,
        },
        {
          overwrite: isTitleDuplicateConfirmed,
        }
      );

      if (!savedObject || !savedObject.id) {
        throw new Error('Failed to create saved object');
      }

      // Add the saved object to the dashboard
      let dashboardId;
      const isAddingToCurrentDashboard =
        mode === 'existing' && selectDashboard?.id === currentDashboardId;

      try {
        if (mode === 'new') {
          // Create a new dashboard
          dashboardId = await addToDashboard(
            dashboard,
            { id: savedObject.id, type: 'ai_vis' },
            'new',
            {
              newDashboardName,
              createDashboardOptions: {
                isTitleDuplicateConfirmed,
                onTitleDuplicate,
              },
            }
          );
        } else {
          // Add to existing dashboard
          dashboardId = await addToDashboard(
            dashboard,
            { id: savedObject.id, type: 'ai_vis' },
            'existing',
            {
              existingDashboardId: selectDashboard!.id,
            }
          );

          // If we're adding to the current dashboard, reload the page to show the changes
          if (isAddingToCurrentDashboard) {
            // Show success toast first
            core.notifications?.toasts.add({
              title: i18n.translate('chat.addToDashboard.notification.success.title', {
                defaultMessage: 'Visualization added to dashboard',
              }),
              color: 'success',
              iconType: 'check',
              text: `Visualization "${newTitle}" was successfully added to the dashboard. Reloading page to show changes...`,
            });

            // Wait a moment for the toast to be visible
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Reload the page to show the changes
            window.location.reload();

            // Return early since we're reloading the page
            setShowAddToDashboardModal(false);
            return;
          }
        }
      } catch (error) {
        // Show error toast
        core.notifications?.toasts.add({
          title: i18n.translate('chat.addToDashboard.notification.error.title', {
            defaultMessage: 'Failed to add to dashboard',
          }),
          color: 'danger',
          iconType: 'alert',
          text: error instanceof Error ? error.message : 'Unknown error',
        });

        setShowAddToDashboardModal(false);
        return;
      }

      if (dashboardId) {
        // Show success toast
        core.notifications?.toasts.add({
          title: i18n.translate('chat.addToDashboard.notification.success.title', {
            defaultMessage: 'Visualization added to dashboard',
          }),
          color: 'success',
          iconType: 'check',
          text: `Visualization "${newTitle}" was successfully added to the dashboard.`,
        });

        setShowAddToDashboardModal(false);
      }
    } catch (error) {
      // Show error toast
      core.notifications?.toasts.add({
        title: i18n.translate('chat.addToDashboard.notification.error.title', {
          defaultMessage: 'Failed to add to dashboard',
        }),
        color: 'danger',
        iconType: 'alert',
        text: error instanceof Error ? error.message : 'Unknown error',
      });

      setShowAddToDashboardModal(false);
    }
  };

  return (
    <>
      <EuiButtonEmpty
        size="s"
        onClick={() => setShowAddToDashboardModal(true)}
        data-test-subj="chatAddToDashboardButton"
        iconType="dashboardApp"
      >
        {i18n.translate('chat.addToDashboardButton.name', {
          defaultMessage: 'Add to dashboard',
        })}
      </EuiButtonEmpty>
      {showAddToDashboardModal && (
        <AddToDashboardModal
          visualizationData={visualizationData}
          savedObjectsClient={core.savedObjects?.client}
          onCancel={() => setShowAddToDashboardModal(false)}
          onConfirm={handleSave}
        />
      )}
    </>
  );
};

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

// Helper function to add visualization to dashboard
async function addToDashboard(
  dashboardService: any,
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
) {
  const dashboardUrlGenerator = dashboardService.dashboardUrlGenerator;
  const loader = dashboardService.getSavedDashboardLoader();
  const version = '2.0.0'; // Default version
  const PANEL_WIDTH = 24;
  const PANEL_HEIGHT = 15;
  let panels: PanelConfig[] = [];

  let dashboard;

  try {
    if (mode === 'existing') {
      dashboard = await loader.get(options.existingDashboardId);
      panels = JSON.parse(dashboard.panelsJSON || '[]');
    } else {
      dashboard = await loader.createNew();
    }
  } catch (error) {
    throw new Error('Failed to get or create dashboard');
  }

  let x = 0;
  let y = 0;
  if (panels.length > 0) {
    // Get the last panel
    const lastPanel = panels[panels.length - 1];

    if (lastPanel.gridData.x + lastPanel.gridData.w + PANEL_WIDTH <= 48) {
      x = lastPanel.gridData.x + lastPanel.gridData.w;
      y = lastPanel.gridData.y; // Stay in same line
    } else {
      x = 0;
      y = lastPanel.gridData.y + lastPanel.gridData.h; // New line
    }
  }

  // Generate a unique panel ID
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

  if (mode === 'new') {
    dashboard.title = options.newDashboardName;
    dashboard.description = 'Dashboard created from chat visualization';

    // For new dashboards, create a URL with the panels state
    const state: any = {};
    const dashboardUrl = await dashboardUrlGenerator.createUrl(state);

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
  }

  return await dashboard.save(options.createDashboardOptions);
}
