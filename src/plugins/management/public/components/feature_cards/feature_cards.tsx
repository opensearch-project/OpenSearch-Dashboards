/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  EuiCard,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageContent,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiPanel,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { AppCategory, ChromeNavLink, CoreStart } from 'opensearch-dashboards/public';
import React, { useMemo } from 'react';

export interface FeatureCardsProps {
  pageTitle: string;
  navLinks: ChromeNavLink[];
  navigateToApp: CoreStart['application']['navigateToApp'];
  getStartedCards: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

const getStartedTitle = i18n.translate('management.gettingStarted.label', {
  defaultMessage: 'Get started',
});

export const FeatureCards = ({
  navLinks,
  navigateToApp,
  pageTitle,
  getStartedCards,
}: FeatureCardsProps) => {
  const itemsPerRow = 4;
  const groupedCardForDisplay = useMemo(() => {
    const grouped: Array<{ category?: AppCategory; navLinks: ChromeNavLink[][] }> = [];
    // The navLinks has already been sorted based on link / category's order,
    // so it is safe to group the links here.
    navLinks.forEach((link) => {
      let lastGroup = grouped.length ? grouped[grouped.length - 1] : undefined;
      if (!lastGroup || lastGroup.category !== link.category) {
        lastGroup = { category: link.category, navLinks: [[]] };
        grouped.push(lastGroup);
      }
      const lastRow = lastGroup.navLinks[lastGroup.navLinks.length - 1];
      if (lastRow.length < itemsPerRow) {
        lastRow.push(link);
      } else {
        lastGroup.navLinks.push([link]);
      }
    });
    return grouped;
  }, [itemsPerRow, navLinks]);
  if (!navLinks.length) {
    return null;
  }
  return (
    <>
      <EuiPageContent borderRadius="none">
        <EuiPageHeader>
          <EuiPageHeaderSection>
            <EuiTitle size="l">
              <h1>{pageTitle}</h1>
            </EuiTitle>
          </EuiPageHeaderSection>
        </EuiPageHeader>
        {getStartedCards.length ? (
          <>
            <EuiSpacer size="s" />
            <EuiTitle>
              <h3>{getStartedTitle}</h3>
            </EuiTitle>
            <EuiFlexGrid columns={4}>
              {getStartedCards.map((card) => {
                return (
                  <EuiFlexItem>
                    <EuiPanel>
                      <EuiCard
                        title={card.title}
                        description={card.description}
                        data-test-subj={`getStartedCard_${card.id}`}
                        textAlign="left"
                        onClick={() => navigateToApp(card.id)}
                        titleSize="xs"
                      />
                    </EuiPanel>
                  </EuiFlexItem>
                );
              })}
            </EuiFlexGrid>
          </>
        ) : null}
      </EuiPageContent>
      <EuiPageContent hasShadow={false} hasBorder={false} color="transparent">
        {groupedCardForDisplay.map((group) => (
          <div key={group.category?.id}>
            {group.category && (
              <EuiTitle>
                <h3>{group.category.label}</h3>
              </EuiTitle>
            )}
            <EuiSpacer />
            {group.navLinks.map((row, rowIndex) => {
              return (
                <EuiFlexGroup data-test-subj={`landingPageRow_${rowIndex}`} key={rowIndex}>
                  {Array.from({ length: itemsPerRow }).map((item, itemIndexInRow) => {
                    const link = row[itemIndexInRow];
                    const content = link ? (
                      <EuiCard
                        data-test-subj={`landingPageFeature_${link.id}`}
                        textAlign="left"
                        title={link.title}
                        description={link.description || link.title}
                        onClick={() => navigateToApp(link.id)}
                        titleSize="xs"
                      />
                    ) : null;
                    return (
                      <EuiFlexItem key={link?.id || itemIndexInRow} grow={1}>
                        {content}
                      </EuiFlexItem>
                    );
                  })}
                </EuiFlexGroup>
              );
            })}
            <EuiSpacer />
          </div>
        ))}
      </EuiPageContent>
    </>
  );
};
