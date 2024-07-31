/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiPage,
  EuiFlexItem,
  EuiPageBody,
  EuiFlexGroup,
  EuiPageHeader,
  EuiSmallButton,
  EuiConfirmModal,
  EuiTabbedContent,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import { BehaviorSubject, of } from 'rxjs';
import { WorkspaceUseCase } from '../../types';
import { WorkspaceUpdater } from './workspace_updater';
import { WorkspaceDetailPanel } from './workspace_detail_panel';
import { DeleteWorkspaceModal } from '../delete_workspace_modal';
import { WORKSPACE_LIST_APP_ID } from '../../../common/constants';
import { cleanWorkspaceId } from '../../../../../core/public/utils';
import { DetailTab, DetailTabTitles } from '../workspace_form/constants';
import { CoreStart, WorkspaceAttribute } from '../../../../../core/public';
import { getFirstUseCaseOfFeatureConfigs, getUseCaseUrl } from '../../utils';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataSourceManagementPluginSetup } from '../../../../../plugins/data_source_management/public';

const workspaceDelete = i18n.translate('workspace.detail.delete', {
  defaultMessage: 'delete',
});

export interface WorkspaceDetailProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceDetail = (props: WorkspaceDetailProps) => {
  const {
    services: { workspaces, application, http, dataSourceManagement },
  } = useOpenSearchDashboards<{
    CoreStart: CoreStart;
    dataSourceManagement?: DataSourceManagementPluginSetup;
  }>();

  const [deletedWorkspace, setDeletedWorkspace] = useState<WorkspaceAttribute | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<string>(DetailTab.Details);
  const [numberOfChanges, setNumberOfChanges] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [tabId, setTabId] = useState<string>(DetailTab.Details);
  const [resetFunction, setResetFunction] = useState(() => () => {});

  const availableUseCases = useObservable(props.registeredUseCases$, []);
  const isDashboardAdmin = application?.capabilities?.dashboards?.isDashboardAdmin;
  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));
  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;
  const currentUseCase = availableUseCases.find(
    (useCase) => useCase.id === getFirstUseCaseOfFeatureConfigs(currentWorkspace?.features ?? [])
  );

  if (!currentWorkspace || !application || !http) {
    return null;
  }

  const useCaseUrl = getUseCaseUrl(currentUseCase, currentWorkspace, application, http);

  const getResetFunction = (func: any) => {
    setResetFunction(() => func);
  };

  const getNumberOfChanges = (data: number) => {
    setNumberOfChanges(data);
  };

  const handleTabClick = (tab: any) => {
    if (numberOfChanges > 0) {
      setTabId(tab.id);
      setModalVisible(true);
      return;
    }
    setSelectedTabId(tab.id);
  };

  const handleBadgeClick = () => {
    if (selectedTabId !== DetailTab.TeamMembers && numberOfChanges > 0) {
      setTabId(DetailTab.TeamMembers);
      setModalVisible(true);
      return;
    }
    setSelectedTabId(DetailTab.TeamMembers);
  };

  const pageTitle = (
    <EuiFlexGroup gutterSize="none" alignItems="baseline" justifyContent="flexStart">
      <EuiFlexItem grow={false}>{currentWorkspace?.name}</EuiFlexItem>
    </EuiFlexGroup>
  );

  const detailTabs = [
    {
      id: DetailTab.Details,
      name: DetailTabTitles.details,
      content: (
        <WorkspaceUpdater
          detailTab={DetailTab.Details}
          registeredUseCases$={props.registeredUseCases$}
          detailTitle={DetailTabTitles.details}
          getNumberOfChanges={getNumberOfChanges}
          getResetFunction={getResetFunction}
        />
      ),
    },
    ...(isDashboardAdmin && dataSourceManagement
      ? [
          {
            id: DetailTab.DataSources,
            name: DetailTabTitles.dataSources,
            content: (
              <WorkspaceUpdater
                detailTab={DetailTab.DataSources}
                registeredUseCases$={props.registeredUseCases$}
                detailTitle={DetailTabTitles.dataSources}
                getNumberOfChanges={getNumberOfChanges}
                getResetFunction={getResetFunction}
              />
            ),
          },
        ]
      : []),
    ...(isPermissionEnabled
      ? [
          {
            id: DetailTab.TeamMembers,
            name: DetailTabTitles.teamMembers,
            content: (
              <WorkspaceUpdater
                detailTab={DetailTab.TeamMembers}
                registeredUseCases$={props.registeredUseCases$}
                detailTitle={DetailTabTitles.teamMembers}
                getNumberOfChanges={getNumberOfChanges}
                getResetFunction={getResetFunction}
              />
            ),
          },
        ]
      : []),
  ];

  const button = (
    <EuiSmallButton
      color="danger"
      iconType="trash"
      onClick={() => setDeletedWorkspace(currentWorkspace)}
    >
      {workspaceDelete}
    </EuiSmallButton>
  );

  return (
    <>
      <EuiPage paddingSize="l">
        <EuiPageHeader pageTitle={pageTitle} rightSideItems={[button]} alignItems="center" />
      </EuiPage>
      <EuiPage paddingSize="l">
        <WorkspaceDetailPanel
          useCaseUrl={useCaseUrl}
          handleBadgeClick={handleBadgeClick}
          currentUseCase={currentUseCase}
          currentWorkspace={currentWorkspace}
        />
      </EuiPage>

      <EuiPage paddingSize="l">
        <EuiPageBody>
          <EuiTabbedContent
            data-test-subj="workspaceTabs"
            tabs={detailTabs}
            // initialSelectedTab={detailTabs[0]}
            selectedTab={detailTabs[detailTabs.findIndex((tab) => tab.id === selectedTabId)]}
            // autoFocus="selected"
            onTabClick={handleTabClick}
          />
        </EuiPageBody>
      </EuiPage>
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
            defaultMessage: 'Navigate away',
          })}
          onCancel={() => setModalVisible(false)}
          onConfirm={() => {
            resetFunction();
            setModalVisible(false);
            setSelectedTabId(tabId);
          }}
          cancelButtonText={i18n.translate('workspace.form.cancelButtonText', {
            defaultMessage: 'Cancel',
          })}
          confirmButtonText={i18n.translate('workspace.form.confirmButtonText', {
            defaultMessage: 'navigate away',
          })}
          buttonColor="danger"
          defaultFocusedButton="confirm"
        >
          {i18n.translate('workspace.form.cancelModal.body', {
            defaultMessage: 'Any unsaved changes will be lost.',
          })}
        </EuiConfirmModal>
      )}
    </>
  );
};
