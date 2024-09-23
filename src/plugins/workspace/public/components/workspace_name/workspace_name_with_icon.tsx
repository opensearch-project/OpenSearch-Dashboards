/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiIcon } from '@elastic/eui';
import { WorkspaceAttribute } from 'opensearch-dashboards/public';
import React from 'react';
import { getUseCase } from '../../utils';
import { WorkspaceUseCase } from '../../types';

interface Props {
  workspace: WorkspaceAttribute;
  availableUseCases: WorkspaceUseCase[];
}

export const WorkspaceNameWithIcon = ({ workspace, availableUseCases }: Props) => {
  const useCase = getUseCase(workspace, availableUseCases);

  return (
    <EuiFlexGroup gutterSize="xs" alignItems="center">
      <EuiFlexItem>
        <EuiIcon
          data-test-subj={`${workspace.id}-icon`}
          color={workspace.color}
          type={useCase?.icon || 'wsSelector'}
        />
      </EuiFlexItem>
      <EuiFlexItem>{workspace.name}</EuiFlexItem>
    </EuiFlexGroup>
  );
};
