/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApplicationStart, HttpSetup, WorkspaceObject } from 'opensearch-dashboards/public';
import {
  EuiCard,
  EuiCompressedFieldSearch,
  EuiContextMenu,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiContextMenuPanelDescriptor,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPanel,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import React, { useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { WorkspaceUseCase } from '../../types';
import { getUseCaseUrl } from '../../utils';

interface WorkspaceUseCaseCardProps {
  useCase: WorkspaceUseCase;
  workspaces: WorkspaceObject[];
  application: ApplicationStart;
  http: HttpSetup;
}

export const WorkspaceUseCaseCard = ({
  useCase,
  workspaces,
  application,
  http,
}: WorkspaceUseCaseCardProps) => {
  const [searchValue, setSearchValue] = useState<string>('');
  const useCaseIcon = useCase.icon || 'logoOpenSearch';

  const filteredWorkspaces = useMemo(
    () =>
      workspaces.filter((workspace) =>
        workspace.name.toLowerCase().includes(searchValue.toLowerCase())
      ),
    [workspaces, searchValue]
  );

  const workspaceToItem = (workspace: WorkspaceObject) => {
    return (
      <EuiContextMenuItem
        key={workspace.id}
        href={getUseCaseUrl(useCase, workspace, application, http)}
        icon={<EuiIcon type={useCaseIcon} color={workspace.color} size="l" />}
        toolTipContent={workspace.name}
        // style={{ display: 'flex', alignItems: 'center' }}
      >
        {/* <EuiToolTip content={workspace.name} position="bottom"> */}
        <div className="eui-textTruncate" style={{ maxWidth: '150px' }}>
          {workspace.name}
        </div>
        {/* </EuiToolTip> */}
      </EuiContextMenuItem>
    );
  };

  return (
    <EuiFlexItem grow={false}>
      <EuiCard
        style={{ width: '326px', height: '484px', borderRadius: '24px' }}
        layout="horizontal"
        // display="subdued"
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <EuiIcon color="subdued" size="xl" type={useCaseIcon} />
            &nbsp;&nbsp;
            {useCase.title}
          </div>
        }
        description={
          <EuiFlexGroup direction="column" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiText size="s">{useCase.description}</EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiCompressedFieldSearch
                placeholder={i18n.translate('workspace.getStartCard.popover.search.placeholder', {
                  defaultMessage: 'Search',
                })}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <div className="eui-yScrollWithShadows">
                <EuiContextMenuPanel
                  size="s"
                  items={filteredWorkspaces.map(workspaceToItem)}
                  hasFocus={false}
                />
              </div>
            </EuiFlexItem>
          </EuiFlexGroup>
        }
      />
    </EuiFlexItem>
  );
};
