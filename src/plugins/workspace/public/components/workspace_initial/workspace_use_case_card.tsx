/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './workspace_use_case_card.scss';
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
import { WORKSPACE_CREATE_APP_ID, WORKSPACE_LIST_APP_ID } from '../../../common/constants';
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
    'workspace.initial.useCaseCard.{useCaseId}.adminCreateWorkspaceText',
    {
      defaultMessage:
        'Create a workspace or request a workspace owner to add you as a collaborator.',
      values: { useCaseId: useCase.id },
    }
  );
  const noAdminCreateWorkspaceText = i18n.translate(
    'workspace.initial.useCaseCard.{useCaseId}.noAdminCreateWorkspaceText',
    {
      defaultMessage: 'Request a workspace owner to add you as a collaborator.',
      values: { useCaseId: useCase.id },
    }
  );

  const handleClickCreateButton = () => {
    navigateToWorkspacePageWithUseCase(application, useCase.title, WORKSPACE_CREATE_APP_ID);
  };

  const workspaceToItem = (workspace: UpdatedWorkspaceObject) => {
    return (
      <Fragment key={workspace.id}>
        <EuiContextMenuItem
          href={getUseCaseUrl(useCase, workspace, application, http)}
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
    <EuiSplitPanel.Outer style={{ height: '416px', minWidth: '235px' }}>
      <EuiSplitPanel.Inner paddingSize="m" grow={!hasWorkspaces} className={useCase.id}>
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
                  content={i18n.translate(
                    'workspace.initial.useCaseCard.{useCaseId}.information.tooltip',
                    {
                      defaultMessage: '{title} information',
                      values: { useCaseId: useCase.id, title: useCase.title },
                    }
                  )}
                >
                  <EuiButtonIcon
                    aria-label={i18n.translate(
                      'workspace.initial.useCaseCard.{useCaseId}.information.button',
                      {
                        defaultMessage: '{title} information button',
                        values: { useCaseId: useCase.id, title: useCase.title },
                      }
                    )}
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
                  onClick={handleClickCreateButton}
                >
                  {i18n.translate('workspace.initial.useCaseCard.{useCaseId}.button.view', {
                    defaultMessage: 'View all',
                    values: { useCaseId: useCase.id },
                  })}
                </EuiSmallButtonEmpty>
              </EuiFlexItem>
              {isDashboardAdmin && (
                <EuiFlexItem grow={false}>
                  <EuiToolTip
                    position="top"
                    content={i18n.translate(
                      'workspace.initial.useCaseCard.{useCaseId}.button.create',
                      {
                        defaultMessage: 'Create workspace',
                        values: { useCaseId: useCase.id },
                      }
                    )}
                  >
                    <EuiSmallButtonIcon
                      aria-label={i18n.translate(
                        'workspace.initial.useCaseCard.{useCaseId}.button.plus',
                        {
                          defaultMessage: 'Create {title} workspace',
                          values: { useCaseId: useCase.id, title: useCase.title },
                        }
                      )}
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
            className="createWorkspaceTextBorder"
            responsive={false}
          >
            <EuiFlexItem grow={false}>
              <EuiTitle size="xs">
                <h4>
                  {i18n.translate('workspace.initial.useCaseCard.{useCaseId}.noWorkspaces.title', {
                    defaultMessage: 'No workspaces',
                    values: { useCaseId: useCase.id },
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
                  onClick={() => {
                    navigateToWorkspacePageWithUseCase(
                      application,
                      useCase.title,
                      WORKSPACE_CREATE_APP_ID
                    );
                  }}
                >
                  {i18n.translate(
                    'workspace.initial.useCaseCard.{useCaseId}.button.createWorkspace',
                    {
                      defaultMessage: 'Create workspace',
                      values: { useCaseId: useCase.id },
                    }
                  )}
                </EuiSmallButton>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiSplitPanel.Inner>
      )}
    </EuiSplitPanel.Outer>
  );
};
