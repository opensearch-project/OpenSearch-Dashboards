/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageContent,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { AppCategory, ChromeNavLink, CoreStart } from 'opensearch-dashboards/public';
import React, { useMemo } from 'react';
import { NavigationPublicPluginStart } from '../../../../../../src/plugins/navigation/public';

export interface FeatureCardsProps {
  pageDescription: string;
  navLinks: ChromeNavLink[];
  navigateToApp: CoreStart['application']['navigateToApp'];
  setAppDescriptionControls: CoreStart['application']['setAppDescriptionControls'];
  navigationUI: NavigationPublicPluginStart['ui'];
}

export const FeatureCards = ({
  navLinks,
  navigateToApp,
  setAppDescriptionControls,
  pageDescription,
  navigationUI: { HeaderControl },
}: FeatureCardsProps) => {
  const groupedCardForDisplay = useMemo(() => {
    const grouped: Array<{ category?: AppCategory; navLinks: ChromeNavLink[] }> = [];
    let lastGroup: { category?: AppCategory; navLinks: ChromeNavLink[] } | undefined;
    // The navLinks has already been sorted based on link / category's order,
    // so it is safe to group the links here.
    navLinks.forEach((link) => {
      if (!lastGroup || lastGroup.category?.id !== link.category?.id) {
        lastGroup = { category: link.category, navLinks: [] };
        grouped.push(lastGroup);
      }
      lastGroup.navLinks.push(link);
    });
    return grouped;
  }, [navLinks]);
  if (!navLinks.length) {
    return null;
  }
  return (
    <>
      <HeaderControl
        controls={[
          {
            description: pageDescription,
          },
        ]}
        setMountPoint={setAppDescriptionControls}
      />
      <EuiPageContent hasShadow={false} hasBorder={false} color="transparent" paddingSize="m">
        {groupedCardForDisplay.map((group, groupIndex) => (
          <div key={group.category?.id || groupIndex}>
            {group.category && (
              <EuiTitle>
                <h3>{group.category.label}</h3>
              </EuiTitle>
            )}
            <EuiSpacer size="m" />
            <EuiFlexGroup wrap>
              {group.navLinks.map((link, index) => {
                return (
                  <EuiFlexItem key={link?.id || index} grow={false}>
                    <EuiCard
                      data-test-subj={`landingPageFeature_${link.id}`}
                      textAlign="left"
                      title={link.title}
                      description={link.description || ''}
                      onClick={() => navigateToApp(link.id)}
                      titleSize="xs"
                      style={{ width: 240 }}
                    />
                  </EuiFlexItem>
                );
              })}
            </EuiFlexGroup>
            <EuiSpacer />
          </div>
        ))}
      </EuiPageContent>
    </>
  );
};
