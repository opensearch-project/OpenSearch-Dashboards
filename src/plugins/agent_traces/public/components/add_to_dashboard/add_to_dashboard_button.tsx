/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiText, EuiLink, EuiButtonEmpty } from '@elastic/eui';
import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { SimpleSavedObject } from 'src/core/public';
import { useObservable } from 'react-use';
import {
  toMountPoint,
  useOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';
import { SavedAgentTraces } from '../../types/saved_agent_traces_types';
import { AddToDashboardModal } from './add_to_dashboard_modal';
import { selectUIState } from '../../application/utils/state_management/selectors';
import {
  DataView as Dataset,
  IndexPattern,
  useSyncQueryStateWithUrl,
} from '../../../../data/public';
import { saveStateToSavedObject } from '../../saved_agent_traces/transforms';
import { addToDashboard } from './add_to_dashboard';
import { saveSavedAgentTraces } from '../../helpers/save_agent_traces';
import { useCurrentAgentTracesId } from '../../application/utils/hooks/use_current_agent_traces_id';
import { AgentTracesFlavor } from '../../../common';
import { AgentTracesServices } from '../../types';
import { getVisualizationBuilder } from '../visualizations/visualization_builder_singleton';
import { ExecutionContextSearch } from '../../../../expressions/common';
import { getServices } from '../../services/services';

interface DashboardAttributes {
  title?: string;
}
export type DashboardInterface = SimpleSavedObject<DashboardAttributes>;

export interface OnSaveProps {
  savedAgentTraces: SavedAgentTraces;
  newTitle: string;
  isTitleDuplicateConfirmed: boolean;
  onTitleDuplicate: () => void;
  mode: 'existing' | 'new';
  selectDashboard: DashboardInterface | null;
  newDashboardName: string;
}

export const SaveAndAddButtonWithModal = ({ dataset }: { dataset?: IndexPattern | Dataset }) => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const { core, savedObjects, toastNotifications, data, keyboardShortcut } = services;
  const visualizationBuilder = getVisualizationBuilder();
  const chartConfig = useObservable(visualizationBuilder.visConfig$);

  const handleAddToDashboard = useCallback(() => {
    setShowAddToDashboardModal(true);
  }, []);

  keyboardShortcut?.useKeyboardShortcut({
    id: 'addToDashboard',
    pluginId: 'agentTraces',
    name: i18n.translate('agentTraces.addToDashboard.addToDashboardShortcut', {
      defaultMessage: 'Add to dashboard',
    }),
    category: i18n.translate('agentTraces.addToDashboard.dataActionsCategory', {
      defaultMessage: 'Data actions',
    }),
    keys: 'a',
    execute: handleAddToDashboard,
  });

  // Use the shared osdUrlStateStorage instance from services to avoid
  // multiple instances competing to update the same URL.
  const { startSyncingQueryStateWithUrl } = useSyncQueryStateWithUrl(
    data.query,
    services.osdUrlStateStorage!
  );

  const [showAddToDashboardModal, setShowAddToDashboardModal] = useState(false);

  const uiState = useSelector(selectUIState);
  const tabDefinition = services.tabRegistry?.getTab?.(uiState.activeTabId);

  const savedAgentTracesIdFromUrl = useCurrentAgentTracesId();
  const flavorId = AgentTracesFlavor.Traces;

  const saveObjectsClient = savedObjects.client;

  const searchContext: ExecutionContextSearch = {
    query: data.query.queryString.getQuery(),
    filters: data.query.filterManager.getFilters(),
    timeRange: data.query.timefilter.timefilter.getTime(),
  };

  const handleSave = async ({
    savedAgentTraces,
    newTitle,
    isTitleDuplicateConfirmed,
    onTitleDuplicate,
    mode,
    selectDashboard,
    newDashboardName,
  }: OnSaveProps) => {
    const savedAgentTracesWithState = saveStateToSavedObject(
      savedAgentTraces,
      flavorId,
      tabDefinition!,
      {
        chartType: chartConfig?.type,
        axesMapping: chartConfig?.axesMapping,
        styleOptions: (chartConfig?.styles as unknown) as Record<string, unknown> | undefined,
      },
      dataset
    );

    const saveOptions = {
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
    };
    try {
      // by passing newCopyOnSave as true, to ensure every time add to dashboard will create a new agent traces
      const result = await saveSavedAgentTraces({
        savedAgentTraces: savedAgentTracesWithState,
        newTitle,
        saveOptions,
        searchContext,
        services,
        startSyncingQueryStateWithUrl,
        openAfterSave: false,
        newCopyOnSave: true,
      });

      let dashboardId;

      if (result && 'id' in result && result?.id) {
        const id = result?.id;
        let props;
        if (mode === 'new') {
          props = {
            newDashboardName,
            createDashboardOptions: saveOptions,
          };
        } else {
          props = {
            existingDashboardId: selectDashboard!.id,
          };
        }
        dashboardId = await addToDashboard(
          getServices().dashboard,
          { id, type: 'agentTraces' },
          mode,
          props
        );
      }

      if (dashboardId) {
        const url = core.application.getUrlForApp('dashboards', {
          path: `#/view/${dashboardId}`,
        });

        const toastContent = (
          <div>
            {url ? (
              <EuiText size="s">
                <p>
                  {i18n.translate('agentTraces.addToDashboard.notification.success.message', {
                    defaultMessage: `Agent traces '{newTitle}' is successfully added to the dashboard.`,
                    values: { newTitle },
                  })}
                  &nbsp;
                  <EuiLink href={url} target="_blank">
                    {i18n.translate(
                      'agentTraces.addToDashboard.notification.success.viewDashboardLink',
                      {
                        defaultMessage: 'View Dashboard',
                      }
                    )}
                  </EuiLink>
                </p>
              </EuiText>
            ) : (
              <EuiText size="s" color="danger">
                {i18n.translate('agentTraces.addToDashboard.notification.failure.message', {
                  defaultMessage: 'Dashboard creation failed.',
                })}
              </EuiText>
            )}
          </div>
        );

        if (mode === 'new') {
          toastNotifications.add({
            title: i18n.translate('agentTraces.addToDashboard.notification.success.new', {
              defaultMessage: 'Dashboard Generation',
            }),
            color: 'success',
            iconType: 'check',
            text: toMountPoint(toastContent),
            'data-test-subj': 'agentTracesAddToNewDashboardSuccessToast',
          });
        } else {
          toastNotifications.add({
            title: i18n.translate('agentTraces.addToDashboard.notification.success.existing', {
              defaultMessage: 'Panel added to dashboard',
            }),
            color: 'success',
            iconType: 'check',
            text: toMountPoint(toastContent),
            'data-test-subj': 'agentTracesAddToExistingDashboardSuccessToast',
          });
        }

        setShowAddToDashboardModal(false);
      }
    } catch (error) {
      toastNotifications.addDanger({
        title: i18n.translate('agentTraces.addToDashboard.notification.fail', {
          defaultMessage: 'Fail to add to dashboard',
        }),
        text: (error as Error).message || String(error),
        'data-test-subj': 'agentTracesAddToDashboardFailToast',
      });

      setShowAddToDashboardModal(false);
    }
  };

  return (
    <>
      <EuiButtonEmpty
        size="s"
        onClick={() => setShowAddToDashboardModal(true)}
        data-test-subj="agentTracesAddToDashboardButton"
      >
        {i18n.translate('agentTraces.addtoDashboardButton.name', {
          defaultMessage: 'Add to dashboard',
        })}
      </EuiButtonEmpty>
      {showAddToDashboardModal && (
        <AddToDashboardModal
          savedAgentTracesId={savedAgentTracesIdFromUrl}
          savedObjectsClient={saveObjectsClient}
          onCancel={() => setShowAddToDashboardModal(false)}
          onConfirm={handleSave}
        />
      )}
    </>
  );
};
