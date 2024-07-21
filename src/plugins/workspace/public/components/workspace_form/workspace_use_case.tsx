/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiCheckableCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCompressedFormRow,
  EuiText,
} from '@elastic/eui';

import { DEFAULT_NAV_GROUPS } from '../../../../../core/public';
import { WorkspaceUseCase as WorkspaceUseCaseObject } from '../../types';
import { WorkspaceFormErrors } from './types';
import './workspace_use_case.scss';

interface WorkspaceUseCaseCardProps {
  id: string;
  title: string;
  checked: boolean;
  description: string;
  onChange: (id: string) => void;
}

const WorkspaceUseCaseCard = ({
  id,
  title,
  description,
  checked,
  onChange,
}: WorkspaceUseCaseCardProps) => {
  const handleChange = useCallback(() => {
    onChange(id);
  }, [id, onChange]);
  return (
    <EuiCheckableCard
      id={id}
      checkableType="radio"
      style={{ height: '100%' }}
      label={title}
      checked={checked}
      className="workspace-use-case-item"
      onChange={handleChange}
      data-test-subj={`workspaceUseCase-${id}`}
    >
      <EuiText color="subdued" size="xs">
        {description}
      </EuiText>
    </EuiCheckableCard>
  );
};

export interface WorkspaceUseCaseProps {
  value: string | undefined;
  onChange: (newValue: string) => void;
  formErrors: WorkspaceFormErrors;
  availableUseCases: Array<
    Pick<WorkspaceUseCaseObject, 'id' | 'title' | 'description' | 'systematic'>
  >;
}

export const WorkspaceUseCase = ({
  value,
  onChange,
  formErrors,
  availableUseCases,
}: WorkspaceUseCaseProps) => {
  return (
    <EuiCompressedFormRow
      label={i18n.translate('workspace.form.workspaceUseCase.name.label', {
        defaultMessage: 'Use case',
      })}
      isInvalid={!!formErrors.features}
      error={formErrors.features?.message}
      fullWidth
    >
      <EuiFlexGroup>
        {availableUseCases
          .filter((item) => !item.systematic)
          .concat(DEFAULT_NAV_GROUPS.all)
          .map(({ id, title, description }) => (
            <EuiFlexItem key={id}>
              <WorkspaceUseCaseCard
                id={id}
                title={title}
                description={description}
                checked={value === id}
                onChange={onChange}
              />
            </EuiFlexItem>
          ))}
      </EuiFlexGroup>
    </EuiCompressedFormRow>
  );
};
