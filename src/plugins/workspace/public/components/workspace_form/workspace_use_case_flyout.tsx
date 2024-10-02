/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlyoutBody,
  EuiAccordion,
  EuiSpacer,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
} from '@elastic/eui';
import { ALL_USE_CASE_ID } from '../../../../../core/public';

import { AvailableUseCaseItem } from './types';

const WORKSPACE_USE_CASE_FLYOUT_TITLE_ID = 'workspaceUseCaseFlyoutTitle';

export interface WorkspaceUseCaseFlyoutProps {
  onClose: () => void;
  availableUseCases: AvailableUseCaseItem[];
  defaultExpandUseCase?: string;
}

export const WorkspaceUseCaseFlyout = ({
  onClose,
  availableUseCases,
  defaultExpandUseCase,
}: WorkspaceUseCaseFlyoutProps) => {
  return (
    <EuiFlyout
      style={{ maxWidth: 431 }}
      ownFocus
      onClose={onClose}
      aria-labelledby={WORKSPACE_USE_CASE_FLYOUT_TITLE_ID}
      paddingSize="m"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2 id={WORKSPACE_USE_CASE_FLYOUT_TITLE_ID}>
            {i18n.translate('workspace.forms.useCaseFlyout.title', { defaultMessage: 'Use cases' })}
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        {availableUseCases.map(({ id, icon, title, description, features }, index) => (
          <React.Fragment key={id}>
            <EuiAccordion
              id={id}
              buttonContent={
                <EuiFlexGroup gutterSize="s" alignItems="center">
                  {icon && (
                    <EuiFlexItem grow={false}>
                      <EuiIcon color="subdued" type={icon} size="l" />
                    </EuiFlexItem>
                  )}
                  <EuiFlexItem>
                    <EuiText size="s">
                      <h3>
                        {title}
                        {id === ALL_USE_CASE_ID && (
                          <>
                            &nbsp;
                            <EuiText style={{ display: 'inline' }}>
                              <i>
                                {i18n.translate('workspace.forms.useCaseFlyout.allUseCaseSuffix', {
                                  defaultMessage: '(all features)',
                                })}
                              </i>
                            </EuiText>
                          </>
                        )}
                      </h3>
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              }
              paddingSize="l"
              initialIsOpen={id === defaultExpandUseCase}
            >
              <EuiText size="s">
                {description}
                <br />
                {features && features.length > 0 && (
                  <>
                    {i18n.translate('workspace.forms.useCaseFlyout.featuresIncluded', {
                      defaultMessage: 'Features included:',
                    })}
                    <br />
                    <ul>
                      {features.map(({ id: featureId, title: featureTitle, details }) => (
                        <li key={featureId}>
                          <b>
                            {i18n.translate('workspace.forms.useCaseFlyout.featureTitle', {
                              defaultMessage:
                                '{featureTitle}{detailsCount, plural, =0 {} other {: }}',
                              values: { featureTitle, detailsCount: details?.length ?? 0 },
                            })}
                          </b>
                          {details?.join(
                            i18n.translate(
                              'workspace.forms.useCaseFlyout.featuresDetails.delimiter',
                              {
                                defaultMessage: ', ',
                              }
                            )
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </EuiText>
            </EuiAccordion>
            {index < availableUseCases.length - 1 && <EuiSpacer size="m" />}
          </React.Fragment>
        ))}
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};
