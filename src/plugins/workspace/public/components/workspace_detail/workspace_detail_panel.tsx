/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiLink,
  EuiText,
  EuiCopy,
  EuiBadge,
  EuiPanel,
  EuiSpacer,
  EuiFlexItem,
  EuiFlexGroup,
  EuiButtonIcon,
  EuiColorPickerSwatch,
} from '@elastic/eui';
import moment from 'moment';
import { i18n } from '@osd/i18n';
import { WorkspaceUseCase } from '../../types';
import { WorkspaceObject } from '../../../../../core/public';
import { WorkspaceAttributeWithPermission } from '../../../../../core/types';

const detailDescription = i18n.translate('workspace.detail.description', {
  defaultMessage: 'Description',
});

const detailUseCase = i18n.translate('workspace.detail.useCase', {
  defaultMessage: 'Use case',
});

const detailIconColor = i18n.translate('workspace.detail.IconColor', {
  defaultMessage: 'Icon color',
});

const detailOwner = i18n.translate('workspace.detail.owner', {
  defaultMessage: 'Owner',
});

const detailLastUpdated = i18n.translate('workspace.detail.lastUpdated', {
  defaultMessage: 'Last updated',
});

const detailID = i18n.translate('workspace.detail.id', {
  defaultMessage: 'ID',
});

const workspaceOverview = i18n.translate('workspace.detail.workspaceOverview', {
  defaultMessage: 'Workspace overview',
});

const overview = i18n.translate('workspace.detail.overview', {
  defaultMessage: 'Overview',
});

function getOwners(currentWorkspace: WorkspaceAttributeWithPermission | null | undefined) {
  if (!currentWorkspace) {
    return null;
  }
  const { groups = [], users = [] } = currentWorkspace.permissions!.write;
  return [...groups, ...users];
}

interface WorkspaceDetailPanelProps {
  useCaseUrl: string;
  handleBadgeClick: () => void;
  currentUseCase: WorkspaceUseCase | undefined;
  currentWorkspace: WorkspaceObject;
}
export const WorkspaceDetailPanel = ({
  useCaseUrl,
  currentUseCase,
  handleBadgeClick,
  currentWorkspace,
}: WorkspaceDetailPanelProps) => {
  const owners = getOwners(currentWorkspace);
  const formatDate = (lastUpdatedTime: string) => {
    return moment(lastUpdatedTime).format('MMM DD, YYYY @ HH:mm:ss.SSS');
  };

  return (
    <EuiPanel>
      <EuiText>
        <h4>{detailDescription}</h4>
        <p>{currentWorkspace.description}</p>
      </EuiText>
      <EuiSpacer />
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiText>
            <h4>{detailUseCase}</h4>
            <p>{currentUseCase?.title}</p>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            <h4>{detailIconColor}</h4>
            <p style={{ display: 'flex', alignItems: 'center' }}>
              <EuiColorPickerSwatch
                style={{ width: '14px', height: '14px', marginRight: '8px' }}
                color={currentWorkspace.color}
              />
              {currentWorkspace.color}
            </p>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            <h4>{detailOwner}</h4>
            <p>
              {owners?.at(0)}&nbsp;
              {owners && owners.length > 1 && (
                <EuiBadge
                  onClick={handleBadgeClick}
                  onClickAriaLabel="MoveToTeamMember"
                  color="hollow"
                >
                  +{owners?.length - 1} more
                </EuiBadge>
              )}
            </p>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            <h4>{detailLastUpdated}</h4>
            <p>{formatDate(currentWorkspace.lastUpdatedTime || '')}</p>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            <h4>{detailID}</h4>
            <p>
              {currentWorkspace.id}
              <EuiCopy textToCopy={currentWorkspace.id}>
                {(copy) => (
                  <EuiButtonIcon
                    aria-label="copy"
                    color="text"
                    size="xs"
                    iconType="copy"
                    onClick={copy}
                    className="eui-alignTop"
                  />
                )}
              </EuiCopy>
            </p>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            <h4>{workspaceOverview}</h4>
            <p>
              <EuiLink href={useCaseUrl} external={true} style={{ fontWeight: 'normal' }}>
                {overview}
              </EuiLink>
            </p>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
