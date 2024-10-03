/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  ALL_USE_CASE_ID,
  ChromeNavLink,
  ChromeRegistrationNavLink,
  fulfillRegistrationLinksToChromeNavLinks,
} from '../../../../../core/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';

import { AvailableUseCaseItem } from './types';

interface DisplayedFeature {
  id: string;
  title?: string;
  details?: string[];
}

interface UseCaseWithDisplayedFeatures extends AvailableUseCaseItem {
  displayedFeatures?: DisplayedFeature[];
}

export const fulfillUseCaseWithDisplayedFeatures = ({
  allNavLinks,
  navGroupNavLinks,
  useCase,
}: {
  allNavLinks: ChromeNavLink[];
  navGroupNavLinks: ChromeRegistrationNavLink[];
  useCase: AvailableUseCaseItem;
}) => {
  const visibleNavLinks = allNavLinks.filter((link) => !link.hidden);
  const visibleNavLinksWithinNavGroup = fulfillRegistrationLinksToChromeNavLinks(
    navGroupNavLinks,
    visibleNavLinks
  );
  const displayedFeatures: DisplayedFeature[] = [];
  const category2NavLinks: {
    [key: string]: DisplayedFeature & { details: string[] };
  } = {};
  for (const { id: featureId, title: featureTitle, category } of visibleNavLinksWithinNavGroup) {
    const lowerFeatureId = featureId.toLowerCase();
    // Filter out overview and getting started links
    if (lowerFeatureId.endsWith('overview') || lowerFeatureId.endsWith('started')) {
      continue;
    }
    if (!category) {
      displayedFeatures.push({ id: featureId, title: featureTitle });
      continue;
    }
    // Filter out custom features
    if (category.id === 'custom') {
      continue;
    }
    if (!category2NavLinks[category.id]) {
      category2NavLinks[category.id] = {
        id: category.id,
        title: category.label,
        details: [],
      };
    }
    if (featureTitle) {
      category2NavLinks[category.id].details.push(featureTitle);
    }
  }
  displayedFeatures.push(...Object.values(category2NavLinks));
  return {
    ...useCase,
    displayedFeatures,
  };
};

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
  const [useCaseWithDisplayedFeatures, setUseCaseWithDisplayedFeatures] = useState<
    UseCaseWithDisplayedFeatures[]
  >([]);
  const {
    services: { chrome },
  } = useOpenSearchDashboards();

  useEffect(() => {
    if (!chrome) {
      setUseCaseWithDisplayedFeatures(availableUseCases);
      return;
    }
    const subscription = combineLatest([
      chrome.navGroup.getNavGroupsMap$(),
      chrome.navLinks.getNavLinks$(),
    ])
      .pipe(
        map(([navGroupsMap, allNavLinks]) => {
          return availableUseCases.flatMap((availableUseCase) => {
            const navGroup = navGroupsMap[availableUseCase.id];
            if (!navGroup) {
              return availableUseCase;
            }
            return fulfillUseCaseWithDisplayedFeatures({
              allNavLinks,
              navGroupNavLinks: navGroup.navLinks,
              useCase: availableUseCase,
            });
          });
        })
      )
      .subscribe((fulfilledUseCases) => {
        setUseCaseWithDisplayedFeatures(fulfilledUseCases);
      });
    return () => {
      subscription.unsubscribe();
    };
  }, [chrome, availableUseCases]);

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
        {useCaseWithDisplayedFeatures.map(
          ({ id, icon, title, description, displayedFeatures }, index) => (
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
                                  {i18n.translate(
                                    'workspace.forms.useCaseFlyout.allUseCaseSuffix',
                                    {
                                      defaultMessage: '(all features)',
                                    }
                                  )}
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
                  {Array.isArray(displayedFeatures) && displayedFeatures.length > 0 && (
                    <>
                      {i18n.translate('workspace.forms.useCaseFlyout.featuresIncluded', {
                        defaultMessage: 'Features included:',
                      })}
                      <br />
                      <ul>
                        {displayedFeatures.map(
                          ({ id: featureId, title: featureTitle, details }) => (
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
                          )
                        )}
                      </ul>
                    </>
                  )}
                </EuiText>
              </EuiAccordion>
              {index < useCaseWithDisplayedFeatures.length - 1 && <EuiSpacer size="m" />}
            </React.Fragment>
          )
        )}
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};
