/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import { getServices } from '../../../services/services';
import { ContainerState, CONTAINER_URL_KEY, VARIABLE_VALUES_URL_KEY } from '../types';
import { Variable } from '../../../../../dashboard/public';
import {
  findReferencingDashboards,
  ReferencingDashboard,
} from '../../utils/find_referencing_dashboards';

export const useInitialContainerContext = () => {
  const services = getServices();
  const { osdUrlStateStorage, embeddable, scopedHistory, core, notifications } = services;
  const [context, setContext] = useState<ContainerState>({
    originatingApp: undefined,
    containerInfo: undefined,
  });
  const [containerVariables, setContainerVariables] = useState<Variable[] | undefined>(undefined);
  const [referencingDashboards, setReferencingDashboards] = useState<ReferencingDashboard[]>([]);
  const [needsDashboardSelection, setNeedsDashboardSelection] = useState(false);

  const loadDashboardVariables = useCallback(
    async (dashboardId: string, signal?: AbortSignal) => {
      try {
        const savedObject = await core.savedObjects.client.get<{
          variablesJSON?: string;
        }>('dashboard', dashboardId);

        // Check if operation was aborted
        if (signal?.aborted) return;

        if (savedObject.attributes.variablesJSON) {
          const parsed = JSON.parse(savedObject.attributes.variablesJSON);

          if (
            parsed &&
            typeof parsed === 'object' &&
            Array.isArray(parsed.variables) &&
            parsed.variables.length > 0
          ) {
            // Read variable values from URL
            const urlVariableValues = osdUrlStateStorage?.get<Record<string, string[]>>(
              VARIABLE_VALUES_URL_KEY
            );

            const variablesWithValues = parsed.variables.map((variable: Variable) => {
              // Validate URL variable values
              if (
                urlVariableValues &&
                Object.prototype.hasOwnProperty.call(urlVariableValues, variable.name)
              ) {
                const urlValue = urlVariableValues[variable.name];
                // Ensure URL value is a non-empty array of strings
                if (
                  Array.isArray(urlValue) &&
                  urlValue.length > 0 &&
                  urlValue.every((v) => typeof v === 'string')
                ) {
                  return {
                    ...variable,
                    current: urlValue,
                  };
                }
              }
              return variable;
            });

            // Check again before updating state
            if (!signal?.aborted) {
              setContainerVariables(variablesWithValues);
            }
          }
        }
      } catch (error) {
        // Don't show error if operation was aborted
        if (signal?.aborted) return;

        notifications.toasts.addError(error, {
          title: i18n.translate('explore.inContextEditor.loadDashboardVariables.errorToastTitle', {
            defaultMessage: 'Error loading dashboard variables',
          }),
        });
      }
    },
    [core.savedObjects.client, notifications.toasts, osdUrlStateStorage]
  );

  useEffect(() => {
    const incomingStates = embeddable.getStateTransfer(scopedHistory).getIncomingEditorState();
    const hasIncomingStates = incomingStates?.originatingApp || incomingStates?.containerInfo;
    const abortController = new AbortController();

    const init = async () => {
      if (hasIncomingStates) {
        // has incoming states from state transfer: use it and update URL
        const stateFromTransfer: ContainerState = {
          originatingApp: incomingStates.originatingApp,
          containerInfo: incomingStates.containerInfo,
        };

        if (osdUrlStateStorage) {
          osdUrlStateStorage.set<ContainerState>(CONTAINER_URL_KEY, stateFromTransfer, {
            replace: true,
          });
        }

        if (abortController.signal.aborted) return;
        setContext(stateFromTransfer);

        // Load dashboard variables if coming from a dashboard
        if (
          incomingStates.originatingApp === 'dashboards' &&
          incomingStates.containerInfo?.containerId
        ) {
          await loadDashboardVariables(
            incomingStates.containerInfo.containerId,
            abortController.signal
          );
        }
      } else {
        // No incoming states from state transfer: check URL state first
        const urlContainerState = osdUrlStateStorage?.get<ContainerState>(CONTAINER_URL_KEY);

        if (urlContainerState?.originatingApp === 'dashboards') {
          // Use URL state if available
          if (abortController.signal.aborted) return;
          setContext(urlContainerState);

          if (urlContainerState.containerInfo?.containerId) {
            await loadDashboardVariables(
              urlContainerState.containerInfo.containerId,
              abortController.signal
            );
          }
        } else {
          // No container context: check for dashboard references
          const currentPath = window.location.hash;
          const editMatch = currentPath.match(/\/edit\/([^/?]+)/);

          if (editMatch) {
            const visualizationId = editMatch[1];
            const dashboards = await findReferencingDashboards(
              core.savedObjects.client,
              visualizationId,
              notifications
            );

            if (abortController.signal.aborted) return;

            if (dashboards.length === 1) {
              // Auto-select single dashboard
              const dashboard = dashboards[0];
              const containerState: ContainerState = {
                originatingApp: 'dashboards',
                containerInfo: {
                  containerName: dashboard.title,
                  containerId: dashboard.id,
                },
              };

              if (osdUrlStateStorage) {
                osdUrlStateStorage.set<ContainerState>(CONTAINER_URL_KEY, containerState, {
                  replace: true,
                });
              }

              setContext(containerState);
              await loadDashboardVariables(dashboard.id, abortController.signal);
            } else if (dashboards.length > 1) {
              // Multiple dashboards: show selection modal
              setReferencingDashboards(dashboards);
              setNeedsDashboardSelection(true);
            }
          }
        }
      }
    };

    init();

    return () => {
      abortController.abort();
    };
  }, [
    core.savedObjects.client,
    embeddable,
    loadDashboardVariables,
    notifications,
    osdUrlStateStorage,
    scopedHistory,
  ]);

  const selectDashboard = async (dashboardId: string) => {
    const dashboard = referencingDashboards.find((d) => d.id === dashboardId);
    if (!dashboard) return;

    const containerState: ContainerState = {
      originatingApp: 'dashboards',
      containerInfo: {
        containerName: dashboard.title,
        containerId: dashboard.id,
      },
    };

    if (osdUrlStateStorage) {
      osdUrlStateStorage.set<ContainerState>(CONTAINER_URL_KEY, containerState, {
        replace: true,
      });
    }

    setContext(containerState);
    setNeedsDashboardSelection(false);

    await loadDashboardVariables(dashboardId);
  };

  const skipDashboardSelection = () => {
    setNeedsDashboardSelection(false);
  };

  return {
    context,
    containerVariables,
    referencingDashboards,
    needsDashboardSelection,
    selectDashboard,
    skipDashboardSelection,
  };
};
