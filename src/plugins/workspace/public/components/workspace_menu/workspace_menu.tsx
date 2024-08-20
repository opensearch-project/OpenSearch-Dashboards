/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useState, useMemo, useCallback } from 'react';
import { useObservable } from 'react-use';
import {
  EuiText,
  EuiPanel,
  EuiAvatar,
  EuiHorizontalRule,
  EuiButton,
  EuiPopover,
  EuiToolTip,
  EuiFlexItem,
  EuiFieldSearch,
  EuiIcon,
  EuiFlexGroup,
  EuiButtonIcon,
  EuiSmallButtonEmpty,
  EuiButtonEmpty,
} from '@elastic/eui';
import { BehaviorSubject } from 'rxjs';
import { WORKSPACE_CREATE_APP_ID, WORKSPACE_LIST_APP_ID } from '../../../common/constants';
import { CoreStart, WorkspaceObject, debounce } from '../../../../../core/public';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { WorkspaceUseCase } from '../../types';
import { validateWorkspaceColor } from '../../../common/utils';
import { WorkspacePickerContent } from '../workspace_picker_content/workspace_picker_content';

const defaultHeaderName = i18n.translate('workspace.menu.defaultHeaderName', {
  defaultMessage: 'Workspaces',
});

const createWorkspaceButton = i18n.translate('workspace.menu.button.createWorkspace', {
  defaultMessage: 'Create workspace',
});

const searchFieldPlaceholder = i18n.translate('workspace.menu.search.placeholder', {
  defaultMessage: 'Search workspace name',
});

const manageWorkspacesButton = i18n.translate('workspace.menu.button.manageWorkspaces', {
  defaultMessage: 'Manage',
});

const getValidWorkspaceColor = (color?: string) =>
  validateWorkspaceColor(color) ? color : undefined;

interface Props {
  coreStart: CoreStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceMenu = ({ coreStart, registeredUseCases$ }: Props) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const currentWorkspace = useObservable(coreStart.workspaces.currentWorkspace$, null);
  const isDashboardAdmin = coreStart.application.capabilities?.dashboards?.isDashboardAdmin;
  const availableUseCases = useObservable(registeredUseCases$, []);

  const currentWorkspaceName = currentWorkspace?.name ?? defaultHeaderName;

  const [querySearch, setQuerySearch] = useState('');

  const getUseCase = (workspace: WorkspaceObject) => {
    if (!workspace.features) {
      return;
    }
    const useCaseId = getFirstUseCaseOfFeatureConfigs(workspace.features);
    return availableUseCases.find((useCase) => useCase.id === useCaseId);
  };

  const openPopover = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const debouncedSetQueryInput = useMemo(() => {
    return debounce(setQuerySearch, 100);
  }, [setQuerySearch]);

  const handleSearchInput = useCallback(
    (query) => {
      debouncedSetQueryInput(query?.text ?? '');
    },
    [debouncedSetQueryInput]
  );

  const currentWorkspaceButton = currentWorkspace ? (
    <EuiSmallButtonEmpty
      onClick={openPopover}
      data-test-subj="current-workspace-button"
      flush="both"
    >
      <EuiAvatar
        size="s"
        type="space"
        name={currentWorkspace.name}
        color={getValidWorkspaceColor(currentWorkspace.color)}
        initialsLength={2}
      />
    </EuiSmallButtonEmpty>
  ) : (
    <EuiButtonIcon
      iconType="spacesApp"
      onClick={openPopover}
      aria-label="workspace-select-button"
      data-test-subj="workspace-select-button"
    />
  );

  return (
    <EuiPopover
      id="workspaceDropdownMenu"
      display="block"
      button={currentWorkspaceButton}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="s"
      anchorPosition="downCenter"
      repositionOnScroll={true}
    >
      <EuiPanel hasBorder={false} color="transparent">
        <EuiFlexGroup
          justifyContent="spaceAround"
          alignItems="center"
          direction="column"
          gutterSize="m"
        >
          {currentWorkspace ? (
            <>
              <EuiFlexItem grow={false}>
                <EuiIcon size="l" color="plain" name="spacesApp" type="spacesApp" />
              </EuiFlexItem>
              <EuiFlexItem grow={false} data-test-subj="workspace-menu-current-workspace-name">
                <EuiToolTip
                  anchorClassName="eui-textTruncate"
                  position="right"
                  content={currentWorkspaceName}
                >
                  <EuiText
                    textAlign="center"
                    style={{ maxWidth: '195px' }}
                    className="eui-textTruncate"
                  >
                    {currentWorkspaceName}
                  </EuiText>
                </EuiToolTip>
                <EuiText
                  size="xs"
                  data-test-subj="workspace-menu-current-use-case"
                  textAlign="center"
                  color="subdued"
                >
                  {getUseCase(currentWorkspace)?.title ?? ''}
                </EuiText>
              </EuiFlexItem>

              <EuiFlexItem grow={false} style={{ width: '100%' }}>
                <EuiFieldSearch
                  value={querySearch}
                  onChange={(e) => handleSearchInput({ text: e.target.value })}
                  placeholder={searchFieldPlaceholder}
                />
              </EuiFlexItem>
            </>
          ) : (
            <>
              <EuiFlexItem grow={false}>
                <EuiIcon size="l" color="plain" name="spacesApp" type="spacesApp" />
              </EuiFlexItem>
              <EuiFlexItem grow={false} data-test-subj="workspace-menu-current-workspace-name">
                <EuiText textAlign="center">{currentWorkspaceName}</EuiText>
              </EuiFlexItem>

              <EuiFlexItem grow={false} style={{ width: '100%' }}>
                <EuiFieldSearch
                  value={querySearch}
                  onChange={(e) => handleSearchInput({ text: e.target.value })}
                  placeholder={searchFieldPlaceholder}
                />
              </EuiFlexItem>
            </>
          )}
        </EuiFlexGroup>
      </EuiPanel>

      <EuiPanel
        paddingSize="s"
        hasBorder={false}
        color="transparent"
        style={{ height: '25vh', overflow: 'auto' }}
      >
        <WorkspacePickerContent
          searchQuery={querySearch}
          coreStart={coreStart}
          registeredUseCases$={registeredUseCases$}
          onClickWorkspace={() => setPopover(false)}
        />
      </EuiPanel>

      <EuiPanel paddingSize="s" hasBorder={false} color="transparent">
        <EuiHorizontalRule />
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="m">
          {isDashboardAdmin && (
            <>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  color="primary"
                  size="xs"
                  flush="left"
                  data-test-subj="workspace-menu-manage-button"
                  onClick={() => {
                    closePopover();
                    coreStart.application.navigateToApp(WORKSPACE_LIST_APP_ID);
                  }}
                >
                  {manageWorkspacesButton}
                </EuiButtonEmpty>
              </EuiFlexItem>

              <EuiFlexItem grow={false}>
                <EuiButton
                  color="primary"
                  iconType="plus"
                  size="s"
                  key={WORKSPACE_CREATE_APP_ID}
                  data-test-subj="workspace-menu-create-workspace-button"
                  onClick={() => {
                    closePopover();
                    coreStart.application.navigateToApp(WORKSPACE_CREATE_APP_ID);
                  }}
                >
                  {createWorkspaceButton}
                </EuiButton>
              </EuiFlexItem>
            </>
          )}
        </EuiFlexGroup>
      </EuiPanel>
    </EuiPopover>
  );
};
