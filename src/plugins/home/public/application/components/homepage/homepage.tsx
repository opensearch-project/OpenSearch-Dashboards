/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useMount } from 'react-use';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiPageTemplate, EuiButtonEmpty } from '@elastic/eui';
import { Homepage as HomepageType } from '../../../services/section_type/section_type';
import { getServices } from '../../opensearch_dashboards_services';
import { HeroSection } from './hero_section';
import { Section } from './section';

export const Homepage = () => {
  const { sectionTypes, application, chrome } = getServices();
  const getUrl = application.getUrlForApp;

  // TODO: ideally, this should be some sort of observable so changes can be made without having to explicitly hit a save button
  const [homepage, setHomepage] = useState<HomepageType>();
  const [error, setError] = useState();
  const isLoading = !homepage && !error;

  useEffect(() => {
    // TODO: maybe this could have some sort of retry mechanism?
    sectionTypes.getHomepage().then(setHomepage).catch(setError);
  }, [sectionTypes]);

  useMount(() => {
    chrome.setBreadcrumbs([
      {
        text: i18n.translate('home.breadcrumbs.homeTitle', { defaultMessage: 'Home' }),
      },
    ]);
  });

  if (isLoading) {
    return <span>Loading...</span>;
  }

  if (error) {
    // TODO: what is the correct way to handle errors here?
    // eslint-disable-next-line no-console
    console.error(error);

    return <span>Error loading homepage</span>;
  }

  // TODO: this ends up being reversed on the page, so we reverse the array here. There is a performance cost to this, so todo manually reverse it
  const sideItems: React.ReactNode[] = [
    <EuiButtonEmpty iconType="indexOpen" href={getUrl('home', { path: '#/tutorial_directory' })}>
      <FormattedMessage id="home.addData" defaultMessage="Add data" />
    </EuiButtonEmpty>,
    <EuiButtonEmpty iconType="gear" href={getUrl('management')}>
      <FormattedMessage id="home.manage" defaultMessage="Manage" />
    </EuiButtonEmpty>,
    <EuiButtonEmpty iconType="wrench" href={getUrl('dev_tools', { path: '#/console' })}>
      <FormattedMessage id="home.devTools" defaultMessage="Dev tools" />
    </EuiButtonEmpty>,
  ].reverse();

  const hero = homepage!.heroes[0];

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
      {hero && <HeroSection render={hero.render} />}
      {homepage!.sections.map(({ render, title, description, links }, i) => (
        <Section key={i} title={title} description={description} links={links} render={render} />
      ))}
    </EuiPageTemplate>
  );
};
