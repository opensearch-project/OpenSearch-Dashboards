/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useObservable } from 'react-use';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiIcon,
  EuiPopover,
  EuiPanel,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { BehaviorSubject } from 'rxjs';
import { CoreStart, WorkspaceObject } from '../../../../../core/public';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { WorkspaceUseCase } from '../../types';
import { validateWorkspaceColor } from '../../../common/utils';
import { WorkspacePickerContent } from '../workspace_picker_content/workspace_picker_content';

const getValidWorkspaceColor = (color?: string) =>
  validateWorkspaceColor(color) ? color : undefined;

interface Props {
  coreStart: CoreStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceSelector = ({ coreStart, registeredUseCases$ }: Props) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const currentWorkspace = useObservable(coreStart.workspaces.currentWorkspace$, null);
  const availableUseCases = useObservable(registeredUseCases$, []);

  const getUseCase = (workspace: WorkspaceObject) => {
    if (!workspace.features) {
      return;
    }
    const useCaseId = getFirstUseCaseOfFeatureConfigs(workspace.features);
    return availableUseCases.find((useCase) => useCase.id === useCaseId);
  };

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const button = currentWorkspace ? (
    <>
      <EuiText
        size="xs"
        // here I try inline style to achive the label looks
        style={{
          position: 'relative',
          bottom: '-10px',
          zIndex: 1,
          padding: '0 5px',
        }}
      >
        <p>worksapce</p>
      </EuiText>
      <EuiPanel paddingSize="s" borderRadius="m">
        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiIcon
              size="l"
              type={getUseCase(currentWorkspace)?.icon || 'wsSelector'}
              color={getValidWorkspaceColor(currentWorkspace.color)}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup direction="column" gutterSize="none">
              <EuiFlexItem grow={false} style={{ maxWidth: '150px' }}>
                <EuiText size="s">
                  <h3 className="eui-textTruncate">{currentWorkspace.name}</h3>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText size="xs" color="subdued">
                  <p>
                    {i18n.translate('workspace.left.nav.selector.description', {
                      defaultMessage: getUseCase(currentWorkspace)?.title || '',
                    })}
                  </p>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ alignSelf: 'center' }} onClick={onButtonClick}>
            <EuiIcon type="arrowDown" size="m" />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </>
  ) : (
    <EuiButton onClick={onButtonClick}>Select a Workspace</EuiButton>
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="s"
      anchorPosition="downRight"
    >
      <WorkspacePickerContent
        coreStart={coreStart}
        registeredUseCases$={registeredUseCases$}
        onClickWorkspace={() => setPopover(false)}
      />
    </EuiPopover>
  );
};
