/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiPageTemplate, EuiSpacer, EuiButtonEmpty } from '@elastic/eui';
import { GetStartedSection } from './hero_section';
import { BasicsSection, DataSection } from './section';

export const Homepage: React.FC = () => {
  const sideItems: React.ReactNode[] = [
    <EuiButtonEmpty iconType="indexOpen">Add data</EuiButtonEmpty>,
    <EuiButtonEmpty iconType="gear">Manage</EuiButtonEmpty>,
    <EuiButtonEmpty iconType="wrench">Dev tools</EuiButtonEmpty>,
  ];

  return (
    <EuiPageTemplate
      restrictWidth={1600}
      pageHeader={{
        pageTitle: i18n.translate('home.title', { defaultMessage: 'Home' }),
        rightSideItems: sideItems,
        alignItems: 'center',
      }}
      pageContentProps={{
        color: 'transparent',
        hasBorder: false,
        hasShadow: false,
      }}
      pageContentBodyProps={{
        paddingSize: 'none',
        className: 'home-homepage-pageBody',
      }}
    >
      <GetStartedSection />
      <EuiSpacer size="xs" />
      <DataSection />
      <EuiSpacer size="xs" />
      <BasicsSection />
    </EuiPageTemplate>
  );
};
