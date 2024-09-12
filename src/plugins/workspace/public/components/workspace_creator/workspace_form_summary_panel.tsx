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
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspaceFormDataState } from '../workspace_form';
import { WorkspaceUseCase } from '../../types';
import { RightSidebarScrollField, RIGHT_SIDEBAR_SCROLL_KEY } from './utils';

const SCROLL_FIELDS = {
  [RightSidebarScrollField.UseCase]: i18n.translate('workspace.form.summary.panel.useCase.title', {
    defaultMessage: 'Use case',
  }),
  [RightSidebarScrollField.Name]: i18n.translate('workspace.form.summary.panel.name.title', {
    defaultMessage: 'Name',
  }),
  [RightSidebarScrollField.Description]: i18n.translate(
    'workspace.form.summary.panel.description.title',
    {
      defaultMessage: 'Description',
    }
  ),
  [RightSidebarScrollField.Color]: i18n.translate('workspace.form.summary.panel.color.title', {
    defaultMessage: 'Workspace icon',
  }),
  [RightSidebarScrollField.DataSource]: i18n.translate(
    'workspace.form.summary.panel.dataSources.title',
    {
      defaultMessage: 'Data sources',
    }
  ),
  [RightSidebarScrollField.Member]: i18n.translate('workspace.form.summary.panel.members.title', {
    defaultMessage: 'Members',
  }),
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
  texts,
  collapseDisplayCount,
}: {
  texts: string[];
  collapseDisplayCount: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const uniqueTexts = Array.from(new Set(texts));
  const displayedTexts = isExpanded ? uniqueTexts : uniqueTexts.slice(0, collapseDisplayCount);
  return (
    <>
      {displayedTexts.map((text) => (
        <EuiText size="xs" key={text}>
          {text}
        </EuiText>
      ))}
      {uniqueTexts.length > collapseDisplayCount && (
        <EuiLink
          onClick={() => {
            setIsExpanded((flag) => !flag);
          }}
        >
          {isExpanded
            ? i18n.translate('workspace.form.summary.members.showLess', {
                defaultMessage: 'Show less',
              })
            : i18n.translate('workspace.form.summary.members.showAll', {
                defaultMessage: 'Show all',
              })}
        </EuiLink>
      )}
    </>
  );
};

interface WorkspaceFormSummaryPanelProps {
  formData: WorkspaceFormDataState;
  availableUseCases: WorkspaceUseCase[];
  permissionEnabled?: boolean;
}

export const WorkspaceFormSummaryPanel = ({
  formData,
  availableUseCases,
  permissionEnabled,
}: WorkspaceFormSummaryPanelProps) => {
  const useCase = availableUseCases.find((item) => item.id === formData.useCase);
  const userAndGroups = formData.permissionSettings.flatMap((setting) => {
    if ('userId' in setting && !!setting.userId) {
      return [setting.userId];
    }
    if ('group' in setting && !!setting.group) {
      return [setting.group];
    }
    return [];
  });

  return (
    <EuiCard
      title={i18n.translate('workspace.form.summary.panel.title', { defaultMessage: 'Summary' })}
      textAlign="left"
      titleSize="xs"
    >
      <FieldSummaryItem field={RightSidebarScrollField.UseCase}>
        {useCase && (
          <>
            <EuiText size="xs">{useCase.title}</EuiText>
            <EuiText size="xs">{useCase.description}</EuiText>
          </>
        )}
      </FieldSummaryItem>
      <FieldSummaryItem field={RightSidebarScrollField.Name}>{formData.name}</FieldSummaryItem>
      <FieldSummaryItem field={RightSidebarScrollField.Description}>
        {formData.description?.trim()}
      </FieldSummaryItem>
      <FieldSummaryItem field={RightSidebarScrollField.Color}>
        {formData.color && (
          <EuiFlexGroup gutterSize="xs" alignItems="center">
            {useCase?.icon && (
              <EuiFlexItem grow={false}>
                <EuiIcon type={useCase.icon} color={formData.color} />
              </EuiFlexItem>
            )}
            <EuiFlexItem>
              <EuiText size="xs">{formData.color}</EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
      </FieldSummaryItem>
      <FieldSummaryItem field={RightSidebarScrollField.DataSource}>
        {formData.selectedDataSourceConnections.length > 0 && (
          <ExpandableTextList
            texts={formData.selectedDataSourceConnections.map(({ name }) => name)}
            collapseDisplayCount={2}
          />
        )}
      </FieldSummaryItem>
      {permissionEnabled && (
        <FieldSummaryItem bottomGap={false} field={RightSidebarScrollField.Member}>
          {userAndGroups.length > 0 && (
            <ExpandableTextList texts={userAndGroups} collapseDisplayCount={2} />
          )}
        </FieldSummaryItem>
      )}
    </EuiCard>
  );
};
