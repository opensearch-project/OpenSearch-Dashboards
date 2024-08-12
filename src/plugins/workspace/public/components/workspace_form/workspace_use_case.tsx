/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState, useEffect, useMemo } from 'react';
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
import type { SavedObjectsStart } from '../../../../../core/public';
import { getIsOnlyAllowEssentialUseCase } from '../../utils';
import { WorkspaceOperationType } from './constants';

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

type AvailableUseCase = Pick<WorkspaceUseCaseObject, 'id' | 'title' | 'description' | 'systematic'>;

export interface WorkspaceUseCaseProps {
  value: string | undefined;
  onChange: (newValue: string) => void;
  formErrors: WorkspaceFormErrors;
  availableUseCases: AvailableUseCase[];
  savedObjects: SavedObjectsStart;
  operationType: WorkspaceOperationType;
}

export const WorkspaceUseCase = ({
  value,
  onChange,
  formErrors,
  availableUseCases,
  savedObjects,
  operationType,
}: WorkspaceUseCaseProps) => {
  const [isOnlyAllowEssential, setIsOnlyAllowEssential] = useState(false);

  useEffect(() => {
    if (operationType === WorkspaceOperationType.Create) {
      getIsOnlyAllowEssentialUseCase(savedObjects.client).then((result: boolean) => {
        setIsOnlyAllowEssential(result);
      });
    }
  }, [savedObjects, operationType]);

  const displayedUseCases = useMemo(() => {
    let allAvailableUseCases = availableUseCases
      .filter((item) => !item.systematic)
      .concat(DEFAULT_NAV_GROUPS.all);
    // When creating and isOnlyAllowEssential is true, only display essential use case
    if (isOnlyAllowEssential && operationType === WorkspaceOperationType.Create) {
      allAvailableUseCases = allAvailableUseCases.filter(
        (item) => item.id === DEFAULT_NAV_GROUPS.essentials.id
      );
    }
    return allAvailableUseCases;
  }, [availableUseCases, isOnlyAllowEssential, operationType]);

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
        {displayedUseCases.map(({ id, title, description }) => (
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
