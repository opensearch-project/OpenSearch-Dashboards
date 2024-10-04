/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiCheckableCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCompressedFormRow,
  EuiText,
  EuiLink,
  EuiPanel,
  EuiIcon,
  EuiSpacer,
} from '@elastic/eui';
import { ALL_USE_CASE_ID } from '../../../../../core/public';

import { WorkspaceFormErrors, AvailableUseCaseItem } from './types';
import { WorkspaceUseCaseFlyout } from './workspace_use_case_flyout';
import './workspace_use_case.scss';

interface WorkspaceUseCaseCardProps {
  id: string;
  icon?: string;
  title: string;
  checked: boolean;
  disabled?: boolean;
  description: string;
  features: Array<{ id: string; title?: string }>;
  onChange: (id: string) => void;
}

const WorkspaceUseCaseCard = ({
  id,
  icon,
  title,
  description,
  checked,
  disabled,
  onChange,
}: WorkspaceUseCaseCardProps) => {
  const handleChange = useCallback(() => {
    onChange(id);
  }, [id, onChange]);

  return (
    <EuiCheckableCard
      id={id}
      checkableType="radio"
      label={
        <EuiFlexGroup alignItems="center" gutterSize="s">
          {icon && (
            <EuiFlexItem grow={false}>
              <EuiIcon color="subdued" size="l" type={icon} />
            </EuiFlexItem>
          )}
          <EuiFlexItem>
            <EuiText size="s">
              <h4>
                {title}
                {id === ALL_USE_CASE_ID && (
                  <>
                    &nbsp;
                    <EuiText style={{ display: 'inline' }}>
                      <i>
                        {i18n.translate('workspace.forms.useCaseCard.allUseCaseSuffix', {
                          defaultMessage: '(all features)',
                        })}
                      </i>
                    </EuiText>
                  </>
                )}
              </h4>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      }
      checked={checked}
      className="workspace-use-case-item"
      onChange={handleChange}
      data-test-subj={`workspaceUseCase-${id}`}
      disabled={disabled}
      style={{ width: '100%' }}
    >
      <EuiText size="xs">{description}</EuiText>
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
  const [isUseCaseFlyoutVisible, setIsUseCaseFlyoutVisible] = useState(false);
  const handleLearnMoreClick = useCallback(() => {
    setIsUseCaseFlyoutVisible(true);
  }, []);
  const handleFlyoutClose = useCallback(() => {
    setIsUseCaseFlyoutVisible(false);
  }, []);

  return (
    <EuiPanel>
      <EuiText size="s">
        <h2>
          {i18n.translate('workspace.form.panels.useCase.title', {
            defaultMessage: 'Use case and features',
          })}
        </h2>
      </EuiText>
      <EuiText size="xs">
        {i18n.translate('workspace.form.panels.useCase.description', {
          defaultMessage:
            'The use case defines the set of features that will be available in the workspace. You can change the use case later only to one with more features than the current use case.',
        })}
        &nbsp;
        <EuiLink onClick={handleLearnMoreClick}>
          {i18n.translate('workspace.form.panels.useCase.learnMore', {
            defaultMessage: 'Learn more.',
          })}
        </EuiLink>
        {isUseCaseFlyoutVisible && (
          <WorkspaceUseCaseFlyout
            availableUseCases={availableUseCases}
            onClose={handleFlyoutClose}
            defaultExpandUseCase={value}
          />
        )}
      </EuiText>
      <EuiSpacer size="m" />
      <EuiCompressedFormRow
        label={i18n.translate('workspace.form.workspaceUseCase.name.label', {
          defaultMessage: 'Select use case',
        })}
        isInvalid={!!formErrors.features}
        error={formErrors.features?.message}
        fullWidth
      >
        <EuiFlexGroup direction="column" gutterSize="s">
          {availableUseCases.map(({ id, icon, title, description, features, disabled }) => (
            <EuiFlexItem key={id}>
              <WorkspaceUseCaseCard
                id={id}
                icon={icon}
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
    </EuiPanel>
  );
};
