/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlyoutBody,
  EuiAccordion,
  EuiSpacer,
  EuiText,
  EuiLink,
} from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';

const WORKSPACE_PRIVACY_FLYOUT_TITLE_ID = 'workspacePrivacyFlyoutTitle';

export interface WorkspacePrivacyFlyoutProps {
  onClose: () => void;
}

export const WorkspacePrivacyFlyout = ({ onClose }: WorkspacePrivacyFlyoutProps) => {
  const {
    services: { docLinks },
  } = useOpenSearchDashboards();

  const WorkspacePrivacyFlyoutItems = [
    {
      id: 'workspacePrivacy',
      title: i18n.translate('workspace.forms.privacyFlyout.workspacePrivacy.title', {
        defaultMessage: 'Workspace privacy',
      }),
      description: i18n.translate('workspace.forms.privacyFlyout.workspacePrivacy.description', {
        defaultMessage: `Workspace privacy is the default access level configured for all. Collaborators will have permissions based on their individual level access and user group participation. Workspace permissions are resolved by the least restrictive option.\n\nFor example, if workspace privacy is set to "Anyone can edit", any collaborator with "Read only" permission will also be able to edit the workspace assets as if their permission is "Read and write", since "Anyone can edit" is the least restrictive permission.\n\nSimilarly, if a workspace collaborator is added with individual permissions, but they belong to a group with less restrictive access, the least restrictive access permission will take precedence.\n\nFor example, if "userA' is added as a collaborator with "read and write" permissions, but they belong to "userGroupB", which has "Admin" permissions, the permissions granted to "userGroupB" will take precedence.`,
      }),
      linkText: i18n.translate('workspace.forms.privacyFlyout.workspacePrivacy.linkText', {
        defaultMessage: 'Learn more in documentation',
      }),
      link: docLinks?.links.opensearchDashboards.workspace.privacy,
    },
    {
      id: 'collaborators',
      title: i18n.translate('workspace.forms.privacyFlyout.collaborator.title', {
        defaultMessage: 'Collaborators',
      }),
      description: i18n.translate('workspace.forms.privacyFlyout.collaborator.description', {
        defaultMessage: `Workspace collaborators include individual users and user groups who have been granted permission to access and interact with the workspace. The collaborators can have Read-only, Read and write, and Admin permission levels within the workspace. Access level to the workspace is defined by each collaborator's individual permission level, their group participation access level, and workspace privacy level. The least restrictive access permission will take precedence.`,
      }),
      linkText: i18n.translate('workspace.forms.privacyFlyout.collaborator.linkText', {
        defaultMessage: 'Learn more in documentation',
      }),
      link: docLinks?.links.opensearchDashboards.workspace.collaborators,
    },
  ];
  return (
    <EuiFlyout
      size="s"
      ownFocus
      onClose={onClose}
      aria-labelledby={WORKSPACE_PRIVACY_FLYOUT_TITLE_ID}
      paddingSize="m"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2 id={WORKSPACE_PRIVACY_FLYOUT_TITLE_ID}>
            {i18n.translate('workspace.forms.privacyFlyout.title', {
              defaultMessage: 'Workspace access',
            })}
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        {WorkspacePrivacyFlyoutItems.map(({ id, title, description, linkText, link }) => (
          <>
            <EuiAccordion
              id={id}
              buttonContent={
                <EuiText size="s">
                  <h3>{title}</h3>
                </EuiText>
              }
              paddingSize="l"
              initialIsOpen={true}
            >
              <EuiText style={{ whiteSpace: 'pre-line' }} size="s">
                {description}
              </EuiText>
              <EuiSpacer />
              <EuiLink href={link} target="_blank" style={{ fontWeight: 'normal' }}>
                {linkText}
              </EuiLink>
            </EuiAccordion>
            <EuiSpacer size="s" />
          </>
        ))}
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};
