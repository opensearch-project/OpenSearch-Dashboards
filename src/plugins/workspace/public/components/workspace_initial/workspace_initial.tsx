/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './workspace_initial.scss';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import {
  EuiLink,
  EuiPage,
  EuiIcon,
  EuiText,
  EuiTitle,
  EuiSpacer,
  EuiPopover,
  EuiPageBody,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSmallButton,
  EuiContextMenu,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { BehaviorSubject } from 'rxjs';
import { useObservable } from 'react-use';
import { ALL_USE_CASE_ID } from '../../../../../core/public';
import { WORKSPACE_CREATE_APP_ID, WORKSPACE_LIST_APP_ID } from '../../../common/constants';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceUseCase } from '../../types';
import { WorkspaceUseCaseCard } from './workspace_use_case_card';
import { WorkspaceUseCaseFlyout } from '../workspace_form';
import { navigateToWorkspacePageWithUseCase } from '../utils/workspace';

export interface WorkspaceInitialProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceInitial = ({ registeredUseCases$ }: WorkspaceInitialProps) => {
  const {
    services: { application, chrome, workspaces, http, docLinks },
  } = useOpenSearchDashboards<CoreStart>();
  const isDashboardAdmin = !!application.capabilities.dashboards?.isDashboardAdmin;
  const availableUseCases = registeredUseCases$
    .getValue()
    .filter((item) => !item.systematic || item.id === ALL_USE_CASE_ID);
  const workspaceList = workspaces.workspaceList$.getValue();
  const [isUseCaseFlyoutVisible, setIsUseCaseFlyoutVisible] = useState(false);
  const [defaultExpandedUseCaseId, setDefaultExpandedUseCaseId] = useState(availableUseCases[0].id);

  const handleClickUseCaseInformation = useCallback((useCaseId: string) => {
    setIsUseCaseFlyoutVisible(true);
    setDefaultExpandedUseCaseId(useCaseId);
  }, []);
  const handleFlyoutClose = useCallback(() => {
    setIsUseCaseFlyoutVisible(false);
  }, []);

  const useCaseCards = availableUseCases.map((useCase) => {
    return (
      <EuiFlexItem key={useCase.id}>
        <WorkspaceUseCaseCard
          useCase={useCase}
          workspaces={workspaceList}
          application={application}
          http={http}
          isDashboardAdmin={isDashboardAdmin}
          handleClickUseCaseInformation={handleClickUseCaseInformation}
        />
      </EuiFlexItem>
    );
  });
  const [isCreateWorkspacePopoverOpen, setIsCreateWorkspacePopoverOpen] = useState(false);
  const mountUserAccountRef = useRef<HTMLDivElement>(null);
  const mountSettingRef = useRef<HTMLDivElement>(null);
  const mountDevToolsRef = useRef<HTMLDivElement>(null);

  const leftBottom$Ref = useRef(chrome.navControls.getLeftBottom$());
  const leftBottomNavItems = useObservable(leftBottom$Ref.current);

  useEffect(() => {
    // TODO: We will refactor ChromeNavControl in the future and obtain mount through ID.
    const settingMount = leftBottomNavItems?.find((item) => item.order === 3)?.mount;
    const devToolsMount = leftBottomNavItems?.find((item) => item.order === 4)?.mount;
    const userAccountMount = leftBottomNavItems?.find((item) => item.order === 10000)?.mount;

    if (settingMount && mountSettingRef.current) {
      settingMount(mountSettingRef.current);
    }
    if (devToolsMount && mountDevToolsRef.current) {
      devToolsMount(mountDevToolsRef.current);
    }
    if (userAccountMount && mountUserAccountRef.current) {
      userAccountMount(mountUserAccountRef.current);
    }
  }, [chrome.navControls, leftBottomNavItems]);

  const createButton = (
    <EuiSmallButton
      fill
      iconType="plus"
      key={WORKSPACE_CREATE_APP_ID}
      data-test-subj="workspace-initial-card-createWorkspace-button"
      onClick={() => setIsCreateWorkspacePopoverOpen((isPopoverOpen) => !isPopoverOpen)}
    >
      {i18n.translate('workspace.initial.card.createWorkspace.button', {
        defaultMessage: 'Create Workspace',
      })}
      &nbsp;&nbsp;
      <EuiIcon type="arrowDown" />
    </EuiSmallButton>
  );

  const createWorkspacePopover = (
    <EuiPopover
      button={createButton}
      isOpen={isCreateWorkspacePopoverOpen}
      closePopover={() => setIsCreateWorkspacePopoverOpen(false)}
      panelPaddingSize="none"
    >
      <EuiContextMenu
        size="s"
        initialPanelId={0}
        panels={[
          {
            id: 0,
            width: 190,
            items: availableUseCases.map((useCase) => {
              return {
                'data-test-subj': `workspace-initial-button-create-${useCase.id}-workspace`,
                name: useCase.title,
                icon: useCase.icon,
                onClick: () => {
                  navigateToWorkspacePageWithUseCase(
                    application,
                    useCase.title,
                    WORKSPACE_CREATE_APP_ID
                  );
                },
              };
            }),
          },
        ]}
      />
    </EuiPopover>
  );

  const content = (
    <EuiFlexGroup direction="column" gutterSize="m">
      <EuiFlexItem grow={false}>
        <EuiTitle size="l">
          <h1>
            {i18n.translate('workspace.initial.title', {
              defaultMessage: 'Welcome to OpenSearch',
            })}
          </h1>
        </EuiTitle>
      </EuiFlexItem>
      <EuiSpacer size="l" />
      <EuiFlexItem grow={false}>
        <EuiFlexGroup
          direction="row"
          justifyContent="spaceBetween"
          alignItems="center"
          gutterSize="m"
        >
          <EuiFlexItem grow={false}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <EuiIcon type="wsSelector" size="m" />
              &nbsp;
              <EuiTitle size="m">
                <h2>
                  {i18n.translate('workspace.initial.workspace.title', {
                    defaultMessage: 'My workspaces',
                  })}
                </h2>
              </EuiTitle>
            </div>
            <EuiText size="s">
              {i18n.translate('workspace.initial.createWorkspace.describe', {
                defaultMessage:
                  'Collaborate on use-case based projects with workspaces. {hasWorkspace, select, true { Select a workspace to get started.} false {}}',
                values: { hasWorkspace: workspaceList.length > 0 },
              })}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>{isDashboardAdmin && createWorkspacePopover}</EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup justifyContent="spaceBetween" gutterSize="m" className="eui-xScroll">
          {useCaseCards}
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup justifyContent="spaceBetween" gutterSize="m">
          <EuiFlexItem grow={false}>
            <EuiText size="s" style={{ display: 'flex', alignItems: 'center' }}>
              <EuiIcon type="reporter" size="s" color="primary" />
              &nbsp;
              <EuiLink
                href={docLinks.links.opensearch.introduction}
                target="_blank"
                style={{ fontWeight: 'normal' }}
              >
                {i18n.translate('workspace.initial.link.documentation', {
                  defaultMessage: 'Learn more from documentation',
                })}
              </EuiLink>
              <EuiIcon
                type="dashboardApp"
                size="s"
                color="primary"
                style={{ marginLeft: '16px' }}
              />
              &nbsp;
              <EuiLink
                href="https://playground.opensearch.org/"
                target="_blank"
                style={{ fontWeight: 'normal' }}
              >
                {i18n.translate('workspace.initial.link.playground', {
                  defaultMessage: 'Explore live demo environment at playground.opensearch.org',
                })}
              </EuiLink>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="s">
              <EuiLink
                style={{ fontWeight: 'normal' }}
                onClick={() => {
                  application.navigateToApp(WORKSPACE_LIST_APP_ID);
                }}
              >
                {i18n.translate('workspace.initial.button.view', {
                  defaultMessage: 'View all workspaces',
                })}
              </EuiLink>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  return (
    <EuiPage style={{ minHeight: '100vh' }}>
      <EuiPageBody>
        <EuiIcon type="logoOpenSearch" size="xl" style={{ position: 'fixed' }} />
        <EuiSpacer size="xl" />
        <EuiSpacer size="l" />
        <EuiFlexGroup
          direction="column"
          alignItems="center"
          className="workspace-initial__flex-group-responsive"
        >
          <EuiFlexItem grow={false} style={{ maxWidth: '1264px', width: '100%' }}>
            {content}
          </EuiFlexItem>
        </EuiFlexGroup>

        <div className="workspace-initial__fixed-left-bottom-icon">
          <div ref={mountSettingRef} />
          <EuiSpacer size="s" />
          <div ref={mountDevToolsRef} />
          <EuiSpacer size="s" />
          <div ref={mountUserAccountRef} />
        </div>
      </EuiPageBody>
      {isUseCaseFlyoutVisible && (
        <WorkspaceUseCaseFlyout
          availableUseCases={availableUseCases}
          onClose={handleFlyoutClose}
          defaultExpandUseCase={defaultExpandedUseCaseId}
        />
      )}
    </EuiPage>
  );
};
