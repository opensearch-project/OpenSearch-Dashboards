/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { i18n } from '@osd/i18n';
import { VariablesBar } from './variables_bar';
import { VariableEditorFlyout } from './variable_editor_flyout';
import { VariableManagementFlyout } from './variable_management_flyout';
import { Variable } from '../../../variables/types';
import { VariableService } from '../../../variables/variable_service';
import { IVariableInterpolationService } from '../../../variables/variable_interpolation_service';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DashboardServices } from '../../../types';

export interface DashboardVariablesProps {
  variableService: VariableService;
  interpolationService?: IVariableInterpolationService;
  isEditMode: boolean;
  getPanelQueries?: () => string[];
  dashboardId?: string;
  onSaveDashboard?: () => void;
}

/**
 * DashboardVariables - Encapsulates all variable-related UI components
 * including the variables bar, editor flyout, and management flyout.
 */
export const DashboardVariables: React.FC<DashboardVariablesProps> = ({
  variableService,
  interpolationService,
  isEditMode,
  getPanelQueries,
  dashboardId,
  onSaveDashboard,
}) => {
  const { services } = useOpenSearchDashboards<DashboardServices>();
  const { notifications } = services;
  const [isVariableEditorOpen, setIsVariableEditorOpen] = useState(false);
  const [isVariableManagementOpen, setIsVariableManagementOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<Variable | undefined>(undefined);

  const handleAddVariable = useCallback(() => {
    // Check if dashboard is saved before adding variable
    if (!dashboardId) {
      notifications.toasts.addWarning({
        title: i18n.translate('dashboard.variableEditor.saveDashboardFirst.title', {
          defaultMessage: 'Save dashboard first',
        }),
        text: i18n.translate('dashboard.variableEditor.saveDashboardFirst.text', {
          defaultMessage: 'Please save the dashboard before adding variables.',
        }),
      });

      // Trigger dashboard save
      if (onSaveDashboard) {
        onSaveDashboard();
      }
      return;
    }

    setEditingVariable(undefined);
    setIsVariableManagementOpen(false);
    setIsVariableEditorOpen(true);
  }, [dashboardId, notifications.toasts, onSaveDashboard]);

  const handleManageVariables = useCallback(() => {
    setIsVariableEditorOpen(false);
    setEditingVariable(undefined);
    setIsVariableManagementOpen(true);
  }, []);

  const handleCloseVariableEditor = useCallback(() => {
    setIsVariableEditorOpen(false);
    setEditingVariable(undefined);
  }, []);

  const handleEditVariable = useCallback((variable: Variable) => {
    setIsVariableManagementOpen(false);
    setEditingVariable(variable);
    setIsVariableEditorOpen(true);
  }, []);

  const handleSaveVariable = useCallback(
    async (variableConfig: any) => {
      const isUpdate = !!editingVariable;
      try {
        if (isUpdate) {
          await variableService.updateVariable(editingVariable.id, variableConfig);
        } else {
          await variableService.addVariable(variableConfig);
        }
        handleCloseVariableEditor();
        notifications.toasts.addSuccess({
          title: isUpdate
            ? i18n.translate('dashboard.variableEditor.update.success', {
                defaultMessage: 'Variable updated',
              })
            : i18n.translate('dashboard.variableEditor.add.success', {
                defaultMessage: 'Variable added',
              }),
        });
      } catch (error) {
        notifications.toasts.addDanger({
          title: i18n.translate('dashboard.variableEditor.save.error', {
            defaultMessage: 'Failed to save variable',
          }),
          text: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [editingVariable, handleCloseVariableEditor, variableService, notifications.toasts]
  );

  const handleCloseVariableManagement = useCallback(() => {
    setIsVariableManagementOpen(false);
  }, []);

  // Close editor/management panels when switching from edit to view mode
  useEffect(() => {
    if (!isEditMode) {
      setIsVariableEditorOpen(false);
      setIsVariableManagementOpen(false);
      setEditingVariable(undefined);
    }
  }, [isEditMode]);

  return (
    <>
      <VariablesBar
        variableService={variableService}
        isEditMode={isEditMode}
        onAddVariable={handleAddVariable}
        onManageVariables={handleManageVariables}
      />

      {isVariableManagementOpen &&
        (() => {
          const panelContainer = document.getElementById('variablePanelContent');
          if (!panelContainer) return null;
          return ReactDOM.createPortal(
            <VariableManagementFlyout
              variableService={variableService}
              onClose={handleCloseVariableManagement}
              onAddVariable={handleAddVariable}
              onEditVariable={handleEditVariable}
              panelQueries={getPanelQueries?.() ?? []}
            />,
            panelContainer
          );
        })()}

      {isVariableEditorOpen &&
        (() => {
          const panelContainer = document.getElementById('variablePanelContent');
          if (!panelContainer) return null;
          return ReactDOM.createPortal(
            <VariableEditorFlyout
              onClose={handleCloseVariableEditor}
              onSave={handleSaveVariable}
              existingVariable={editingVariable}
              existingVariableNames={variableService.getVariables().map((v) => v.name)}
              interpolationService={interpolationService}
            />,
            panelContainer
          );
        })()}
    </>
  );
};
