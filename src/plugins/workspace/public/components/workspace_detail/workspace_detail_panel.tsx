/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiText,
  EuiCopy,
  EuiBadge,
  EuiFlexItem,
  EuiFlexGroup,
  EuiButtonIcon,
  EuiIcon,
} from '@elastic/eui';
import moment from 'moment';
import { i18n } from '@osd/i18n';
import { WorkspaceUseCase } from '../../types';
import { WorkspaceObject } from '../../../../../core/public';
import { WorkspaceAttributeWithPermission } from '../../../../../core/types';

const detailUseCase = i18n.translate('workspace.detail.useCase', {
  defaultMessage: 'Use case',
});

const detailOwners = i18n.translate('workspace.detail.owners', {
  defaultMessage: 'Owners',
});

const detailLastUpdated = i18n.translate('workspace.detail.lastUpdated', {
  defaultMessage: 'Last updated',
});

const detailID = i18n.translate('workspace.detail.id', {
  defaultMessage: 'ID',
});

function getOwners(currentWorkspace: WorkspaceAttributeWithPermission) {
  const { groups = [], users = [] } = currentWorkspace?.permissions?.write || {};
  return [...groups, ...users];
}

interface WorkspaceDetailPanelProps {
  handleBadgeClick: () => void;
  currentUseCase: WorkspaceUseCase | undefined;
  currentWorkspace: WorkspaceObject;
  dateFormat: string;
}
export const WorkspaceDetailPanel = ({
  currentUseCase,
  handleBadgeClick,
  currentWorkspace,
  dateFormat,
}: WorkspaceDetailPanelProps) => {
  const owners = getOwners(currentWorkspace);
  const formatDate = (lastUpdatedTime: string) => {
    return moment(lastUpdatedTime).format(dateFormat);
  };

  return (
    <EuiFlexGroup>
      <EuiFlexItem>
        <EuiText>
          <h4>{detailUseCase}</h4>
          {currentUseCase && (
            <EuiFlexGroup gutterSize="xs" alignItems="center">
              {currentUseCase.icon && (
                <EuiFlexItem grow={false}>
                  <EuiIcon type={currentUseCase.icon} color={currentWorkspace.color} />
                </EuiFlexItem>
              )}
              <EuiFlexItem>{currentUseCase.title}</EuiFlexItem>
            </EuiFlexGroup>
          )}
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiText>
          <h4>{detailOwners}</h4>
          <p style={{ display: 'inline-flex' }}>
            {owners?.at(0)}&nbsp;&nbsp;
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
            <EuiCopy
              beforeMessage={i18n.translate('workspace.detail.workspaceIdCopy.beforeMessage', {
                defaultMessage: 'Copy',
              })}
              textToCopy={currentWorkspace.id}
            >
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
    </EuiFlexGroup>
  );
};
