/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState, useMemo } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiCheckableCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCompressedFormRow,
  EuiText,
  EuiLink,
} from '@elastic/eui';

import { ALL_USE_CASE_ID, DEFAULT_NAV_GROUPS } from '../../../../../core/public';
import { WorkspaceFormErrors, AvailableUseCaseItem } from './types';
import './workspace_use_case.scss';

interface WorkspaceUseCaseCardProps {
  id: string;
  title: string;
  checked: boolean;
  disabled?: boolean;
  description: string;
  features: Array<{ id: string; title?: string }>;
  onChange: (id: string) => void;
}

const WorkspaceUseCaseCard = ({
  id,
  title,
  features,
  description,
  checked,
  disabled,
  onChange,
}: WorkspaceUseCaseCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const featureItems = useMemo(() => {
    if (id === DEFAULT_NAV_GROUPS.essentials.id) {
      return [];
    }
    if (id === ALL_USE_CASE_ID) {
      return [
        i18n.translate('workspace.form.useCase.feature.all.discover', {
          defaultMessage: 'Discover',
        }),
        i18n.translate('workspace.form.useCase.feature.all.dashboards', {
          defaultMessage: 'Dashboards',
        }),
        i18n.translate('workspace.form.useCase.feature.all.visualize', {
          defaultMessage: 'Visualize',
        }),
        i18n.translate('workspace.form.useCase.feature.all.observability', {
          defaultMessage: 'Observability services, metrics, traces, and more',
        }),
        i18n.translate('workspace.form.useCase.feature.all.securityAnalytics', {
          defaultMessage: 'Security analytics threat alerts, findings, correlations, and more',
        }),
        i18n.translate('workspace.form.useCase.feature.all.search', {
          defaultMessage: 'Search studio, relevance tuning, vector search, and more',
        }),
      ];
    }

    const featureTitles = features.flatMap((feature) => (feature.title ? [feature.title] : []));
    return featureTitles;
  }, [features, id]);

  const handleChange = useCallback(() => {
    onChange(id);
  }, [id, onChange]);
  const toggleExpanded = useCallback(() => {
    setIsExpanded((flag) => !flag);
  }, []);

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
      disabled={disabled}
    >
      <EuiText size="xs">{description}</EuiText>
      {featureItems.length > 0 && (
        <EuiText size="xs">
          {isExpanded && (
            <>
              {i18n.translate('workspace.form.useCase.featureExpandedTitle', {
                defaultMessage: 'Feature includes:',
              })}
              <ul style={{ marginBottom: 0 }}>
                {featureItems.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </>
          )}
          <EuiLink onClick={toggleExpanded} color="text">
            <u>
              {isExpanded
                ? i18n.translate('workspace.form.useCase.showLessButton', {
                    defaultMessage: 'See less....',
                  })
                : i18n.translate('workspace.form.useCase.showMoreButton', {
                    defaultMessage: 'See more....',
                  })}
            </u>
          </EuiLink>
        </EuiText>
      )}
    </EuiCheckableCard>
  );
};

export interface WorkspaceUseCaseProps {
  value: string | undefined;
  onChange: (newValue: string) => void;
  formErrors: WorkspaceFormErrors;
  availableUseCases: AvailableUseCaseItem[];
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
      <EuiFlexGroup direction="column">
        {availableUseCases.map(({ id, title, description, features, disabled }) => (
          <EuiFlexItem key={id}>
            <WorkspaceUseCaseCard
              id={id}
              title={title}
              description={description}
              checked={value === id}
              features={features}
              onChange={onChange}
              disabled={disabled}
            />
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </EuiCompressedFormRow>
  );
};
