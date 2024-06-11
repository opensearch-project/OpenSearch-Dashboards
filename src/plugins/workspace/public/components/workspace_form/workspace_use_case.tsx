/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useCallback } from 'react';
import { PublicAppInfo } from 'opensearch-dashboards/public';
import { EuiCheckableCard, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';

import { WORKSPACE_USE_CASES } from '../../../common/constants';
import './workspace_use_case.scss';

const ALL_USE_CASES = [
  WORKSPACE_USE_CASES.observability,
  WORKSPACE_USE_CASES['security-analytics'],
  WORKSPACE_USE_CASES.analytics,
  WORKSPACE_USE_CASES.search,
];

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
      checkableType="checkbox"
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
  configurableApps?: PublicAppInfo[];
  value: string[];
  onChange: (newValue: string[]) => void;
}

export const WorkspaceUseCase = ({ configurableApps, value, onChange }: WorkspaceUseCaseProps) => {
  const availableUseCases = useMemo(() => {
    if (!configurableApps) {
      return [];
    }
    const configurableAppsId = configurableApps.map((app) => app.id);
    return ALL_USE_CASES.filter((useCase) => {
      return useCase.features.some((featureId) => configurableAppsId.includes(featureId));
    });
  }, [configurableApps]);

  const handleCardChange = useCallback(
    (id: string) => {
      if (!value.includes(id)) {
        onChange([...value, id]);
        return;
      }
      onChange(value.filter((item) => item !== id));
    },
    [value, onChange]
  );

  return (
    <EuiFlexGroup>
      {availableUseCases.map(({ id, title, description }) => (
        <EuiFlexItem key={id}>
          <WorkspaceUseCaseCard
            id={id}
            title={title}
            description={description}
            checked={value.includes(id)}
            onChange={handleCardChange}
          />
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
  );
};
