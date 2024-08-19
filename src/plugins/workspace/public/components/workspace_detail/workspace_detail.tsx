/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  EuiPage,
  EuiText,
  EuiSpacer,
  EuiFlexItem,
  EuiPageBody,
  EuiFlexGroup,
  EuiPageHeader,
  EuiPageContent,
  EuiSmallButton,
  EuiConfirmModal,
  EuiTabbedContent,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import { BehaviorSubject, of } from 'rxjs';
import { useHistory, useLocation } from 'react-router-dom';
import { WorkspaceUseCase } from '../../types';
import { WorkspaceDetailForm, useWorkspaceFormContext } from '../workspace_form';
import { WorkspaceDetailPanel } from './workspace_detail_panel';
import { DeleteWorkspaceModal } from '../delete_workspace_modal';
import { WORKSPACE_LIST_APP_ID } from '../../../common/constants';
import { cleanWorkspaceId } from '../../../../../core/public/utils';
import { DetailTab, DetailTabTitles, WorkspaceOperationType } from '../workspace_form/constants';
import { CoreStart, WorkspaceAttribute } from '../../../../../core/public';
import { getFirstUseCaseOfFeatureConfigs, getUseCaseUrl } from '../../utils';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataSourceManagementPluginSetup } from '../../../../../plugins/data_source_management/public';
import { SelectDataSourceDetailPanel } from './select_data_source_panel';
import { WorkspaceBottomBar } from './workspace_bottom_bar';

export interface WorkspaceDetailProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceDetail = (props: WorkspaceDetailProps) => {
  const {
    services: { workspaces, application, http, savedObjects, dataSourceManagement, uiSettings },
  } = useOpenSearchDashboards<{
    CoreStart: CoreStart;
    dataSourceManagement?: DataSourceManagementPluginSetup;
  }>();

  const {
    formData,
    isEditing,
    formId,
    numberOfErrors,
    handleResetForm,
    numberOfChanges,
    setIsEditing,
  } = useWorkspaceFormContext();
  const [deletedWorkspace, setDeletedWorkspace] = useState<WorkspaceAttribute | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<string>(DetailTab.Details);
  const [modalVisible, setModalVisible] = useState(false);
  const [tabId, setTabId] = useState<string>(DetailTab.Details);

  const availableUseCases = useObservable(props.registeredUseCases$, []);
  const isDashboardAdmin = !!application?.capabilities?.dashboards?.isDashboardAdmin;
  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));
  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;
  const currentUseCase = availableUseCases.find(
    (useCase) => useCase.id === getFirstUseCaseOfFeatureConfigs(currentWorkspace?.features ?? [])
  );
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setSelectedTabId(tab);
    }
  }, [location.search]);

  if (!currentWorkspace || !application || !http || !savedObjects || !uiSettings) {
    return null;
  }

  const useCaseUrl = getUseCaseUrl(currentUseCase, currentWorkspace, application, http);

  const handleTabClick = (tab: any) => {
    if (numberOfChanges > 0) {
      setTabId(tab.id);
      setModalVisible(true);
      return;
    }
    history.push(`?tab=${tab.id}`);
    setIsEditing(false);
    setSelectedTabId(tab.id);
  };

  const handleBadgeClick = () => {
    if (selectedTabId !== DetailTab.Collaborators && numberOfChanges > 0) {
      setTabId(DetailTab.Collaborators);
      setModalVisible(true);
      return;
    }
    history.push(`?tab=${DetailTab.Collaborators}`);
    setSelectedTabId(DetailTab.Collaborators);
  };

  const createDetailTab = (id: DetailTab, detailTitle: string) => ({
    id,
    name: detailTitle,
    content: (
      <WorkspaceDetailForm
        application={application}
        operationType={WorkspaceOperationType.Update}
        savedObjects={savedObjects}
        detailTab={id}
        dataSourceManagement={dataSourceManagement}
        availableUseCases={availableUseCases}
        detailTitle={detailTitle}
      />
    ),
  });

  const detailTabs = [
    createDetailTab(DetailTab.Details, DetailTabTitles.details),
    ...(dataSourceManagement
      ? [
          {
            id: DetailTab.DataSources,
            name: DetailTabTitles.dataSources,
            content: (
              <SelectDataSourceDetailPanel
                savedObjects={savedObjects}
                assignedDataSources={formData.selectedDataSources}
                detailTitle={DetailTabTitles.dataSources}
                isDashboardAdmin={isDashboardAdmin}
                currentWorkspace={currentWorkspace}
              />
            ),
          },
        ]
      : []),
    ...(isPermissionEnabled
      ? [createDetailTab(DetailTab.Collaborators, DetailTabTitles.collaborators)]
      : []),
  ];

  const deleteButton = (
    <EuiSmallButton
      color="danger"
      iconType="trash"
      onClick={() => setDeletedWorkspace(currentWorkspace)}
    >
      {i18n.translate('workspace.detail.delete', {
        defaultMessage: 'delete',
      })}
    </EuiSmallButton>
  );

  return (
    <>
      <EuiPage direction="column">
        <EuiPageHeader rightSideItems={[deleteButton]} alignItems="center" />
        <EuiPageBody>
          <EuiText color="subdued">{currentWorkspace.description}</EuiText>
        </EuiPageBody>
        <EuiSpacer />
        <EuiPageContent>
          <WorkspaceDetailPanel
            useCaseUrl={useCaseUrl}
            handleBadgeClick={handleBadgeClick}
            currentUseCase={currentUseCase}
            currentWorkspace={currentWorkspace}
            dateFormat={uiSettings.get('dateFormat')}
          />
        </EuiPageContent>
        <EuiSpacer />
        <EuiPageBody>
          <EuiTabbedContent
            data-test-subj="workspaceTabs"
            tabs={detailTabs}
            selectedTab={detailTabs[detailTabs.findIndex((tab) => tab.id === selectedTabId)]}
            onTabClick={handleTabClick}
            size="s"
          />
        </EuiPageBody>
        {deletedWorkspace && (
          <DeleteWorkspaceModal
            selectedWorkspace={deletedWorkspace}
            onClose={() => setDeletedWorkspace(null)}
            onDeleteSuccess={() => {
              window.setTimeout(() => {
                window.location.assign(
                  cleanWorkspaceId(
                    application.getUrlForApp(WORKSPACE_LIST_APP_ID, {
                      absolute: false,
                    })
                  )
                );
              }, 1000);
            }}
          />
        )}
        {modalVisible && (
          <EuiConfirmModal
            data-test-subj="workspaceForm-cancelModal"
            title={i18n.translate('workspace.form.cancelModal.title', {
              defaultMessage: 'Navigate away?',
            })}
            onCancel={() => setModalVisible(false)}
            onConfirm={() => {
              handleResetForm();
              setModalVisible(false);
              history.push(`?tab=${tabId}`);
              setSelectedTabId(tabId);
            }}
            cancelButtonText={i18n.translate('workspace.form.cancelButtonText', {
              defaultMessage: 'Cancel',
            })}
            confirmButtonText={i18n.translate('workspace.form.confirmButtonText', {
              defaultMessage: 'Navigate away',
            })}
            buttonColor="danger"
            defaultFocusedButton="confirm"
          >
            {i18n.translate('workspace.form.cancelModal.body', {
              defaultMessage: 'Any unsaved changes will be lost.',
            })}
          </EuiConfirmModal>
        )}
      </EuiPage>
      {isEditing && (
        <WorkspaceBottomBar
          formId={formId}
          numberOfChanges={numberOfChanges}
          numberOfErrors={numberOfErrors}
          handleResetForm={handleResetForm}
        />
      )}
    </>
  );
};
