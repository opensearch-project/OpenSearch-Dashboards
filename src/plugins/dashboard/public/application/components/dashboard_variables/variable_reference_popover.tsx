/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  EuiPopover,
  EuiSmallButtonIcon,
  EuiText,
  EuiSpacer,
  EuiCallOut,
  EuiToolTip,
  EuiPopoverTitle,
  EuiPanel,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Variable } from '../../../variables/types';
import { PanelInfo } from '../../../types';
import { DependencyAnalysisResult } from '../../../variables/variable_dependency_analyzer';

export interface VariableReferencePopoverProps {
  /** The variable to show references for */
  variable: Variable;
  /** Pre-computed dependency analysis result for all variables */
  dependencyAnalysis: DependencyAnalysisResult;
  /** Panel information to check for references */
  panels?: PanelInfo[];
}

export const VariableReferencePopover: React.FC<VariableReferencePopoverProps> = ({
  variable,
  dependencyAnalysis,
  panels = [],
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const referenceInfo = useMemo(() => {
    const varInfo = dependencyAnalysis.variables.get(variable.name);

    // Check which explore visualizations reference this variable
    const pattern = new RegExp(`\\$\\{${variable.name}\\}|\\$${variable.name}\\b`);
    const referencingPanels = panels.filter((panel) => pattern.test(panel.query));

    const hasDangerIssue = varInfo?.hasIssues ?? false;
    const isUnused =
      !hasDangerIssue && (varInfo?.dependents.length || 0) === 0 && referencingPanels.length === 0;

    return {
      varInfo,
      referencingPanels,
      hasDangerIssue,
      isUnused,
    };
  }, [variable, dependencyAnalysis, panels]);

  const iconConfig = useMemo(() => {
    if (referenceInfo.hasDangerIssue) {
      return {
        type: 'crossInCircleEmpty',
        color: 'danger' as const,
        tooltip: i18n.translate('dashboard.variableReference.dangerTooltip', {
          defaultMessage: 'This variable has dependency issues',
        }),
      };
    }
    if (referenceInfo.isUnused) {
      return {
        type: 'alert',
        color: 'warning' as const,
        tooltip: i18n.translate('dashboard.variableReference.unusedTooltip', {
          defaultMessage: 'This variable is not referenced by any visualizations or variables',
        }),
      };
    }
    return {
      type: 'branch',
      color: 'text' as const,
      tooltip: i18n.translate('dashboard.variableReference.viewReferences', {
        defaultMessage: 'View references',
      }),
    };
  }, [referenceInfo]);

  const button = (
    <EuiToolTip content={iconConfig.tooltip}>
      <EuiSmallButtonIcon
        iconType={iconConfig.type}
        color={iconConfig.color}
        aria-label={i18n.translate('dashboard.variableReference.ariaLabel', {
          defaultMessage: 'Show variable references',
        })}
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      />
    </EuiToolTip>
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      anchorPosition="leftCenter"
      panelPaddingSize="none"
    >
      <EuiPopoverTitle>{variable.name}</EuiPopoverTitle>
      <EuiPanel
        hasShadow={false}
        hasBorder={false}
        style={{ width: 400, maxHeight: '70vh', overflow: 'auto' }}
      >
        {/* Issues Section */}
        {referenceInfo.hasDangerIssue && referenceInfo.varInfo?.issues && (
          <>
            <EuiCallOut
              title={i18n.translate('dashboard.variableReference.issuesDetected', {
                defaultMessage: 'Dependency issues',
              })}
              color="danger"
              iconType={iconConfig.type}
              size="s"
            >
              <ul>
                {referenceInfo.varInfo.issues.map((issue, index) => (
                  <li key={index}>
                    <EuiText size="xs">{issue.message}</EuiText>
                  </li>
                ))}
              </ul>
            </EuiCallOut>
            <EuiSpacer size="s" />
          </>
        )}

        {/* Used by Variables */}
        {referenceInfo.varInfo && referenceInfo.varInfo.dependents.length > 0 && (
          <>
            <EuiText size="xs" color="subdued">
              <strong>
                {i18n.translate('dashboard.variableReference.usedByVariables', {
                  defaultMessage: 'USED BY VARIABLES',
                })}
              </strong>
            </EuiText>
            <EuiSpacer size="s" />
            <EuiPanel paddingSize="s" color="subdued">
              <ul style={{ listStyleType: 'disc', paddingLeft: 16 }}>
                {referenceInfo.varInfo.dependents.map((dep, index) => (
                  <li key={index}>
                    <EuiText size="s">{dep}</EuiText>
                  </li>
                ))}
              </ul>
            </EuiPanel>
            <EuiSpacer size="s" />
          </>
        )}

        {/* Used by Visualizations */}
        {referenceInfo.referencingPanels.length > 0 && (
          <>
            <EuiText size="xs" color="subdued">
              <strong>
                {i18n.translate('dashboard.variableReference.usedByVisualizations', {
                  defaultMessage: 'USED BY VISUALIZATIONS',
                })}
              </strong>
            </EuiText>
            <EuiSpacer size="s" />
            <EuiPanel paddingSize="s" color="subdued">
              <ul style={{ listStyleType: 'disc', paddingLeft: 16 }}>
                {referenceInfo.referencingPanels.map((panel, index) => (
                  <li key={index}>
                    <EuiText size="s" className="eui-textTruncate" title={panel.title || panel.id}>
                      {panel.title || panel.id}
                    </EuiText>
                  </li>
                ))}
              </ul>
            </EuiPanel>
          </>
        )}

        {/* Unused Warning */}
        {referenceInfo.isUnused && (
          <EuiCallOut
            title={i18n.translate('dashboard.variableReference.unused', {
              defaultMessage: 'Not used',
            })}
            color="warning"
            iconType={iconConfig.type}
            size="s"
          >
            <EuiText size="xs">
              {i18n.translate('dashboard.variableReference.unusedDescription', {
                defaultMessage:
                  'This variable is not referenced by any visualizations or variables',
              })}
            </EuiText>
          </EuiCallOut>
        )}
      </EuiPanel>
    </EuiPopover>
  );
};
