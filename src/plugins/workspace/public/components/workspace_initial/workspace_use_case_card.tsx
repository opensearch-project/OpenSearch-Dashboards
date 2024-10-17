/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './workspace_initial.scss';
import './workspace_use_case_card_gradient_variables.scss';
import { ApplicationStart, HttpSetup, WorkspaceObject } from 'opensearch-dashboards/public';
import {
  EuiText,
  EuiIcon,
  EuiTitle,
  EuiToolTip,
  EuiFlexItem,
  EuiFlexGroup,
  EuiButtonIcon,
  EuiSplitPanel,
  EuiSmallButton,
  EuiHorizontalRule,
  EuiSmallButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiSmallButtonEmpty,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { Fragment, useMemo } from 'react';
import {
  UpdatedWorkspaceObject,
  getWorkspacesWithRecentMessage,
  sortByRecentVisitedAndAlphabetical,
} from './utils';
import { WorkspaceUseCase } from '../../types';
import {
  USE_CASE_CARD_GRADIENT_PREFIX,
  WORKSPACE_CREATE_APP_ID,
  WORKSPACE_LIST_APP_ID,
} from '../../../common/constants';
import { navigateToWorkspacePageWithUseCase } from '../utils/workspace';
import { getFirstUseCaseOfFeatureConfigs, getUseCaseUrl } from '../../utils';

interface WorkspaceUseCaseCardProps {
  useCase: WorkspaceUseCase;
  workspaces: WorkspaceObject[];
  application: ApplicationStart;
  http: HttpSetup;
  isDashboardAdmin: boolean;
  handleClickUseCaseInformation: (useCaseId: string) => void;
}

export const WorkspaceUseCaseCard = ({
  useCase,
  workspaces,
  application,
  http,
  isDashboardAdmin,
  handleClickUseCaseInformation,
}: WorkspaceUseCaseCardProps) => {
  const useCaseIcon = useCase.icon || 'logoOpenSearch';

  // Display the recently accessed workspaces first, and then arrange other workspaces in alphabetical order.
  const sortedWorkspaceList: UpdatedWorkspaceObject[] = useMemo(() => {
    const filterWorkspaces = workspaces.filter(
      (workspace) => getFirstUseCaseOfFeatureConfigs(workspace?.features || []) === useCase.id
    );
    return getWorkspacesWithRecentMessage(filterWorkspaces).sort(
      sortByRecentVisitedAndAlphabetical
    );
  }, [useCase.id, workspaces]);

  const hasWorkspaces = sortedWorkspaceList.length > 0;

  const adminCreateWorkspaceText = i18n.translate(
    'workspace.initial.useCaseCard.adminCreateWorkspaceText',
    {
      defaultMessage:
        'Create a workspace or request a workspace owner to add you as a collaborator.',
    }
  );
  const noAdminCreateWorkspaceText = i18n.translate(
    'workspace.initial.useCaseCard.noAdminCreateWorkspaceText',
    {
      defaultMessage: 'Request a workspace owner to add you as a collaborator.',
    }
  );

  const handleClickCreateButton = () => {
    navigateToWorkspacePageWithUseCase(application, useCase.title, WORKSPACE_CREATE_APP_ID);
  };

  const workspaceToItem = (workspace: UpdatedWorkspaceObject) => {
    return (
      <Fragment key={workspace.id}>
        <EuiContextMenuItem
          href={getUseCaseUrl(useCase, workspace.id, application, http)}
          icon={<EuiIcon type={useCaseIcon} color={workspace.color} size="m" />}
          toolTipContent={workspace.name}
          size="s"
        >
          <EuiText size="s" className="eui-textTruncate" style={{ maxWidth: '190px' }}>
            {workspace.name}
          </EuiText>
          <EuiText size="xs" color="subdued">
            <small style={{ marginLeft: 'auto', color: 'subdued' }}>
              {workspace.visitedMessage}
            </small>
          </EuiText>
        </EuiContextMenuItem>
        <EuiHorizontalRule margin="none" />
      </Fragment>
    );
  };

  return (
    <EuiSplitPanel.Outer style={{ height: '416px', minWidth: '240px' }}>
      <EuiSplitPanel.Inner
        paddingSize="m"
        grow={!hasWorkspaces}
        className={`${USE_CASE_CARD_GRADIENT_PREFIX}__${useCase.id}`}
      >
        <EuiFlexGroup alignItems="center" direction="column" gutterSize="s" responsive={false}>
          <EuiFlexItem>
            <EuiIcon size="l" type={useCaseIcon} />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiTitle size="xs">
              <h4 style={{ display: 'flex', alignItems: 'center' }}>
                {useCase.title}
                <EuiToolTip
                  position="top"
                  content={i18n.translate('workspace.initial.useCaseCard.information.tooltip', {
                    defaultMessage: 'Learn more',
                  })}
                >
                  <EuiButtonIcon
                    aria-label={i18n.translate('workspace.initial.useCaseCard.information.button', {
                      defaultMessage: 'Learn more',
                    })}
                    data-test-subj={`workspace-initial-useCaseCard-${useCase.id}-button-information`}
                    iconSize="m"
                    color="text"
                    iconType="iInCircle"
                    onClick={() => handleClickUseCaseInformation(useCase.id)}
                  />
                </EuiToolTip>
              </h4>
            </EuiTitle>
          </EuiFlexItem>
          {!hasWorkspaces && (
            <EuiFlexItem>
              <EuiText textAlign="center" size="s">
                {useCase.description}
              </EuiText>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiSplitPanel.Inner>
      <EuiHorizontalRule margin="none" />
      {hasWorkspaces ? (
        <>
          <EuiSplitPanel.Inner paddingSize="none">
            <div className="eui-yScrollWithShadows" style={{ maxHeight: '272px' }}>
              <EuiContextMenuPanel
                size="s"
                items={sortedWorkspaceList.map(workspaceToItem)}
                hasFocus={false}
              />
            </div>
          </EuiSplitPanel.Inner>
          <EuiHorizontalRule margin="none" />
          <EuiSplitPanel.Inner paddingSize="s" grow={false}>
            <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiSmallButtonEmpty
                  data-test-subj={`workspace-initial-useCaseCard-${useCase.id}-button-view`}
                  onClick={() =>
                    navigateToWorkspacePageWithUseCase(
                      application,
                      useCase.title,
                      WORKSPACE_LIST_APP_ID
                    )
                  }
                >
                  {i18n.translate('workspace.initial.useCaseCard.button.view', {
                    defaultMessage: 'View all',
                  })}
                </EuiSmallButtonEmpty>
              </EuiFlexItem>
              {isDashboardAdmin && (
                <EuiFlexItem grow={false}>
                  <EuiToolTip
                    position="top"
                    content={i18n.translate('workspace.initial.useCaseCard.button.create', {
                      defaultMessage: 'Create workspace',
                    })}
                  >
                    <EuiSmallButtonIcon
                      aria-label={i18n.translate('workspace.initial.useCaseCard.button.plus', {
                        defaultMessage: 'Create workspace',
                      })}
                      onClick={handleClickCreateButton}
                      display="base"
                      iconType="plus"
                      data-test-subj={`workspace-initial-useCaseCard-${useCase.id}-button-createWorkspace`}
                    />
                  </EuiToolTip>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiSplitPanel.Inner>
        </>
      ) : (
        <EuiSplitPanel.Inner
          paddingSize="m"
          style={{
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <EuiFlexGroup
            direction="column"
            alignItems="center"
            justifyContent="center"
            gutterSize="s"
            className="workspace-initial__create-workspace-text-border"
            responsive={false}
          >
            <EuiFlexItem grow={false}>
              <EuiTitle size="xs">
                <h4>
                  {i18n.translate('workspace.initial.useCaseCard.noWorkspaces.title', {
                    defaultMessage: 'No workspaces',
                  })}
                </h4>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ width: '192px' }}>
              <EuiText textAlign="center" size="s" color="subdued">
                {isDashboardAdmin ? adminCreateWorkspaceText : noAdminCreateWorkspaceText}
              </EuiText>
            </EuiFlexItem>
            {isDashboardAdmin && (
              <EuiFlexItem grow={false}>
                <EuiSmallButton
                  iconType="plus"
                  color="primary"
                  data-test-subj={`workspace-initial-useCaseCard-${useCase.id}-button-createWorkspace`}
                  onClick={handleClickCreateButton}
                >
                  {i18n.translate('workspace.initial.useCaseCard.button.createWorkspace', {
                    defaultMessage: 'Create workspace',
                  })}
                </EuiSmallButton>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiSplitPanel.Inner>
      )}
    </EuiSplitPanel.Outer>
  );
};
