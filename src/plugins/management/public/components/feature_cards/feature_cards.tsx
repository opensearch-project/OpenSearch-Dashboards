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

export interface FeatureCardsProps {
  navLinks: ChromeNavLink[];
  navigateToApp: CoreStart['application']['navigateToApp'];
}

export const FeatureCards = ({ navLinks, navigateToApp }: FeatureCardsProps) => {
  const itemsPerRow = 4;
  const groupedCardForDisplay = useMemo(() => {
    const grouped: Array<{ category?: AppCategory; navLinks: ChromeNavLink[][] }> = [];
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
    <EuiPageContent>
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
  );
};
