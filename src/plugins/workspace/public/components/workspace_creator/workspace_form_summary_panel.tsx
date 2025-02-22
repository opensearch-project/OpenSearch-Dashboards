/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
  EuiText,
  EuiTextColor,
  EuiLink,
  EuiBadge,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { WorkspaceFormDataState } from '../workspace_form';
import { WorkspaceUseCase } from '../../types';
import { RightSidebarScrollField, RIGHT_SIDEBAR_SCROLL_KEY } from './utils';
import { WorkspaceCreateActionPanel } from './workspace_create_action_panel';
import { privacyType2TextMap, WorkspacePrivacyItemType } from '../workspace_form/constants';

const SCROLL_FIELDS = {
  [RightSidebarScrollField.Name]: i18n.translate('workspace.form.summary.panel.name.title', {
    defaultMessage: 'Workspace name',
  }),
  [RightSidebarScrollField.Description]: i18n.translate(
    'workspace.form.summary.panel.description.title',
    {
      defaultMessage: 'Description',
    }
  ),
  [RightSidebarScrollField.UseCase]: i18n.translate('workspace.form.summary.panel.useCase.title', {
    defaultMessage: 'Use case',
  }),
  [RightSidebarScrollField.Color]: i18n.translate('workspace.form.summary.panel.color', {
    defaultMessage: 'Color',
  }),
  [RightSidebarScrollField.DataSource]: i18n.translate(
    'workspace.form.summary.panel.dataSources.title',
    {
      defaultMessage: 'Data sources',
    }
  ),
  [RightSidebarScrollField.Collaborators]: i18n.translate(
    'workspace.form.summary.panel.collaborators.title',
    {
      defaultMessage: 'Collaborators',
    }
  ),
  [RightSidebarScrollField.PrivacyType]: i18n.translate(
    'workspace.form.summary.panel.privacyType.title',
    {
      defaultMessage: 'Workspace privacy',
    }
  ),
};

export const FieldSummaryItem = ({
  field,
  children,
  bottomGap = true,
}: React.PropsWithChildren<{
  field: RightSidebarScrollField;
  bottomGap?: boolean;
}>) => {
  const handleTitleClick = useCallback(() => {
    const element = document.querySelector(
      `.workspaceCreateFormContainer [${RIGHT_SIDEBAR_SCROLL_KEY}="${field}"]`
    );

    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [field]);

  return (
    <>
      <EuiText size="xs">
        <h5>
          <EuiLink color="text" onClick={handleTitleClick}>
            <u>{SCROLL_FIELDS[field]}</u>
          </EuiLink>
        </h5>
      </EuiText>
      <EuiSpacer size="xs" />
      <EuiText data-test-subj={`workspaceFormRightSideBarSummary-${field}-Value`} size="xs">
        {!!children ? children : <EuiTextColor color="subdued">&mdash;</EuiTextColor>}
      </EuiText>
      {bottomGap && (
        <>
          <EuiSpacer size="s" />
          <EuiSpacer size="xs" />
        </>
      )}
    </>
  );
};

export const ExpandableTextList = ({
  items,
  collapseDisplayCount,
}: {
  items: React.JSX.Element[];
  collapseDisplayCount: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedItems = isExpanded ? items : items.slice(0, collapseDisplayCount);
  return (
    <>
      {displayedItems}
      {items.length > collapseDisplayCount && (
        <EuiLink
          onClick={() => {
            setIsExpanded((flag) => !flag);
          }}
        >
          <EuiSpacer size="xs" />

          {isExpanded ? (
            <EuiBadge>
              {i18n.translate('workspace.form.summary.items.showLess', {
                defaultMessage: 'Show less',
              })}
            </EuiBadge>
          ) : (
            <EuiBadge>
              {i18n.translate('workspace.form.summary.items.showAll', {
                defaultMessage: '+{itemsOfNumber} more',
                values: { itemsOfNumber: items.length - collapseDisplayCount },
              })}
            </EuiBadge>
          )}
        </EuiLink>
      )}
    </>
  );
};

interface WorkspaceFormSummaryPanelProps {
  formData: Omit<WorkspaceFormDataState, 'permissionSettings'>;
  availableUseCases: WorkspaceUseCase[];
  formId: string;
  application: ApplicationStart;
  isSubmitting: boolean;
  dataSourceEnabled: boolean;
  privacyType: WorkspacePrivacyItemType;
}

export const WorkspaceFormSummaryPanel = ({
  formData,
  availableUseCases,
  formId,
  application,
  isSubmitting,
  dataSourceEnabled,
  privacyType,
}: WorkspaceFormSummaryPanelProps) => {
  const useCase = availableUseCases.find((item) => item.id === formData.useCase);
  const useCaseIcon = useCase?.icon || 'logoOpenSearch';
  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;

  return (
    <EuiCard
      title={i18n.translate('workspace.form.summary.panel.title', { defaultMessage: 'Summary' })}
      textAlign="left"
      titleSize="s"
    >
      <EuiSpacer size="s" />
      <FieldSummaryItem field={RightSidebarScrollField.Name}>
        {formData.name && (
          <EuiFlexGroup gutterSize="xs" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiIcon type={useCaseIcon} color={formData.color} size="l" />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="xs">{formData.name}</EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
      </FieldSummaryItem>
      <FieldSummaryItem field={RightSidebarScrollField.Description}>
        {formData.description?.trim()}
      </FieldSummaryItem>
      <FieldSummaryItem field={RightSidebarScrollField.UseCase}>
        {useCase && <EuiText size="xs">{useCase.title}</EuiText>}
      </FieldSummaryItem>
      {dataSourceEnabled && (
        <FieldSummaryItem field={RightSidebarScrollField.DataSource}>
          {formData.selectedDataSourceConnections.length > 0 && (
            <ExpandableTextList
              items={formData.selectedDataSourceConnections.map((connection) => (
                <ul key={connection.id} style={{ marginBottom: 0 }}>
                  <li>{connection.name}</li>
                </ul>
              ))}
              collapseDisplayCount={3}
            />
          )}
        </FieldSummaryItem>
      )}
      {isPermissionEnabled && (
        <FieldSummaryItem field={RightSidebarScrollField.PrivacyType}>
          {privacyType && <EuiText size="xs">{privacyType2TextMap[privacyType].title}</EuiText>}
        </FieldSummaryItem>
      )}

      <WorkspaceCreateActionPanel
        formData={formData}
        formId={formId}
        application={application}
        isSubmitting={isSubmitting}
        dataSourceEnabled={dataSourceEnabled}
      />
    </EuiCard>
  );
};
