/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './workspace_use_case_card.scss';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChromeNavControl, CoreStart } from 'opensearch-dashboards/public';
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
import { WORKSPACE_CREATE_APP_ID } from '../../../common/constants';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceUseCase } from '../../types';
import { WorkspaceUseCaseCard } from './workspace_use_case_card';
import { WorkspaceUseCaseFlyout } from '../workspace_form';

export interface WorkspaceInitialProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceInitial = ({ registeredUseCases$ }: WorkspaceInitialProps) => {
  const {
    services: { application, chrome, workspaces, http },
  } = useOpenSearchDashboards<CoreStart>();
  const isDashboardAdmin = !!application.capabilities.dashboards?.isDashboardAdmin;
  const availableUseCases = registeredUseCases$
    .getValue()
    .filter((item) => !item.systematic || item.id === 'all');
  const workspaceList = workspaces.workspaceList$.getValue();
  const [isUseCaseFlyoutVisible, setIsUseCaseFlyoutVisible] = useState(false);
  const [defaultUseCaseId, setDefaultUseCaseId] = useState(availableUseCases[0].id);

  const handleClickUseCaseInformation = useCallback((useCaseId: string) => {
    setIsUseCaseFlyoutVisible(true);
    setDefaultUseCaseId(useCaseId);
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

  const mountUserAccountRef = useRef<HTMLDivElement>(null);
  const mountSettingRef = useRef<HTMLDivElement>(null);
  const mountDevToolsRef = useRef<HTMLDivElement>(null);

  const [isCreateWorkspacePopoverOpen, setIsCreateWorkspacePopoverOpen] = useState(false);
  const [userAccountMount, setUserAccountMount] = useState<ChromeNavControl | undefined>(undefined);
  const [settingMount, setSettingMount] = useState<ChromeNavControl | undefined>(undefined);
  const [devToolsMount, setDevToolsMount] = useState<ChromeNavControl | undefined>(undefined);

  useEffect(() => {
    const subscription = chrome.navControls.getLeftBottom$().subscribe((items) => {
      setSettingMount(items.at(2));
      setDevToolsMount(items.at(3));
      setUserAccountMount(items.at(-1));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [chrome.navControls]);

  useEffect(() => {
    if (
      userAccountMount?.mount &&
      settingMount?.mount &&
      devToolsMount?.mount &&
      mountUserAccountRef.current &&
      mountSettingRef.current &&
      mountDevToolsRef.current
    ) {
      userAccountMount.mount(mountUserAccountRef.current);
      devToolsMount.mount(mountDevToolsRef.current);
      settingMount.mount(mountSettingRef.current);
    }
  }, [devToolsMount, settingMount, userAccountMount]);

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
                href: application.getUrlForApp(WORKSPACE_CREATE_APP_ID, { absolute: true }),
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
        <EuiFlexGroup direction="row" justifyContent="spaceBetween" alignItems="center">
          <EuiFlexItem grow={false}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <EuiIcon type="wsSelector" size="m" />
              &nbsp;
              <EuiTitle size="m">
                <h2>
                  {i18n.translate('workspace.initial.title', {
                    defaultMessage: 'My workspaces',
                  })}
                </h2>
              </EuiTitle>
            </div>
            <EuiText size="s">
              {i18n.translate('workspace.initial.createWorkspace.describe', {
                defaultMessage: 'Collaborate on use-case based projects with workspaces.',
              })}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>{isDashboardAdmin && createWorkspacePopover}</EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFlexGroup justifyContent="spaceBetween" gutterSize="m">
          {useCaseCards}
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup justifyContent="spaceBetween" gutterSize="m">
          <EuiFlexItem grow={2}>
            <EuiText size="s" style={{ display: 'flex', alignItems: 'center' }}>
              <EuiIcon type="reporter" size="s" color="primary" />
              &nbsp;
              <EuiLink
                href="https://docs.aws.amazon.com/opensearch-service/latest/developerguide/what-is.html"
                target="_blank"
                style={{ fontWeight: 'normal' }}
              >
                {i18n.translate('workspace.initial.button.openSearch', {
                  defaultMessage: 'Learn more from documentation',
                })}
              </EuiLink>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={6}>
            <EuiText size="s" style={{ display: 'flex', alignItems: 'center' }}>
              <EuiIcon type="dashboardApp" size="s" color="primary" />
              &nbsp;
              <EuiLink
                href="https://playground.opensearch.org/"
                target="_blank"
                style={{ fontWeight: 'normal' }}
              >
                {i18n.translate('workspace.initial.button.openSearch', {
                  defaultMessage: 'Explore live demo environment at playground.opensearch.org',
                })}
              </EuiLink>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiText size="s" textAlign="right">
              <EuiLink
                style={{ fontWeight: 'normal' }}
                href={application.getUrlForApp('workspace_list', { absolute: false })}
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
        <EuiIcon type="logoOpenSearch" size="xl" />
        <EuiFlexGroup
          direction="column"
          alignItems="center"
          justifyContent="flexStart"
          style={{ paddingTop: '24px' }}
        >
          <EuiFlexItem grow={false} className="eui-displayInline" style={{ width: '1264px' }}>
            {content}
          </EuiFlexItem>
        </EuiFlexGroup>

        <div className="fixedLeftBottomIcon">
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
          defaultExpandUseCase={defaultUseCaseId}
        />
      )}
    </EuiPage>
  );
};
