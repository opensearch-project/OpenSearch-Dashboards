/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiPageTemplate, EuiSpacer, EuiButtonEmpty } from '@elastic/eui';
import { GetStartedSection } from './hero_section';
import { BasicsSection, DataSection } from './section';
import { getServices } from '../../opensearch_dashboards_services';

export const Homepage: React.FC<{ olly?: boolean }> = ({ olly = true }) => {
  const services = getServices();
  const getUrl = services.application.getUrlForApp;

  const sideItems: React.ReactNode[] = [
    <EuiButtonEmpty iconType="indexOpen" href={getUrl('home', { path: '#/tutorial_directory' })}>
      Add data
    </EuiButtonEmpty>,
    <EuiButtonEmpty iconType="gear" href={getUrl('management')}>
      Manage
    </EuiButtonEmpty>,
    <EuiButtonEmpty iconType="wrench" href={getUrl('dev_tools', { path: '#/console' })}>
      Dev tools
    </EuiButtonEmpty>,
  ].reverse();

  return (
    <EuiPageTemplate
      restrictWidth={1400}
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
      <GetStartedSection olly={olly} />
      <EuiSpacer size="xs" />
      {!olly && <DataSection initiallyOpen={true} />}
      {!olly && <EuiSpacer size="xs" />}
      <BasicsSection initiallyOpen={!olly} />
    </EuiPageTemplate>
  );
};
